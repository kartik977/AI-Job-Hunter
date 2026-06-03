"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlassCard } from "@/components/visuals/glass-card";
import { OptimizationResultsView } from "@/components/optimize/results-view";
import type { AtsAnalysis } from "@/types/resume";

export function ResultsPageClient({
  optimizationId,
  score,
  analysis,
  resumeId,
}: {
  optimizationId: string;
  score: number | null;
  analysis: AtsAnalysis;
  resumeId: string;
}) {
  return (
    <DashboardShell
      variant="analyze"
      title="Analysis results"
      subtitle="Your ATS breakdown—keywords, gaps, and next steps."
      className="pb-8"
    >
      <GlassCard className="p-6 border-teal-500/20">
        <OptimizationResultsView
          optimizationId={optimizationId}
          score={score}
          analysis={analysis}
          resumeId={resumeId}
        />
      </GlassCard>
    </DashboardShell>
  );
}
