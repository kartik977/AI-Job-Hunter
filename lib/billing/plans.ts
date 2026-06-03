import type { PlanTier } from "@/types/database";

/** All tiers are free — no Stripe required. Limits are generous fair-use caps. */
export const PLAN_LIMITS: Record<
  PlanTier,
  {
    analysesPerMonth: number;
    maxResumes: number;
    canExport: boolean;
    canOptimize: boolean;
    canCoverLetter: boolean;
    canTeam: boolean;
    seatLimit: number;
  }
> = {
  free: {
    analysesPerMonth: 100,
    maxResumes: 20,
    canExport: true,
    canOptimize: true,
    canCoverLetter: true,
    canTeam: true,
    seatLimit: 5,
  },
  pro: {
    analysesPerMonth: 100,
    maxResumes: 20,
    canExport: true,
    canOptimize: true,
    canCoverLetter: true,
    canTeam: true,
    seatLimit: 5,
  },
  team: {
    analysesPerMonth: 100,
    maxResumes: 20,
    canExport: true,
    canOptimize: true,
    canCoverLetter: true,
    canTeam: true,
    seatLimit: 10,
  },
};

export function isStripeEnabled() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_PRICE_PRO &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
}
