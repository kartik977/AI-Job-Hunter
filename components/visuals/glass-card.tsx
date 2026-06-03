"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  const Comp = hover ? motion.div : "div";
  const props = hover
    ? {
        whileHover: { y: -4, scale: 1.01 },
        transition: { type: "spring" as const, stiffness: 400, damping: 28 },
      }
    : {};

  return (
    <Comp
      {...props}
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl shadow-black/20",
        "dark:bg-white/5",
        className
      )}
    >
      {children}
    </Comp>
  );
}
