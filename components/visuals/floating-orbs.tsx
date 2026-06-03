"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FloatingOrbs({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      {[
        { color: "#2dd4bf", size: "w-32 h-32", top: "12%", left: "8%", dur: 14 },
        { color: "#8b5cf6", size: "w-24 h-24", top: "55%", left: "72%", dur: 18 },
        { color: "#ec4899", size: "w-20 h-20", top: "28%", left: "58%", dur: 12 },
        { color: "#14b8a6", size: "w-16 h-16", top: "78%", left: "22%", dur: 16 },
      ].map((o, i) => (
        <motion.div
          key={i}
          className={cn("absolute rounded-full blur-2xl opacity-30", o.size)}
          style={{ background: o.color, top: o.top, left: o.left }}
          animate={{ y: [0, -18, 0], x: [0, i % 2 ? 12 : -10, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={`dot-${i}`}
          className="absolute h-1 w-1 rounded-full bg-teal-300/60"
          style={{
            top: `${10 + (i * 7) % 80}%`,
            left: `${5 + (i * 11) % 90}%`,
          }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}
