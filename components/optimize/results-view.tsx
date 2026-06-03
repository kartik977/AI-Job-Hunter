"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FadeIn, StaggerItem, StaggerList } from "@/components/animations/motion";
import type { AtsAnalysis } from "@/types/resume";
import { Loader2 } from "lucide-react";

function AnimatedScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 30);
    const id = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(id);
      } else setDisplay(start);
    }, 30);
    return () => clearInterval(id);
  }, [value]);

  return (
    <motion.span
      className="text-4xl font-bold tabular-nums text-white"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {display}%
    </motion.span>
  );
}

export function OptimizationResultsView({
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finalScore = score ?? analysis.overall_score;

  async function applyOptimization() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optimizationId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Optimization failed");
      return;
    }
    router.push(`/dashboard/resumes/${resumeId}`);
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <FadeIn>
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">ATS Score</h3>
          <div>
            <div className="flex items-center gap-4 mb-2">
              <AnimatedScore value={finalScore} />
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Badge variant={finalScore >= 70 ? "success" : "warning"}>
                  {finalScore >= 70 ? "Strong match" : "Needs work"}
                </Badge>
              </motion.div>
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Progress value={finalScore} />
            </motion.div>
            <p className="mt-4 text-sm text-white/60">{analysis.summary}</p>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.1}>
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Keywords</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2 text-white/80">Matched</p>
              <StaggerList className="flex flex-wrap gap-2">
                {analysis.keyword_matches.map((k) => (
                  <StaggerItem key={k}>
                    <motion.div whileHover={{ scale: 1.08 }}>
                      <Badge variant="success">{k}</Badge>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-white/80">Missing</p>
              <StaggerList className="flex flex-wrap gap-2">
                {analysis.missing_keywords.map((k) => (
                  <StaggerItem key={k}>
                    <motion.div whileHover={{ scale: 1.08 }}>
                      <Badge variant="destructive">{k}</Badge>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerList>
            </div>
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={0.2}>
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Priority actions</h3>
          <div>
            <ul className="space-y-2">
              {analysis.priority_actions.map((a, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="text-sm flex gap-2 text-white/80"
                >
                  <Badge variant="outline" className="border-white/20 text-white/70">
                    {a.impact}
                  </Badge>
                  {a.action}
                </motion.li>
              ))}
            </ul>
          </div>
        </section>
      </FadeIn>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <FadeIn delay={0.25}>
        <div className="flex gap-4">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button onClick={applyOptimization} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Optimizing…
                </span>
              ) : (
                "Apply AI optimization"
              )}
            </Button>
          </motion.div>
          <Link href={`/dashboard/resumes/${resumeId}`}>
            <Button variant="outline">View resume</Button>
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
