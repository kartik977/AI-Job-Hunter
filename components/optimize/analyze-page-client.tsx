"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalyzeForm } from "@/components/optimize/analyze-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlassCard } from "@/components/visuals/glass-card";

export function AnalyzePageClient({
  resumes,
  resumeParam,
}: {
  resumes: { id: string; title: string }[];
  resumeParam?: string;
}) {
  const list = resumeParam
    ? [
        ...resumes.filter((r) => r.id === resumeParam),
        ...resumes.filter((r) => r.id !== resumeParam),
      ]
    : resumes;

  return (
    <DashboardShell
      variant="analyze"
      title="ATS Analysis"
      subtitle="Scan keywords against any job description—instant, visual feedback."
      className="pb-8"
    >
      {list.length === 0 ? (
        <GlassCard className="p-6">
          <p className="text-white/60 mb-4">Upload a resume first.</p>
          <Link href="/dashboard/resumes">
            <Button className="bg-gradient-to-r from-teal-500 to-violet-600 border-0">
              Go to resumes
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 border-violet-500/20">
          <AnalyzeForm resumes={list} />
        </GlassCard>
      )}
    </DashboardShell>
  );
}
