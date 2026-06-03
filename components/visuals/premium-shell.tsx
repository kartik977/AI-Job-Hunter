"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedMeshBg } from "@/components/visuals/animated-mesh-bg";
import { FloatingOrbs } from "@/components/visuals/floating-orbs";
import {
  SceneIllustration,
  type SceneVariant,
} from "@/components/visuals/illustrations/scene-illustration";

export type { SceneVariant };

export function PremiumShell({
  variant = "minimal",
  embedded = false,
  children,
  title,
  subtitle,
  dark = true,
  className,
  contentClassName,
}: {
  variant?: SceneVariant;
  /** When true, skip page-level backgrounds (use inside dashboard layout). */
  embedded?: boolean;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  dark?: boolean;
  className?: string;
  contentClassName?: string;
}) {
  const showIllustration =
    variant !== "none" && variant !== "minimal";

  return (
    <div
      className={cn(
        "relative min-h-full",
        dark && "text-white",
        className
      )}
    >
      {!embedded && (
        <>
          <AnimatedMeshBg tone={dark ? "dark" : "light"} />
          {variant === "minimal" && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <FloatingOrbs className="opacity-60" />
            </div>
          )}
        </>
      )}

      <div
        className={cn(
          "relative z-10",
          showIllustration
            ? "grid lg:grid-cols-2 gap-8 lg:gap-12 items-center"
            : "block"
        )}
      >
        {showIllustration && (
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent rounded-2xl pointer-events-none z-10 lg:hidden" />
            <SceneIllustration variant={variant} />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            showIllustration ? "order-1 lg:order-2" : "",
            contentClassName
          )}
        >
          {(title || subtitle) && (
            <div className="mb-8">
              {title && (
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p
                  className={cn(
                    "mt-3 text-lg",
                    dark ? "text-white/70" : "text-muted-foreground"
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </motion.div>
      </div>
    </div>
  );
}
