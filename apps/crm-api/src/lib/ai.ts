import { GoogleGenerativeAI } from "@google/generative-ai";
import { Channel } from "../store.js";
import { env } from "../env.js";
import type { AudienceFilters } from "../types.js";
import { fallbackFilters, normalizeFilters } from "./filters.js";

const model = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey).getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

async function jsonFromGemini<T>(prompt: string, fallback: T): Promise<T> {
  if (!model) return fallback;
  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/```json|```/g, "").trim();
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("Gemini fallback used:", error);
    return fallback;
  }
}

export async function parseAudiencePrompt(prompt: string): Promise<AudienceFilters> {
  const fallback = fallbackFilters(prompt);
  const parsed = await jsonFromGemini<AudienceFilters>(
    `Convert this marketing audience request into JSON filters only. Allowed keys: minSpend, maxSpend, inactiveDays, city, minAge, maxAge, preferredChannel. Channels: WHATSAPP, SMS, EMAIL, RCS. Request: "${prompt}"`,
    fallback
  );
  return normalizeFilters({ ...fallback, ...parsed });
}

export async function generateCampaignCopy(input: {
  prompt: string;
  audienceSize: number;
  averageSpend: number;
  channel?: Channel;
}) {
  return jsonFromGemini(
    `Generate campaign copy as JSON with title, subjectLine, messageBody, cta. Brand voice: premium Indian ecommerce CRM, concise, personalizable with {{name}}. Audience request: ${input.prompt}. Audience size: ${input.audienceSize}. Average spend INR ${input.averageSpend}. Channel: ${input.channel ?? "auto"}.`,
    {
      title: "Win Back High-Value Shoppers",
      subjectLine: "{{name}}, your exclusive comeback reward is ready",
      messageBody:
        "Hi {{name}}, we saved a premium offer for customers who know what they love. Come back today and unlock a curated reward on your next order.",
      cta: "Shop the offer"
    }
  );
}

export async function recommendChannel(input: { prompt: string; audienceSize: number; averageSpend: number; preferredChannel?: Channel }) {
  const fallbackChannel = input.preferredChannel ?? (input.averageSpend > 8000 ? Channel.WHATSAPP : input.audienceSize > 500 ? Channel.SMS : Channel.EMAIL);
  return jsonFromGemini(
    `Recommend one channel for a campaign as JSON with channel, confidence, reasoning. Allowed channels: WHATSAPP, SMS, EMAIL, RCS. Audience prompt: ${input.prompt}. Audience size: ${input.audienceSize}. Average spend INR ${input.averageSpend}.`,
    {
      channel: fallbackChannel,
      confidence: fallbackChannel === Channel.WHATSAPP ? 0.86 : 0.78,
      reasoning:
        fallbackChannel === Channel.WHATSAPP
          ? "High-value and reactivation audiences tend to respond better to conversational, high-visibility messaging."
          : "This channel balances reach and cost for the selected audience profile."
    }
  );
}

export async function generateInsights(metrics: Record<string, number>, campaignTitle: string) {
  return jsonFromGemini(
    `Analyze this campaign performance as JSON with summary, recommendations array, risks array. Campaign: ${campaignTitle}. Metrics: ${JSON.stringify(metrics)}.`,
    {
      summary: "Delivery is healthy; the next lift should come from improving click intent and offer clarity.",
      recommendations: [
        "Test a sharper CTA that names the incentive directly.",
        "Create a second segment for customers with recent category affinity.",
        "Retarget opened-but-not-clicked users within 24 hours."
      ],
      risks: ["Conversion may flatten if the same offer is reused across broad inactive audiences."]
    }
  );
}
