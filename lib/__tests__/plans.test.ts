import { describe, it, expect } from "vitest";
import { PLAN_LIMITS } from "@/lib/billing/plans";

describe("PLAN_LIMITS (free app)", () => {
  it("free tier includes optimization and export", () => {
    expect(PLAN_LIMITS.free.canOptimize).toBe(true);
    expect(PLAN_LIMITS.free.canExport).toBe(true);
    expect(PLAN_LIMITS.free.canCoverLetter).toBe(true);
    expect(PLAN_LIMITS.free.canTeam).toBe(true);
  });

  it("generous fair-use limits", () => {
    expect(PLAN_LIMITS.free.analysesPerMonth).toBeGreaterThanOrEqual(50);
    expect(PLAN_LIMITS.free.maxResumes).toBeGreaterThanOrEqual(10);
  });
});
