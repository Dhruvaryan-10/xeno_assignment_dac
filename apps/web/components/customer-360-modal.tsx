"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  age?: number;
  city?: string;
  preferredChannel?: string;
  totalSpend?: number;
  lastPurchaseDate?: string | null;
};

export function Customer360Modal({ open, onClose, customer }: { open: boolean; onClose: () => void; customer: Customer | null }) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !customer) return null;

  const daysSinceLast = customer.lastPurchaseDate ? Math.floor((Date.now() - new Date(customer.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
  const churnRisk = daysSinceLast === Infinity ? "High" : daysSinceLast > 180 ? "High" : daysSinceLast > 90 ? "Medium" : "Low";
  const engagementScore = Math.min(100, Math.round(((customer.totalSpend ?? 0) / 1000) * 10));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-t-lg bg-card p-4 shadow-lg sm:rounded-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Customer 360</h3>
            <p className="text-sm text-muted-foreground">Full profile and engagement metrics</p>
          </div>
          <div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{customer.name}</p>

            <p className="mt-3 text-xs text-muted-foreground">Age</p>
            <p className="font-medium">{customer.age ?? "—"}</p>

            <p className="mt-3 text-xs text-muted-foreground">City</p>
            <p className="font-medium">{customer.city ?? "—"}</p>

            <p className="mt-3 text-xs text-muted-foreground">Preferred Channel</p>
            <p className="font-medium">{customer.preferredChannel ?? "—"}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Lifetime Spend</p>
            <p className="font-medium">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(customer.totalSpend ?? 0)}</p>

            <p className="mt-3 text-xs text-muted-foreground">Last Purchase</p>
            <p className="font-medium">{customer.lastPurchaseDate ? new Date(customer.lastPurchaseDate).toLocaleDateString() : "Never"}</p>

            <p className="mt-3 text-xs text-muted-foreground">Churn Risk</p>
            <p className={cn("font-medium", churnRisk === "High" ? "text-rose-500" : churnRisk === "Medium" ? "text-amber-500" : "text-emerald-500")}>{churnRisk}</p>

            <p className="mt-3 text-xs text-muted-foreground">Engagement Score</p>
            <div className="w-full rounded-full bg-muted/40">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${engagementScore}%` }} />
            </div>
            <p className="text-sm font-semibold">{engagementScore}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customer360Modal;
