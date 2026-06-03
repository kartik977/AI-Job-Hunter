"use client";

import { PremiumShell } from "@/components/visuals/premium-shell";
import { GlassCard } from "@/components/visuals/glass-card";

export function AuthPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <PremiumShell
        variant="auth"
        dark
        className="min-h-screen flex items-center px-4 py-8"
        contentClassName="w-full max-w-md mx-auto lg:mx-0"
      >
        <GlassCard className="p-6 border-white/15" hover={false}>
          {children}
        </GlassCard>
      </PremiumShell>
    </div>
  );
}
