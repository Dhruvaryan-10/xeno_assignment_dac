"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Star, Rocket, Gift, ShoppingCart } from "lucide-react";
import type { CampaignCopy } from "@/lib/api";

type Template = {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  copy: CampaignCopy;
  accent?: string;
  icon?: React.ReactNode;
};

const templates: Template[] = [
  {
    id: "win-back",
    title: "Win Back Customers",
    description: "Re-engage inactive customers with a high-touch offer.",
    prompt: "Find customers who haven't purchased in 90 days and previously spent over INR 2000.",
    copy: {
      title: "We miss you — special offer inside",
      subjectLine: "Come back: exclusive offer just for you",
      messageBody: "Hi {{name}}, we've missed you! Enjoy 20% off your next purchase. Use code WELCOMEBACK at checkout.",
      cta: "Shop now"
    },
    accent: "from-rose-400 to-pink-500",
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: "vip",
    title: "VIP Customers",
    description: "Target high-value customers with exclusive rewards.",
    prompt: "Select customers with total spend over INR 50,000 in the past year.",
    copy: {
      title: "Exclusive VIP offer",
      subjectLine: "A special thank you for our VIPs",
      messageBody: "Hello {{name}}, as a valued VIP, enjoy early access to our new collection and 25% off.",
      cta: "Redeem VIP"
    },
    accent: "from-yellow-400 to-amber-500",
    icon: <Star className="h-5 w-5" />
  },
  {
    id: "product-launch",
    title: "Product Launch",
    description: "Promote a new product to interested customers.",
    prompt: "Customers who viewed category Electronics > Smartphones in last 30 days.",
    copy: {
      title: "Introducing our latest smartphone",
      subjectLine: "New arrival — pre-order now",
      messageBody: "Meet the future of mobile. Pre-order the new XPhone today and get complimentary shipping.",
      cta: "Pre-order"
    },
    accent: "from-sky-400 to-indigo-500",
    icon: <Rocket className="h-5 w-5" />
  },
  {
    id: "festival",
    title: "Festival Sale",
    description: "Seasonal campaign with limited-time discounts.",
    prompt: "Customers in top cities who purchased during last festival season.",
    copy: {
      title: "Festival Sale — up to 50% off",
      subjectLine: "Celebrate with big savings — limited time",
      messageBody: "Don't miss our festival deals across categories. Limited stock — shop now and save big!",
      cta: "Shop festival deals"
    },
    accent: "from-emerald-400 to-teal-500",
    icon: <Gift className="h-5 w-5" />
  },
  {
    id: "abandoned-cart",
    title: "Abandoned Cart",
    description: "Recover carts with timely reminders and incentives.",
    prompt: "Customers who added items to cart but did not complete purchase in last 48 hours.",
    copy: {
      title: "You left something behind",
      subjectLine: "Your cart is waiting — complete checkout",
      messageBody: "Items in your cart are almost gone. Complete your purchase now and get free shipping.",
      cta: "Complete purchase"
    },
    accent: "from-pink-400 to-rose-500",
    icon: <ShoppingCart className="h-5 w-5" />
  }
];

export function CampaignTemplates({ setPrompt, setCopy }: { setPrompt: (p: string) => void; setCopy: (c: CampaignCopy) => void }) {
  function apply(t: Template) {
    setPrompt(t.prompt);
    setCopy(t.copy);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <article
              key={t.id}
              className={cn(
                "group relative flex flex-col justify-between gap-3 rounded-xl border p-4 transition-shadow hover:shadow-lg",
                "bg-card"
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold">{t.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                </div>
                <div className="-mr-1 -mt-1 flex items-center justify-center rounded-lg p-2 text-muted-foreground group-hover:text-primary">
                  <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${t.accent} text-white`}>{t.icon}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => apply(t)} aria-label={`Apply ${t.title}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </Button>
                <Button variant="outline" size="sm" onClick={() => apply(t)}>
                  Use template
                </Button>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignTemplates;
