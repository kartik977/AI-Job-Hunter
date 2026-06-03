"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ResumeUploadForm } from "@/components/resumes/upload-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlassCard } from "@/components/visuals/glass-card";
import { HoverLift, StaggerItem, StaggerList } from "@/components/animations/motion";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

type ResumeRow = {
  id: string;
  title: string;
  file_name: string | null;
  updated_at: string;
};

export function ResumesPageClient({ resumes }: { resumes: ResumeRow[] }) {
  return (
    <DashboardShell
      variant="resume"
      title="Resumes"
      subtitle="Watch your story take shape—upload, parse, and version every draft."
      className="pb-8"
    >
      <GlassCard className="p-6 mb-8 border-teal-500/20">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-teal-400" />
          Upload resume
        </h3>
        <ResumeUploadForm />
      </GlassCard>

      <div className="space-y-4">
        <h2 className="font-semibold text-white/90">Your resumes</h2>
        {resumes.length ? (
          <StaggerList className="grid gap-4">
            {resumes.map((r) => (
              <StaggerItem key={r.id}>
                <Link href={`/dashboard/resumes/${r.id}`}>
                  <HoverLift>
                    <GlassCard className="p-4 flex justify-between items-center group hover:border-teal-400/40">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-teal-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-teal-300 transition-colors">
                            {r.title}
                          </p>
                          <p className="text-sm text-white/50">{r.file_name}</p>
                        </div>
                      </div>
                      <span className="text-xs text-white/40">
                        {formatDate(r.updated_at)}
                      </span>
                    </GlassCard>
                  </HoverLift>
                </Link>
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <p className="text-white/50 text-sm">No resumes yet—upload to get started.</p>
        )}
      </div>
    </DashboardShell>
  );
}
