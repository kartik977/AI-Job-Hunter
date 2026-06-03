"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlassCard } from "@/components/visuals/glass-card";

export function SettingsShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardShell title={title} subtitle={subtitle} className="pb-8">
      <GlassCard className="p-6 max-w-2xl border-white/10">{children}</GlassCard>
    </DashboardShell>
  );
}
