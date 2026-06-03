"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlassCard } from "@/components/visuals/glass-card";
import { formatDate } from "@/lib/utils";
import { Mail } from "lucide-react";

export function CoverLettersClient({
  letters,
}: {
  letters: {
    id: string;
    title: string;
    updated_at: string;
    job_application_id: string;
    company?: string;
    jobTitle?: string;
  }[];
}) {
  return (
    <DashboardShell
      variant="auth"
      title="Cover letters"
      subtitle="Personalized letters tailored to each role."
      className="pb-8"
    >
      {letters.length ? (
        <ul className="space-y-3">
          {letters.map((l, i) => (
            <motion.li
              key={l.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={`/dashboard/cover-letters/${l.id}`}>
                <GlassCard className="p-4 flex items-center gap-3 hover:border-teal-400/30 group">
                  <Mail className="h-5 w-5 text-teal-400" />
                  <div className="flex-1">
                    <p className="font-medium text-white group-hover:text-teal-300">
                      {l.title}
                    </p>
                    {l.company && (
                      <p className="text-sm text-white/50">
                        {l.jobTitle} @ {l.company}
                      </p>
                    )}
                    <p className="text-xs text-white/30 mt-1">
                      {formatDate(l.updated_at)}
                    </p>
                  </div>
                </GlassCard>
              </Link>
            </motion.li>
          ))}
        </ul>
      ) : (
        <p className="text-white/50">Generate cover letters from a job detail page.</p>
      )}
    </DashboardShell>
  );
}
