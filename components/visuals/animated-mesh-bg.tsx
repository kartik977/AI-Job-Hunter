"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MeshTone = "light" | "dark";

export function AnimatedMeshBg({
  tone = "dark",
  className,
}: {
  tone?: MeshTone;
  className?: string;
}) {
  const vignette =
    tone === "dark"
      ? "radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgb(2 6 23 / 0.35) 55%, rgb(2 6 23) 100%)"
      : "radial-gradient(ellipse_at_center, transparent 0%, hsl(var(--background)) 75%)";

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      <motion.div
        className="absolute -top-1/2 -left-1/4 w-[80%] h-[80%] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, #2dd4bf 0%, transparent 70%)",
          opacity: tone === "dark" ? 0.22 : 0.4,
        }}
        animate={{
          x: [0, 80, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 w-[70%] h-[70%] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
          opacity: tone === "dark" ? 0.18 : 0.35,
        }}
        animate={{
          x: [0, -60, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 w-[50%] h-[50%] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
          opacity: tone === "dark" ? 0.14 : 0.25,
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: tone === "dark" ? [0.1, 0.18, 0.1] : [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      {tone === "light" && (
        <div className="absolute inset-0" style={{ background: vignette }} />
      )}
    </div>
  );
}
