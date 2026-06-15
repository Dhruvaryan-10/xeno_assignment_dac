"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  Users,
  X
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Activity },
  { label: "Audiences", icon: Users },
  { label: "Campaigns", icon: Send },
  { label: "Analytics", icon: BarChart3 },
  { label: "AI Insights", icon: Sparkles }
];

export function Sidebar({
  mobileOpen,
  onMobileClose
}: {
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [active, setActive] = React.useState("Dashboard");

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/30 transition-opacity duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-full flex-col border-r border-border bg-card shadow-2xl shadow-black/5 transition-transform duration-300 lg:static lg:translate-x-0 lg:w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-20"
        )}
        aria-label="Primary navigation"
      >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 lg:px-5">
        <div className={cn("flex items-center gap-3 transition-opacity duration-300", collapsed && "opacity-0 lg:opacity-100 lg:invisible")}> 
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Xeno Copilot</p>
            <p className="text-xs text-muted-foreground">AI SaaS hub</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileClose} aria-label="Close sidebar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-1 py-4 lg:px-2">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.label;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActive(item.label)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                  collapsed && "justify-center px-2",
                  isActive && "bg-primary text-primary-foreground shadow-sm"
                )}
              >
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200", isActive ? "bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary")}> 
                  <Icon className="h-5 w-5" />
                </span>
                <span className={cn("truncate transition-opacity duration-300", collapsed && "hidden")}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

            <div className={cn("border-t border-border p-4 transition-opacity duration-300", collapsed && "hidden lg:block")}>
        <p className="text-sm font-semibold">Campaign productivity</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Track launch velocity, AI reach, and campaign cadence from a single control panel.
        </p>
        <Button className="mt-4 w-full" variant="default">
          Quick start
        </Button>
      </div>
    </aside>
  </>
  );
}