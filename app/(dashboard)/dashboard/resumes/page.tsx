import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ResumesPageClient } from "@/components/resumes/resumes-page-client";

export default async function ResumesPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, file_name, created_at, updated_at")
    .eq("organization_id", ctx.orgId)
    .order("updated_at", { ascending: false });

  return <ResumesPageClient resumes={resumes ?? []} />;
}
