import "dotenv/config";
import axios from "axios";
import cors from "cors";
import express from "express";
import { z } from "zod";

const app = express();
const port = Number(process.env.CHANNEL_PORT ?? process.env.PORT ?? 4100);
const statuses = ["DELIVERED", "OPENED", "CLICKED", "CONVERTED"] as const;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callback(callbackUrl: string, body: unknown) {
  try {
    await axios.post(callbackUrl, body);
  } catch (error) {
    console.error("Callback failed", error);
  }
}

async function simulate(communication: { id: string; campaignId: string }, callbackUrl: string) {
  const providerMessageId = `xeno_${Math.random().toString(36).slice(2)}`;
  const failed = Math.random() < 0.07;
  await delay(250 + Math.random() * 1200);
  if (failed) {
    await callback(callbackUrl, { communicationId: communication.id, campaignId: communication.campaignId, status: "FAILED", providerMessageId });
    return;
  }

  for (const status of statuses) {
    const chance = status === "OPENED" ? 0.72 : status === "CLICKED" ? 0.36 : status === "CONVERTED" ? 0.14 : 0.98;
    if (Math.random() <= chance) {
      await callback(callbackUrl, {
        communicationId: communication.id,
        campaignId: communication.campaignId,
        status,
        providerMessageId,
        metadata: { simulated: true, score: Number(Math.random().toFixed(3)) }
      });
      await delay(400 + Math.random() * 2400);
    }
  }
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "channel-service" }));

app.post("/communications/batch", (req, res, next) => {
  try {
    const schema = z.object({
      callbackUrl: z.string().url(),
      communications: z.array(z.object({ id: z.string(), campaignId: z.string(), channel: z.string(), payload: z.record(z.unknown()) }))
    });
    const body = schema.parse(req.body);
    body.communications.forEach((communication) => {
      void simulate(communication, body.callbackUrl);
    });
    res.status(202).json({ accepted: body.communications.length });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(400).json({ error: error instanceof Error ? error.message : "Unknown error" });
});

app.listen(port, () => {
  console.log(`Channel Service running on http://localhost:${port}`);
});
