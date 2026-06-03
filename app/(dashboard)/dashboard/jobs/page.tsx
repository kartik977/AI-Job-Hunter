import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { JobsPageClient } from "@/components/jobs/jobs-page-client";

export default async function JobsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("job_applications")
    .select("id, company, title, status")
    .eq("organization_id", ctx.orgId)
    .order("updated_at", { ascending: false });

  return (
    <JobsPageClient
      jobs={jobs ?? []}
      orgId={ctx.orgId}
      userId={ctx.user.id}
    />
  );
}
