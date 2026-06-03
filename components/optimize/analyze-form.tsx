"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export function AnalyzeForm({
  resumes,
}: {
  resumes: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [resumeId, setResumeId] = useState(resumes[0]?.id ?? "");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeId || !jd.trim()) {
      setError("Select a resume and paste a job description");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(15);

    const tick = setInterval(() => {
      setProgress((p) => Math.min(p + 8, 90));
    }, 200);

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, jobDescription: jd }),
    });
    const data = await res.json();
    clearInterval(tick);
    setProgress(100);
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Analysis failed");
      setProgress(0);
      return;
    }

    router.push(`/dashboard/optimize/${data.optimization.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="resume" className="text-white/80">Resume</Label>
        <select
          id="resume"
          className="flex h-10 w-full rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white transition-shadow focus:shadow-md focus:ring-2 focus:ring-teal-400/50"
          value={resumeId}
          onChange={(e) => setResumeId(e.target.value)}
          disabled={loading}
        >
          {resumes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="jd" className="text-white/80">Job description</Label>
        <Textarea
          id="jd"
          rows={12}
          placeholder="Paste the full job description here…"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          disabled={loading}
          className="bg-white/5 border-white/15 text-white placeholder:text-white/30 transition-all focus:min-h-[200px]"
        />
      </div>

      {loading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-2"
        >
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-white/50 flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Scanning keywords…
          </p>
        </motion.div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-destructive"
        >
          {error}
        </motion.p>
      )}

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          type="submit"
          disabled={loading || !resumes.length}
          className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-violet-600 border-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing…
            </span>
          ) : (
            "Run ATS analysis"
          )}
        </Button>
      </motion.div>
    </form>
  );
}
