import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import type { AudienceFilters } from "./types.js";

export const Channel = {
  WHATSAPP: "WHATSAPP",
  SMS: "SMS",
  EMAIL: "EMAIL",
  RCS: "RCS"
} as const;

export type Channel = (typeof Channel)[keyof typeof Channel];

export const CommunicationStatus = {
  QUEUED: "QUEUED",
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  OPENED: "OPENED",
  CLICKED: "CLICKED",
  CONVERTED: "CONVERTED"
} as const;

export type CommunicationStatus = (typeof CommunicationStatus)[keyof typeof CommunicationStatus];

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  age: number;
  preferredChannel: Channel;
  totalSpend: number;
  lastPurchaseDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  customerId: string;
  amount: number;
  category: string;
  orderDate: string;
  createdAt: string;
};

export type SegmentHistory = {
  id: string;
  prompt: string;
  filters: AudienceFilters;
  audienceSize: number;
  averageSpend: number;
  estimatedRevenue: number;
  createdAt: string;
};

export type Campaign = {
  id: string;
  title: string;
  subjectLine: string;
  messageBody: string;
  cta: string;
  channel: Channel;
  status: "DRAFT" | "SENDING" | "SENT" | "PAUSED";
  audiencePrompt: string;
  filters: AudienceFilters;
  audienceSize: number;
  estimatedRevenue: number;
  aiReasoning: string;
  confidence: number;
  createdAt: string;
  launchedAt: string | null;
  updatedAt: string;
};

export type Communication = {
  id: string;
  campaignId: string;
  customerId: string;
  channel: Channel;
  payload: Record<string, unknown>;
  status: CommunicationStatus;
  providerMessageId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CommunicationEvent = {
  id: string;
  campaignId: string;
  communicationId: string;
  status: CommunicationStatus;
  metadata?: Record<string, unknown>;
  occurredAt: string;
};

type Database = {
  customers: Customer[];
  orders: Order[];
  segmentHistory: SegmentHistory[];
  campaigns: Campaign[];
  communications: Communication[];
  events: CommunicationEvent[];
};

const dataFile = resolve(process.env.XENO_DATA_FILE ?? "data/xeno-store.json");
const cities = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow"];
const categories = ["Fashion", "Beauty", "Electronics", "Home", "Grocery", "Fitness", "Travel", "Luxury"];
const channels = Object.values(Channel);

let db = load();

function now() {
  return new Date().toISOString();
}

function load(): Database {
  if (existsSync(dataFile)) {
    return JSON.parse(readFileSync(dataFile, "utf8")) as Database;
  }
  const seeded = seedDatabase();
  persist(seeded);
  return seeded;
}

function persist(nextDb = db) {
  mkdirSync(dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, JSON.stringify(nextDb, null, 2));
}

function seedDatabase(): Database {
  faker.seed(20260614);
  const createdAt = now();
  const customers: Customer[] = Array.from({ length: 1000 }).map(() => ({
    id: randomUUID(),
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number({ style: "international" }),
    city: faker.helpers.arrayElement(cities),
    age: faker.number.int({ min: 18, max: 72 }),
    preferredChannel: faker.helpers.arrayElement(channels),
    totalSpend: 0,
    lastPurchaseDate: null,
    createdAt,
    updatedAt: createdAt
  }));

  const orders: Order[] = Array.from({ length: 5000 }).map(() => {
    const customer = faker.helpers.arrayElement(customers);
    return {
      id: randomUUID(),
      customerId: customer.id,
      amount: faker.number.float({ min: 199, max: 24999, fractionDigits: 2 }),
      category: faker.helpers.arrayElement(categories),
      orderDate: faker.date.recent({ days: 365 }).toISOString(),
      createdAt
    };
  });

  const byCustomer = new Map<string, Order[]>();
  orders.forEach((order) => byCustomer.set(order.customerId, [...(byCustomer.get(order.customerId) ?? []), order]));
  customers.forEach((customer) => {
    const customerOrders = byCustomer.get(customer.id) ?? [];
    customer.totalSpend = Number(customerOrders.reduce((sum, order) => sum + order.amount, 0).toFixed(2));
    customer.lastPurchaseDate = customerOrders.sort((a, b) => b.orderDate.localeCompare(a.orderDate))[0]?.orderDate ?? null;
  });

  return { customers, orders, segmentHistory: [], campaigns: [], communications: [], events: [] };
}

function matchesFilters(customer: Customer, filters: AudienceFilters) {
  if (filters.minSpend !== undefined && customer.totalSpend < filters.minSpend) return false;
  if (filters.maxSpend !== undefined && customer.totalSpend > filters.maxSpend) return false;
  if (filters.city && customer.city.toLowerCase() !== filters.city.toLowerCase()) return false;
  if (filters.minAge !== undefined && customer.age < filters.minAge) return false;
  if (filters.maxAge !== undefined && customer.age > filters.maxAge) return false;
  if (filters.preferredChannel && customer.preferredChannel !== filters.preferredChannel) return false;
  if (filters.inactiveDays) {
    if (!customer.lastPurchaseDate) return true;
    const cutoff = Date.now() - filters.inactiveDays * 24 * 60 * 60 * 1000;
    if (new Date(customer.lastPurchaseDate).getTime() >= cutoff) return false;
  }
  return true;
}

export const store = {
  customers(filters: AudienceFilters = {}, take?: number) {
    const rows = db.customers.filter((customer) => matchesFilters(customer, filters)).sort((a, b) => b.totalSpend - a.totalSpend);
    return take ? rows.slice(0, take) : rows;
  },
  topCustomers(take = 25) {
    return [...db.customers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, take);
  },
  addSegmentHistory(segment: Omit<SegmentHistory, "id" | "createdAt">) {
    const row = { ...segment, id: randomUUID(), createdAt: now() };
    db.segmentHistory.unshift(row);
    persist();
    return row;
  },
  segmentHistory(take = 12) {
    return db.segmentHistory.slice(0, take);
  },
  createCampaign(input: Omit<Campaign, "id" | "status" | "createdAt" | "updatedAt" | "launchedAt">) {
    const timestamp = now();
    const campaign: Campaign = { ...input, id: randomUUID(), status: "DRAFT", createdAt: timestamp, updatedAt: timestamp, launchedAt: null };
    db.campaigns.unshift(campaign);
    persist();
    return campaign;
  },
  updateCampaign(id: string, patch: Partial<Campaign>) {
    const campaign = db.campaigns.find((item) => item.id === id);
    if (!campaign) throw new Error("Campaign not found");
    Object.assign(campaign, patch, { updatedAt: now() });
    persist();
    return campaign;
  },
  campaigns(take = 20) {
    return db.campaigns.slice(0, take);
  },
  campaign(id: string) {
    const campaign = db.campaigns.find((item) => item.id === id);
    if (!campaign) throw new Error("Campaign not found");
    return campaign;
  },
  createCommunication(input: Omit<Communication, "id" | "status" | "createdAt" | "updatedAt">) {
    const timestamp = now();
    const communication: Communication = { ...input, id: randomUUID(), status: CommunicationStatus.QUEUED, createdAt: timestamp, updatedAt: timestamp };
    db.communications.push(communication);
    return communication;
  },
  saveCommunications() {
    persist();
  },
  updateCommunicationEvent(input: {
    communicationId: string;
    campaignId: string;
    status: CommunicationStatus;
    providerMessageId?: string;
    metadata?: Record<string, unknown>;
  }) {
    const communication = db.communications.find((item) => item.id === input.communicationId);
    if (!communication) throw new Error("Communication not found");
    communication.status = input.status;
    communication.providerMessageId = input.providerMessageId;
    communication.updatedAt = now();
    const event: CommunicationEvent = {
      id: randomUUID(),
      campaignId: input.campaignId,
      communicationId: input.communicationId,
      status: input.status,
      metadata: input.metadata,
      occurredAt: now()
    };
    db.events.unshift(event);
    persist();
    return event;
  },
  events(take = 25) {
    return db.events.slice(0, take);
  },
  campaignEvents(campaignId: string, take = 50) {
    return db.events.filter((event) => event.campaignId === campaignId).slice(0, take);
  },
  statusCounts(campaignId?: string) {
    const rows = campaignId ? db.communications.filter((item) => item.campaignId === campaignId) : db.communications;
    return rows.reduce<Record<string, number>>((counts, communication) => {
      counts[communication.status] = (counts[communication.status] ?? 0) + 1;
      return counts;
    }, {});
  },
  communication(id: string) {
    return db.communications.find((item) => item.id === id);
  },
  customer(id: string) {
    return db.customers.find((item) => item.id === id);
  }
};
