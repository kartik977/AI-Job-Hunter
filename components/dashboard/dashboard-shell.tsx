"use client";

import { PremiumShell, type SceneVariant } from "@/components/visuals/premium-shell";

/** Dashboard pages: layout already provides ambient bg — no duplicate mesh/orbs. */
export function DashboardShell({
  variant = "none",
  children,
  title,
  subtitle,
  className,
  contentClassName,
}: {
  variant?: SceneVariant;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <PremiumShell
      embedded
      variant={variant}
      dark
      title={title}
      subtitle={subtitle}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </PremiumShell>
  );
}
