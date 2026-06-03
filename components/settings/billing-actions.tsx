"use client";

import { isStripeEnabled } from "@/lib/billing/plans";

export function BillingActions({
  currentPlan,
  engineLabel,
}: {
  currentPlan: string;
  engineLabel: string;
}) {
  const stripeOn = isStripeEnabled();

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Current plan: <strong className="capitalize">{currentPlan}</strong>
      </p>
      <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm space-y-2">
        <p className="font-medium text-emerald-800 dark:text-emerald-200">
          100% free — no payment required
        </p>
        <p className="text-muted-foreground">
          ATS analysis, optimization, PDF export, cover letters, and team invites
          are included at no cost. Intelligence runs on{" "}
          <strong>{engineLabel}</strong> by default (no OpenAI bill).
        </p>
        <p className="text-muted-foreground text-xs">
          Optional: add a free{" "}
          <a
            href="https://console.groq.com"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            Groq API key
          </a>{" "}
          (<code className="text-xs">GROQ_API_KEY</code>) for smarter rewrites.
        </p>
      </div>
      {stripeOn ? (
        <p className="text-xs text-muted-foreground">
          Stripe is configured but not required. All features work without subscribing.
        </p>
      ) : null}
    </div>
  );
}
