"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  FileText,
  Sparkles,
  Target,
  TrendingUp,
  Shield,
} from "lucide-react";
import { FloatingOrbs } from "@/components/visuals/floating-orbs";
export type SceneVariant =
  | "hero"
  | "resume"
  | "analyze"
  | "jobs"
  | "auth"
  | "minimal"
  | "none";

const RESUME_LINES = [
  "SUMMARY",
  "Engineer with proven ATS wins…",
  "• Shipped features in React & TS",
  "SKILLS",
  "TypeScript · Node · PostgreSQL",
];

function GlassFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full min-h-[300px] md:min-h-[360px] lg:min-h-[400px] rounded-2xl",
        "border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
        "backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden",
        className
      )}
    >
      <FloatingOrbs />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(45,212,191,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(139,92,246,0.1),transparent_50%)]" />
      <div className="relative z-10 h-full flex items-center justify-center p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}

function HeroIllustration() {
  return (
    <GlassFrame>
      <div className="w-full max-w-md space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-teal-400/25 bg-teal-500/10 p-4 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-teal-200/90">ATS match score</span>
            <Sparkles className="h-4 w-4 text-teal-300" />
          </div>
          <div className="flex items-end gap-3">
            <motion.span
              className="text-4xl font-bold bg-gradient-to-r from-teal-300 to-violet-300 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              92%
            </motion.span>
            <motion.div
              className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: "92%" }}
                transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-md"
        >
          <div className="flex gap-3 items-start">
            <div className="h-10 w-10 rounded-lg bg-violet-500/25 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-violet-300" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-2 w-3/4 rounded bg-white/20" />
              <div className="h-2 w-full rounded bg-white/10" />
              <div className="h-2 w-5/6 rounded bg-white/10" />
              <div className="flex gap-1.5 flex-wrap mt-2">
                {["React", "TypeScript", "Node"].map((k, i) => (
                  <motion.span
                    key={k}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/20"
                  >
                    {k}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="flex gap-3 justify-end"
        >
          <div className="rounded-lg border border-pink-400/20 bg-pink-500/10 px-3 py-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-pink-300" />
            <span className="text-xs text-pink-100/90">+24% keywords</span>
          </div>
        </motion.div>
      </div>
    </GlassFrame>
  );
}

function ResumeTyping() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [display, setDisplay] = useState<string[]>([]);

  useEffect(() => {
    const line = RESUME_LINES[lineIndex] ?? "";
    if (charIndex < line.length) {
      const t = setTimeout(() => {
        setDisplay((prev) => {
          const next = [...prev];
          next[lineIndex] = line.slice(0, charIndex + 1);
          return next;
        });
        setCharIndex((c) => c + 1);
      }, 30);
      return () => clearTimeout(t);
    }
    const pause = setTimeout(() => {
      if (lineIndex < RESUME_LINES.length - 1) {
        setLineIndex((i) => i + 1);
        setCharIndex(0);
      } else {
        setTimeout(() => {
          setLineIndex(0);
          setCharIndex(0);
          setDisplay([]);
        }, 2000);
      }
    }, 350);
    return () => clearTimeout(pause);
  }, [lineIndex, charIndex]);

  return (
    <div className="font-mono text-[9px] sm:text-[10px] leading-relaxed text-slate-700 min-h-[88px]">
      {display.map((line, i) => (
        <p
          key={i}
          className={
            ["SUMMARY", "SKILLS"].includes(line) ? "font-bold text-violet-600" : ""
          }
        >
          {line}
          {i === lineIndex && charIndex < (RESUME_LINES[lineIndex]?.length ?? 0) && (
            <span className="inline-block w-1 h-2.5 ml-0.5 bg-violet-500 animate-blink" />
          )}
        </p>
      ))}
      {display.length === 0 && (
        <span className="inline-block w-1 h-2.5 bg-violet-500 animate-blink" />
      )}
    </div>
  );
}

function ResumeIllustration({ compact }: { compact?: boolean }) {
  return (
    <GlassFrame className={compact ? "min-h-[280px]" : undefined}>
      <svg
        viewBox="0 0 360 300"
        className="w-full max-w-sm mx-auto"
        aria-hidden
      >
        <defs>
          <linearGradient id="deskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        <rect x="30" y="218" width="300" height="10" rx="4" fill="url(#deskGrad)" opacity="0.9" />
        <g className="animate-arm-type" style={{ transformOrigin: "120px 175px" }}>
          <ellipse cx="88" cy="228" rx="26" ry="7" fill="#2dd4bf" opacity="0.2" />
          <path d="M68 218 Q88 188 108 218 L102 202 Q88 178 74 202 Z" fill="#334155" />
          <circle cx="88" cy="158" r="20" fill="#ffcba4" stroke="#2dd4bf" strokeWidth="1.5" opacity="0.95" />
          <path d="M48 178 L28 198 L32 208 L52 192 Z" fill="#ffcba4" />
          <path d="M108 172 L148 165 L152 175 L114 186 Z" fill="#ffcba4" className="animate-arm-type" />
        </g>
        <rect x="148" y="168" width="120" height="44" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={156 + i * 13}
            y="202"
            width="9"
            height="5"
            rx="1"
            fill="#64748b"
            className="animate-key-press"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
        <motion.rect
          x="178"
          y="108"
          width="100"
          height="72"
          rx="3"
          fill="white"
          stroke="rgba(45,212,191,0.4)"
          strokeWidth="1.5"
          animate={{ y: [108, 106, 108] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
      <div
        className={cn(
          "absolute rounded-md border border-white/25 bg-white/95 backdrop-blur-md p-3 shadow-xl shadow-teal-500/15",
          compact
            ? "left-1/2 -translate-x-1/2 top-[28%] w-[52%] max-w-[200px]"
            : "left-1/2 -translate-x-1/2 top-[30%] w-[48%] max-w-[210px]"
        )}
      >
        <ResumeTyping />
      </div>
      {!compact && (
        <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-white/50">
          Crafting your ATS-ready story…
        </p>
      )}
    </GlassFrame>
  );
}

function AnalyzeIllustration() {
  const keywords = ["React", "Leadership", "SQL", "Agile", "API"];
  return (
    <GlassFrame>
      <div className="relative flex flex-col items-center">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="url(#scoreGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={326.7}
              initial={{ strokeDashoffset: 326.7 }}
              animate={{ strokeDashoffset: 326.7 * 0.28 }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Target className="h-6 w-6 text-teal-400 mb-1" />
          <span className="text-3xl font-bold text-white">72%</span>
          <span className="text-[10px] text-white/50 mt-0.5">match score</span>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xs">
          {keywords.map((k, i) => (
            <motion.span
              key={k}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08 }}
              className={cn(
                "text-[10px] px-2.5 py-1 rounded-full border",
                i % 2 === 0
                  ? "bg-teal-500/15 text-teal-200 border-teal-400/25"
                  : "bg-violet-500/15 text-violet-200 border-violet-400/25"
              )}
            >
              {k}
            </motion.span>
          ))}
        </div>
      </div>
    </GlassFrame>
  );
}

function JobsIllustration() {
  const cols = [
    { title: "Saved", color: "border-violet-400/30 bg-violet-500/10", cards: 2 },
    { title: "Applied", color: "border-teal-400/30 bg-teal-500/10", cards: 1 },
    { title: "Interview", color: "border-pink-400/30 bg-pink-500/10", cards: 1 },
  ];
  return (
    <GlassFrame>
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-4 text-white/70 text-xs">
          <Briefcase className="h-4 w-4 text-teal-400" />
          Job pipeline
        </div>
        <div className="grid grid-cols-3 gap-3">
          {cols.map((col, ci) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.12 }}
              className={cn("rounded-lg border p-2 min-h-[140px]", col.color)}
            >
              <p className="text-[10px] font-medium text-white/60 mb-2">{col.title}</p>
              {Array.from({ length: col.cards }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ y: ci === 0 && i === 0 ? [0, -4, 0] : 0 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-md bg-white/10 border border-white/10 p-2 mb-2 last:mb-0"
                >
                  <div className="h-1.5 w-3/4 rounded bg-white/25 mb-1.5" />
                  <div className="h-1 w-1/2 rounded bg-white/15" />
                </motion.div>
              ))}
            </motion.div>
          ))}
        </div>
      </div>
    </GlassFrame>
  );
}

function AuthIllustration() {
  return (
    <GlassFrame className="min-h-[280px] md:min-h-[320px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center max-w-xs"
      >
        <motion.div
          animate={{ boxShadow: ["0 0 0 0 rgba(45,212,191,0.3)", "0 0 40px 8px rgba(45,212,191,0.15)", "0 0 0 0 rgba(45,212,191,0.3)"] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500/30 to-violet-600/30 border border-teal-400/30 flex items-center justify-center mb-5"
        >
          <Shield className="h-10 w-10 text-teal-300" />
        </motion.div>
        <p className="text-sm text-white/80 font-medium">Secure, private workspace</p>
        <p className="text-xs text-white/45 mt-2">
          Your resumes and analyses stay encrypted at rest with row-level security.
        </p>
        <div className="flex gap-2 mt-6">
          {["RLS", "OAuth", "HTTPS"].map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50"
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </GlassFrame>
  );
}

export function SceneIllustration({
  variant,
  compact,
  className,
}: {
  variant: SceneVariant;
  compact?: boolean;
  className?: string;
}) {
  const inner = (() => {
    switch (variant) {
      case "hero":
        return <HeroIllustration />;
      case "resume":
        return <ResumeIllustration compact={compact} />;
      case "analyze":
        return <AnalyzeIllustration />;
      case "jobs":
        return <JobsIllustration />;
      case "auth":
        return <AuthIllustration />;
      default:
        return null;
    }
  })();

  if (!inner) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, x: -12 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {inner}
    </motion.div>
  );
}

/** Compact resume scene for upload loading overlay */
export function ResumeLoadingIllustration({ className }: { className?: string }) {
  return (
    <SceneIllustration variant="resume" compact className={className} />
  );
}
