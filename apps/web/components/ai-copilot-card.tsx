import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Sparkles } from "lucide-react";
import { inr } from "@/lib/utils";

export type AICopilotProps = {
  recoverableRevenue: number;
  activeCampaigns: number;
  audienceOpportunities: number;
  suggestedAction: string;
  predictedConversionRate: number; // 0-100
  className?: string;
};

export function AICopilotCard({
  recoverableRevenue,
  activeCampaigns,
  audienceOpportunities,
  suggestedAction,
  predictedConversionRate,
  className
}: AICopilotProps) {
  return (
    <Card className={cn("overflow-hidden border-0 bg-gradient-to-r from-card to-card/95", className)}>
      <div className="-mx-6 -mt-6 bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 px-6 py-6 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Copilot</h3>
              <p className="mt-1 text-xs text-white/90">Actionable summary and suggested next steps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="!bg-white/10 text-white"> 
              <Bot className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <CardHeader className="pt-6">
        <CardTitle className="text-sm">Overview</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-4">
        <div className="col-span-1 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Recoverable Revenue</p>
          <p className="text-lg font-semibold">{inr(recoverableRevenue)}</p>
        </div>

        <div className="col-span-1 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Active Campaigns</p>
          <p className="text-lg font-semibold">{activeCampaigns}</p>
        </div>

        <div className="col-span-1 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Audience Opportunities</p>
          <p className="text-lg font-semibold">{audienceOpportunities}</p>
        </div>

        <div className="col-span-1 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Predicted Conversion</p>
          <p className="text-lg font-semibold">{predictedConversionRate}%</p>
        </div>

        <div className="md:col-span-4 mt-2 border-t border-border pt-4">
          <p className="text-sm font-medium">Suggested Action</p>
          <p className="mt-2 text-sm text-muted-foreground">{suggestedAction}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AICopilotCard;
