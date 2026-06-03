import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import type { PlanTier } from "@/types/database";

export type UsageAction = "analyze" | "optimize" | "export";

function periodStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function assertUsage(
  orgId: string,
  action: UsageAction
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("organization_id", orgId)
    .single();

  const plan = (sub?.plan ?? "free") as PlanTier;
  const limits = PLAN_LIMITS[plan];

  if (action === "optimize" && !limits.canOptimize) {
    return { ok: false, message: "Optimization is not available on your plan." };
  }
  if (action === "export" && !limits.canExport) {
    return { ok: false, message: "Export is not available on your plan." };
  }

  const start = periodStart();
  let { data: usage } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("organization_id", orgId)
    .eq("period_start", start)
    .single();

  if (!usage) {
    const { data: created } = await supabase
      .from("usage_counters")
      .insert({
        organization_id: orgId,
        period_start: start,
        analyses_count: 0,
        exports_count: 0,
        optimizations_count: 0,
      })
      .select()
      .single();
    usage = created;
  }

  if (!usage) {
    return { ok: false, message: "Could not load usage counters." };
  }

  if (action === "analyze" && usage.analyses_count >= limits.analysesPerMonth) {
    return {
      ok: false,
      message: `Monthly analysis limit reached (${limits.analysesPerMonth}). Try again next month.`,
    };
  }

  return { ok: true };
}

export async function incrementUsage(orgId: string, action: UsageAction) {
  const supabase = await createClient();
  const start = periodStart();

  const { data: usage } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("organization_id", orgId)
    .eq("period_start", start)
    .single();

  if (!usage) {
    const insert = {
      organization_id: orgId,
      period_start: start,
      analyses_count: action === "analyze" ? 1 : 0,
      exports_count: action === "export" ? 1 : 0,
      optimizations_count: action === "optimize" ? 1 : 0,
    };
    await supabase.from("usage_counters").insert(insert);
    return;
  }

  const update = {
    analyses_count:
      action === "analyze" ? usage.analyses_count + 1 : usage.analyses_count,
    exports_count:
      action === "export" ? usage.exports_count + 1 : usage.exports_count,
    optimizations_count:
      action === "optimize"
        ? usage.optimizations_count + 1
        : usage.optimizations_count,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("usage_counters").update(update).eq("id", usage.id);
}
