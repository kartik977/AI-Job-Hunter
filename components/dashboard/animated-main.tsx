"use client";

import { PageEnter } from "@/components/animations/motion";

export function AnimatedMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <PageEnter className={className}>{children}</PageEnter>;
}
