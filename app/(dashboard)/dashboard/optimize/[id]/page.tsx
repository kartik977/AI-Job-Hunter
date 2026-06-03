import { notFound } from "next/navigation";
import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ResultsPageClient } from "@/components/optimize/results-page-client";
import { atsAnalysisSchema } from "@/types/resume";

export default async function OptimizeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: opt } = await supabase
    .from("optimizations")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.orgId)
    .single();

  if (!opt?.analysis_json) notFound();

  const analysis = atsAnalysisSchema.parse(opt.analysis_json);

  return (
    <ResultsPageClient
      optimizationId={opt.id}
      score={opt.score}
      analysis={analysis}
      resumeId={opt.resume_id}
    />
  );
}
