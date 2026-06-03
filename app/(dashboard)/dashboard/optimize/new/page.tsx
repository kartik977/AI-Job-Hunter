import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { AnalyzePageClient } from "@/components/optimize/analyze-page-client";

export default async function NewOptimizePage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string }>;
}) {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const { resume: resumeParam } = await searchParams;
  const supabase = await createClient();
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title")
    .eq("organization_id", ctx.orgId)
    .order("updated_at", { ascending: false });

  return (
    <AnalyzePageClient
      resumes={resumes ?? []}
      resumeParam={resumeParam}
    />
  );
}
