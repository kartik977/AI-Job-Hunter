"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { GlassCard } from "@/components/visuals/glass-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { JobStatus } from "@/types/database";

const COLUMNS: { id: JobStatus; label: string }[] = [
  { id: "saved", label: "Saved" },
  { id: "applied", label: "Applied" },
  { id: "screening", label: "Screening" },
  { id: "interview", label: "Interview" },
  { id: "offer", label: "Offer" },
  { id: "rejected", label: "Rejected" },
];

type Job = {
  id: string;
  company: string;
  title: string;
  status: JobStatus;
};

function DraggableJob({ job }: { job: Job }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: job.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`mb-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <Link href={`/dashboard/jobs/${job.id}`}>
        <GlassCard className="p-3 cursor-grab hover:border-teal-400/30" hover={false}>
          <p className="font-medium text-sm text-white">{job.title}</p>
          <p className="text-xs text-white/50">{job.company}</p>
        </GlassCard>
      </Link>
    </div>
  );
}

function DroppableColumn({
  status,
  label,
  jobs,
}: {
  status: JobStatus;
  label: string;
  jobs: Job[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      className="min-w-[200px] flex-shrink-0"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <GlassCard
        className={`p-0 overflow-hidden min-h-[180px] ${isOver ? "ring-2 ring-teal-400/50 scale-[1.02]" : ""}`}
        hover={false}
      >
        <div className="py-3 px-4 border-b border-white/10 flex justify-between items-center">
          <span className="text-sm font-semibold text-white">{label}</span>
          <Badge className="bg-white/10 text-white/70 border-0">{jobs.length}</Badge>
        </div>
        <div className="px-2 pb-2 pt-2 min-h-[120px]">
          {jobs.map((job) => (
            <DraggableJob key={job.id} job={job} />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function JobsKanbanBoard({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const jobId = active.id as string;
    const newStatus = over.id as JobStatus;
    if (!COLUMNS.some((c) => c.id === newStatus)) return;

    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status === newStatus) return;

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    const supabase = createClient();
    await supabase
      .from("job_applications")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    router.refresh();
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <DroppableColumn
            key={col.id}
            status={col.id}
            label={col.label}
            jobs={jobs.filter((j) => j.status === col.id)}
          />
        ))}
      </div>
    </DndContext>
  );
}
