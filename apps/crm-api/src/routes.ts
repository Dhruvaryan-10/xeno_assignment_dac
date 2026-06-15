import axios from "axios";
import { Router } from "express";
import { z } from "zod";
import { env } from "./env.js";
import { generateCampaignCopy, generateInsights, parseAudiencePrompt, recommendChannel } from "./lib/ai.js";
import { Channel, CommunicationStatus, store, type CommunicationStatus as CommunicationStatusType } from "./store.js";

export const router = Router();

const promptSchema = z.object({ prompt: z.string().min(5) });
const copySchema = z.object({
  prompt: z.string(),
  audienceSize: z.number(),
  averageSpend: z.number(),
  channel: z.nativeEnum(Channel).optional()
});

async function summarizeAudience(prompt: string) {
  const filters = await parseAudiencePrompt(prompt);
  const audience = store.customers(filters);
  const customers = audience.slice(0, 10);
  const audienceSize = audience.length;
  const averageSpend = Number((audience.reduce((sum, customer) => sum + customer.totalSpend, 0) / Math.max(audienceSize, 1)).toFixed(2));
  const estimatedRevenue = Number((audienceSize * averageSpend * 0.08).toFixed(2));
  store.addSegmentHistory({ prompt, filters, audienceSize, averageSpend, estimatedRevenue });
  return { filters, audienceSize, averageSpend, estimatedRevenue, sampleCustomers: customers };
}

router.get("/health", (_req, res) => res.json({ ok: true, service: "crm-api" }));

router.get("/customers", async (req, res) => {
  const take = Math.min(Number(req.query.take ?? 25), 100);
  res.json(store.topCustomers(take));
});

router.post("/audiences/preview", async (req, res, next) => {
  try {
    const { prompt } = promptSchema.parse(req.body);
    res.json(await summarizeAudience(prompt));
  } catch (error) {
    next(error);
  }
});

router.get("/segments/history", async (_req, res) => {
  res.json(store.segmentHistory(12));
});

router.post("/campaigns/generate", async (req, res, next) => {
  try {
    const input = copySchema.parse(req.body);
    res.json(await generateCampaignCopy(input));
  } catch (error) {
    next(error);
  }
});

router.post("/channels/recommend", async (req, res, next) => {
  try {
    const input = copySchema.parse(req.body);
    res.json(await recommendChannel(input));
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns", async (req, res, next) => {
  try {
    const schema = z.object({
      audiencePrompt: z.string(),
      filters: z.record(z.unknown()),
      title: z.string(),
      subjectLine: z.string(),
      messageBody: z.string(),
      cta: z.string(),
      channel: z.nativeEnum(Channel),
      confidence: z.number(),
      aiReasoning: z.string(),
      audienceSize: z.number(),
      estimatedRevenue: z.number()
    });
    const input = schema.parse(req.body);
    const campaign = store.createCampaign({
      title: input.title,
      subjectLine: input.subjectLine,
      messageBody: input.messageBody,
      cta: input.cta,
      channel: input.channel,
      audiencePrompt: input.audiencePrompt,
      filters: input.filters,
      audienceSize: input.audienceSize,
      estimatedRevenue: input.estimatedRevenue,
      confidence: input.confidence,
      aiReasoning: input.aiReasoning
    });
    res.status(201).json(campaign);
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns/:id/launch", async (req, res, next) => {
  try {
    const campaign = store.campaign(req.params.id);
    const customers = store.customers(campaign.filters, 500);
    const communications = customers.map((customer) =>
      store.createCommunication({
        campaignId: campaign.id,
        customerId: customer.id,
        channel: campaign.channel,
        payload: {
          to: campaign.channel === Channel.EMAIL ? customer.email : customer.phone,
          title: campaign.title,
          subjectLine: campaign.subjectLine.replaceAll("{{name}}", customer.name),
          messageBody: campaign.messageBody.replaceAll("{{name}}", customer.name),
          cta: campaign.cta
        }
      })
    );
    store.saveCommunications();
    store.updateCampaign(campaign.id, { status: "SENDING", launchedAt: new Date().toISOString() });

    await axios.post(`${env.channelServiceUrl}/communications/batch`, {
      callbackUrl: `${env.crmPublicUrl}/api/webhooks/channel`,
      communications: communications.map((communication) => ({
        id: communication.id,
        campaignId: campaign.id,
        channel: communication.channel,
        payload: communication.payload
      }))
    });

    res.json({ launched: true, sent: communications.length });
  } catch (error) {
    next(error);
  }
});

router.get("/campaigns", async (_req, res) => {
  res.json(store.campaigns(20));
});

router.get("/campaigns/:id", async (req, res, next) => {
  try {
    res.json({ ...store.campaign(req.params.id), events: store.campaignEvents(req.params.id, 50) });
  } catch (error) {
    next(error);
  }
});

router.get("/analytics/overview", async (_req, res) => {
  const campaigns = store.campaigns(8);
  const grouped = store.statusCounts();
  const statusCounts = Object.fromEntries(Object.values(CommunicationStatus).map((status) => [status, 0]));
  Object.entries(grouped).forEach(([status, count]) => {
    statusCounts[status] = count;
  });
  const chart = campaigns.map((campaign) => {
    const rows = store.statusCounts(campaign.id);
    return { name: campaign.title.slice(0, 18), ...Object.fromEntries(Object.entries(rows).map(([status, count]) => [status.toLowerCase(), count])) };
  });
  const events = store.events(25).map((event) => {
    const communication = store.communication(event.communicationId);
    return {
      ...event,
      campaign: store.campaign(event.campaignId),
      communication: communication ? { ...communication, customer: store.customer(communication.customerId) } : null
    };
  });
  res.json({ campaigns, statusCounts, chart, events });
});

router.get("/campaigns/:id/insights", async (req, res, next) => {
  try {
    const campaign = store.campaign(req.params.id);
    const metrics = store.statusCounts(campaign.id);
    res.json(await generateInsights(metrics, campaign.title));
  } catch (error) {
    next(error);
  }
});

router.post("/webhooks/channel", async (req, res, next) => {
  try {
    const schema = z.object({
      communicationId: z.string(),
      campaignId: z.string(),
      status: z.nativeEnum(CommunicationStatus),
      providerMessageId: z.string().optional(),
      metadata: z.record(z.unknown()).optional()
    });
    const event = schema.parse(req.body);
    store.updateCommunicationEvent({
      campaignId: event.campaignId,
      communicationId: event.communicationId,
      status: event.status as CommunicationStatusType,
      providerMessageId: event.providerMessageId,
      metadata: event.metadata
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
