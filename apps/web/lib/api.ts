const API_URL = process.env.NEXT_PUBLIC_CRM_API_URL ?? "http://localhost:4000";

export type Channel = "WHATSAPP" | "SMS" | "EMAIL" | "RCS";

export type AudiencePreview = {
  filters: Record<string, unknown>;
  audienceSize: number;
  averageSpend: number;
  estimatedRevenue: number;
  sampleCustomers: Array<{ id: string; name: string; city: string; age: number; totalSpend: number; preferredChannel: Channel }>;
};

export type CampaignCopy = {
  title: string;
  subjectLine: string;
  messageBody: string;
  cta: string;
};

export type Recommendation = {
  channel: Channel;
  confidence: number;
  reasoning: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export const api = {
  previewAudience: (prompt: string) => request<AudiencePreview>("/audiences/preview", { method: "POST", body: JSON.stringify({ prompt }) }),
  generateCopy: (body: { prompt: string; audienceSize: number; averageSpend: number; channel?: Channel }) =>
    request<CampaignCopy>("/campaigns/generate", { method: "POST", body: JSON.stringify(body) }),
  recommendChannel: (body: { prompt: string; audienceSize: number; averageSpend: number }) =>
    request<Recommendation>("/channels/recommend", { method: "POST", body: JSON.stringify(body) }),
  createCampaign: (body: Record<string, unknown>) => request<{ id: string }>("/campaigns", { method: "POST", body: JSON.stringify(body) }),
  launchCampaign: (id: string) => request<{ launched: boolean; sent: number }>(`/campaigns/${id}/launch`, { method: "POST" }),
  overview: () => request<any>("/analytics/overview"),
  insights: (id: string) => request<any>(`/campaigns/${id}/insights`),
  segmentHistory: () => request<any[]>("/segments/history")
};
