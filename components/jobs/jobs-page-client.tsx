"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlassCard } from "@/components/visuals/glass-card";
import { JobsKanbanBoard } from "@/components/jobs/kanban-board";
import { NewJobForm } from "@/components/jobs/new-job-form";

type Job = {
  id: string;
  company: string;
  title: string;
  status: "saved" | "applied" | "screening" | "interview" | "offer" | "rejected" | "withdrawn";
};

export function JobsPageClient({
  jobs,
  orgId,
  userId,
}: {
  jobs: Job[];
  orgId: string;
  userId: string;
}) {
  return (
    <DashboardShell
      variant="jobs"
      title="Job tracker"
      subtitle="Drag applications through your pipeline—stay organized, stay ahead."
      className="pb-8"
    >
      <GlassCard className="p-6 mb-8 border-pink-500/20">
        <h3 className="text-lg font-semibold text-white mb-4">Add application</h3>
        <NewJobForm orgId={orgId} userId={userId} />
      </GlassCard>
      <JobsKanbanBoard initialJobs={jobs} />
    </DashboardShell>
  );
}
