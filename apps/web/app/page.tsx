"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bot, ChartNoAxesCombined, Menu, Rocket, Send, Sparkles, Users } from "lucide-react";
import { api, type AudiencePreview, type CampaignCopy, type Recommendation } from "@/lib/api";
import { inr } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import AICopilotCard from "@/components/ai-copilot-card";
import CampaignTemplates from "@/components/campaign-templates";
import Customer360Modal from "@/components/customer-360-modal";


const defaultPrompt = "Find customers who spent over INR 5000 and have not purchased in 60 days.";
const emptyCopy: CampaignCopy = { title: "", subjectLine: "", messageBody: "", cta: "" };


export default function DashboardPage() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [copy, setCopy] = useState<CampaignCopy>(emptyCopy);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string>("");
  const [insights, setInsights] = useState<any>(null);
  const [busy, setBusy] = useState<string>("");
  const [toast, setToast] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customer360Open, setCustomer360Open] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  type Section =
  | "Dashboard"
  | "Audiences"
  | "Campaigns"
  | "Analytics"
  | "AI Insights";

const [activeSection, setActiveSection] =
  useState<Section>("Dashboard");

  async function refresh() {
    const [nextOverview, nextSegments] = await Promise.all([api.overview(), api.segmentHistory()]);
    setOverview(nextOverview);
    setSegments(nextSegments);
    if (!activeCampaignId && nextOverview.campaigns?.[0]?.id) setActiveCampaignId(nextOverview.campaigns[0].id);
  }

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 5000);
    return () => clearInterval(interval);
  }, []);

  async function buildAudience() {
    setBusy("audience");
    setToast("");
    try {
      const nextPreview = await api.previewAudience(prompt);
      setPreview(nextPreview);
      const [nextCopy, nextRecommendation] = await Promise.all([
        api.generateCopy({ prompt, audienceSize: nextPreview.audienceSize, averageSpend: nextPreview.averageSpend }),
        api.recommendChannel({ prompt, audienceSize: nextPreview.audienceSize, averageSpend: nextPreview.averageSpend })
      ]);
      setCopy(nextCopy);
      setRecommendation(nextRecommendation);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Audience generation failed.");
    } finally {
      setBusy("");
    }
  }

  async function launch() {
    if (!preview || !recommendation) return;
    setBusy("launch");
    try {
      const campaign = await api.createCampaign({
        audiencePrompt: prompt,
        filters: preview.filters,
        audienceSize: preview.audienceSize,
        estimatedRevenue: preview.estimatedRevenue,
        title: copy.title,
        subjectLine: copy.subjectLine,
        messageBody: copy.messageBody,
        cta: copy.cta,
        channel: recommendation.channel,
        confidence: recommendation.confidence,
        aiReasoning: recommendation.reasoning
      });
      const result = await api.launchCampaign(campaign.id);
      setActiveCampaignId(campaign.id);
      setToast(`Campaign launched to ${result.sent} customers. Live events will stream into analytics.`);
      await refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Launch failed.");
    } finally {
      setBusy("");
    }
  }

  async function loadInsights(id: string) {
    if (!id) return;
    setActiveCampaignId(id);
    setInsights(await api.insights(id));
  }

  const metrics = overview?.statusCounts ?? {};
  const funnel = useMemo(
    () => [
      { name: "Sent", value: (metrics.SENT ?? 0) + (metrics.DELIVERED ?? 0) + (metrics.OPENED ?? 0) + (metrics.CLICKED ?? 0) + (metrics.CONVERTED ?? 0) },
      { name: "Delivered", value: metrics.DELIVERED ?? 0 },
      { name: "Opened", value: metrics.OPENED ?? 0 },
      { name: "Clicked", value: metrics.CLICKED ?? 0 },
      { name: "Converted", value: metrics.CONVERTED ?? 0 }
    ],
    [metrics]
  );

    // AI Copilot card calculations
    const recoverableRevenue = (overview?.campaigns ?? []).reduce((sum: number, c: any) => sum + (c?.estimatedRevenue ?? 0), 0);
    const activeCampaigns = (overview?.campaigns ?? []).filter((c: any) => c?.status === "SENDING" || c?.status === "SENT").length;
    const audienceOpportunities = segments?.length ?? 0;
    const suggestedAction = recommendation ? `Launch ${recommendation.channel} ${recommendation.channel === "WHATSAPP" ? "win-back" : "re-engagement"} campaign for inactive VIP customers.` : "Launch WhatsApp win-back campaign for inactive VIP customers.";
    const totalEvents = Object.values(metrics).reduce((s: number, v: any) => s + (v ?? 0), 0) || 1;
    const predictedConversionRate = Math.round(((metrics.CONVERTED ?? 0) / totalEvents) * 100) || 18;

  return (
    <main className="min-h-screen">
      <div className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Xeno AI Campaign Copilot</h1>
              <p className="text-sm text-muted-foreground">Audience intelligence, launch orchestration, and AI performance strategy.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="relative lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <Sidebar
  activeSection={activeSection}
  setActiveSection={setActiveSection}
  mobileOpen={sidebarOpen}
  onMobileClose={() => setSidebarOpen(false)}
/>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="space-y-5">
          <AICopilotCard
            recoverableRevenue={recoverableRevenue}
            activeCampaigns={activeCampaigns}
            audienceOpportunities={audienceOpportunities}
            suggestedAction={suggestedAction}
            predictedConversionRate={predictedConversionRate}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AI Audience Builder</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Describe the segment in natural language.</p>
              </div>
              <Badge>Gemini-ready</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button onClick={buildAudience} disabled={busy === "audience"}>
                  <Bot className="h-4 w-4" />
                  {busy === "audience" ? "Thinking" : "Build audience"}
                </Button>
                {toast ? <span className="self-center text-sm text-muted-foreground">{toast}</span> : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard icon={<Users className="h-4 w-4" />} label="Audience" value={preview ? preview.audienceSize.toLocaleString("en-IN") : "0"} />
            <MetricCard icon={<ChartNoAxesCombined className="h-4 w-4" />} label="Average spend" value={preview ? inr(preview.averageSpend) : inr(0)} />
            <MetricCard icon={<Rocket className="h-4 w-4" />} label="Estimated revenue" value={preview ? inr(preview.estimatedRevenue) : inr(0)} />
          </div>

          <div className="mt-4">
            <CampaignTemplates setPrompt={setPrompt} setCopy={(c) => setCopy(c)} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>AI Campaign Generator</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <LabeledInput label="Campaign title" value={copy.title} onChange={(value) => setCopy({ ...copy, title: value })} />
              <LabeledInput label="Subject line" value={copy.subjectLine} onChange={(value) => setCopy({ ...copy, subjectLine: value })} />
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Message body</span>
                <Textarea value={copy.messageBody} onChange={(event) => setCopy({ ...copy, messageBody: event.target.value })} className="min-h-32" />
              </label>
              <LabeledInput label="CTA" value={copy.cta} onChange={(value) => setCopy({ ...copy, cta: value })} />
              <div className="rounded-lg border p-4">
                <p className="text-sm font-medium">Channel recommendation</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="border-primary text-foreground">{recommendation?.channel ?? "Pending"}</Badge>
                  <span className="text-sm text-muted-foreground">{recommendation ? `${Math.round(recommendation.confidence * 100)}% confidence` : ""}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{recommendation?.reasoning ?? "Build an audience to get a recommendation."}</p>
              </div>
              <Button onClick={launch} disabled={!preview || !copy.title || busy === "launch"} className="md:col-span-2">
                <Send className="h-4 w-4" />
                {busy === "launch" ? "Launching" : "Launch campaign"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audience Sample</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Customer</th>
                    <th>City</th>
                    <th>Age</th>
                    <th>Spend</th>
                    <th>Preferred</th>
                  </tr>
                </thead>
                <tbody>
                                  {(preview?.sampleCustomers ?? []).map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-t cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setCustomer360Open(true);
                      }}
                    >
                      <td className="py-3 font-medium">{customer.name}</td>
                      <td>{customer.city}</td>
                      <td>{customer.age}</td>
                      <td>{inr(customer.totalSpend)}</td>
                      <td>{customer.preferredChannel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Customer360Modal open={customer360Open} onClose={() => setCustomer360Open(false)} customer={selectedCustomer} />
        </section>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {["DELIVERED", "FAILED", "OPENED", "CLICKED", "CONVERTED"].map((status) => (
                  <div key={status} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">{status}</p>
                    <p className="mt-1 text-2xl font-semibold">{metrics[status] ?? 0}</p>
                  </div>
                ))}
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={funnel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#0f9f8d" fill="#0f9f8d" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.chart ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="opened" fill="#0f9f8d" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clicked" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="converted" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Insight Engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={activeCampaignId}
                onChange={(event) => void loadInsights(event.target.value)}
              >
                <option value="">Select campaign</option>
                {(overview?.campaigns ?? []).map((campaign: any) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
              <Button variant="secondary" onClick={() => void loadInsights(activeCampaignId)} disabled={!activeCampaignId}>
                <Bot className="h-4 w-4" />
                Analyze performance
              </Button>
              <p className="text-sm text-muted-foreground">{insights?.summary ?? "Launch or select a campaign to generate recommendations."}</p>
              <ul className="space-y-2 text-sm">
                {(insights?.recommendations ?? []).map((item: string) => (
                  <li key={item} className="rounded-md bg-muted p-3">{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(overview?.events ?? []).slice(0, 8).map((event: any) => (
                <div key={event.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{event.status}</p>
                    <p className="text-muted-foreground">{event.communication?.customer?.name} · {event.campaign?.title}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Segment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {segments.slice(0, 5).map((segment) => (
                <div key={segment.id} className="rounded-lg border p-3 text-sm">
                  <p className="line-clamp-2 font-medium">{segment.prompt}</p>
                  <p className="mt-1 text-muted-foreground">{segment.audienceSize} customers · {inr(segment.estimatedRevenue)}</p>
                </div>
              ))}
            </CardContent>
            </Card>

            
        </aside>
      </div>
    </div>
</main>
  );
}


function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

