import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { getAiProviderLabel } from "@/lib/ai/provider";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { PlanTier } from "@/types/database";

export default async function DashboardPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const plan = (ctx.subscription?.plan ?? "free") as PlanTier;
  const limits = PLAN_LIMITS[plan];

  const start = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;
  const { data: usage } = await supabase
    .from("usage_counters")
    .select("analyses_count, exports_count, optimizations_count")
    .eq("organization_id", ctx.orgId)
    .eq("period_start", start)
    .single();

  const { count: resumeCount } = await supabase
    .from("resumes")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ctx.orgId);

  const { data: recentJobs } = await supabase
    .from("job_applications")
    .select("id, company, title, status")
    .eq("organization_id", ctx.orgId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: recentOpts } = await supabase
    .from("optimizations")
    .select("id, score, created_at")
    .eq("organization_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <DashboardOverview
      plan={plan}
      engineLabel={getAiProviderLabel()}
      analysesCount={usage?.analyses_count ?? 0}
      analysesLimit={limits.analysesPerMonth}
      resumeCount={resumeCount ?? 0}
      optimizationsCount={usage?.optimizations_count ?? 0}
      recentJobs={recentJobs ?? []}
      recentOpts={recentOpts ?? []}
      profileName={ctx.profile?.full_name}
    />
  );
}
