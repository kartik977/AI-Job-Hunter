"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlassCard } from "@/components/visuals/glass-card";
import { HoverLift, StaggerItem, StaggerList } from "@/components/animations/motion";

export function DashboardOverview({
  plan,
  engineLabel,
  analysesCount,
  analysesLimit,
  resumeCount,
  optimizationsCount,
  recentJobs,
  recentOpts,
  profileName,
}: {
  plan: string;
  engineLabel: string;
  analysesCount: number;
  analysesLimit: number;
  resumeCount: number;
  optimizationsCount: number;
  recentJobs: { id: string; company: string; title: string; status: string }[];
  recentOpts: { id: string; score: number | null; created_at: string }[];
  profileName?: string | null;
}) {
  return (
    <DashboardShell
      title={`Welcome${profileName ? `, ${profileName}` : ""}`}
      subtitle={`Engine: ${engineLabel}. Your command center for ATS wins.`}
      className="pb-4"
    >
      <StaggerList className="grid md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Plan", value: plan, cap: true },
          {
            label: "Analyses",
            value: `${analysesCount}${plan === "free" ? `/${analysesLimit}` : ""}`,
          },
          { label: "Resumes", value: String(resumeCount) },
          { label: "Optimizations", value: String(optimizationsCount) },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <HoverLift>
              <GlassCard className="p-4 border-teal-500/10">
                <p className="text-xs text-white/50">{stat.label}</p>
                <p
                  className={`text-2xl font-bold mt-1 text-white ${stat.cap ? "capitalize" : ""}`}
                >
                  {stat.value}
                </p>
              </GlassCard>
            </HoverLift>
          </StaggerItem>
        ))}
      </StaggerList>

      <div className="flex gap-4 mb-8">
        <Link href="/dashboard/optimize/new">
          <Button className="bg-gradient-to-r from-teal-500 to-violet-600 border-0 shadow-lg shadow-teal-500/20">
            New ATS analysis
          </Button>
        </Link>
        <Link href="/dashboard/resumes">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
            Manage resumes
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-semibold text-white mb-4">Recent jobs</h3>
          <div className="space-y-2">
            {recentJobs.length ? (
              recentJobs.map((j, i) => (
                <motion.div
                  key={j.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/dashboard/jobs/${j.id}`}
                    className="flex justify-between items-center p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm text-white/90">
                      {j.title} @ {j.company}
                    </span>
                    <Badge className="bg-violet-500/20 text-violet-200 border-0">
                      {j.status}
                    </Badge>
                  </Link>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-white/40">No jobs yet.</p>
            )}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="font-semibold text-white mb-4">Recent analyses</h3>
          <div className="space-y-2">
            {recentOpts.length ? (
              recentOpts.map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/dashboard/optimize/${o.id}`}
                    className="flex justify-between p-2 rounded-lg hover:bg-white/5 text-sm text-white/90"
                  >
                    <span>Analysis</span>
                    <Badge className="bg-teal-500/20 text-teal-200 border-0">
                      {o.score ?? "—"}%
                    </Badge>
                  </Link>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-white/40">No analyses yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </DashboardShell>
  );
}
