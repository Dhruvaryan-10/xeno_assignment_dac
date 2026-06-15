import "dotenv/config";

export const env = {
  port: Number(process.env.CRM_PORT ?? process.env.PORT ?? 4000),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  channelServiceUrl: process.env.CHANNEL_SERVICE_URL ?? "http://localhost:4100",
  crmPublicUrl: process.env.CRM_PUBLIC_URL ?? "http://localhost:4000"
};
