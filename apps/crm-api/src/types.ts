import type { Channel } from "./store.js";

export type AudienceFilters = {
  minSpend?: number;
  maxSpend?: number;
  inactiveDays?: number;
  city?: string;
  minAge?: number;
  maxAge?: number;
  preferredChannel?: Channel;
};

export type AudienceSummary = {
  filters: AudienceFilters;
  audienceSize: number;
  averageSpend: number;
  estimatedRevenue: number;
};
