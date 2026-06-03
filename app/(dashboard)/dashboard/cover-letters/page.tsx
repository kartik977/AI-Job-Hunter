import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { CoverLettersClient } from "@/components/cover-letters/cover-letters-client";

export default async function CoverLettersPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: letters } = await supabase
    .from("cover_letters")
    .select("id, title, updated_at, job_application_id")
    .eq("organization_id", ctx.orgId)
    .order("updated_at", { ascending: false });

  const jobIds = [...new Set((letters ?? []).map((l) => l.job_application_id))];
  const { data: jobs } = jobIds.length
    ? await supabase
        .from("job_applications")
        .select("id, company, title")
        .in("id", jobIds)
    : { data: [] };
  const jobMap = new Map((jobs ?? []).map((j) => [j.id, j]));

  const enriched = (letters ?? []).map((l) => {
    const job = jobMap.get(l.job_application_id);
    return {
      ...l,
      company: job?.company,
      jobTitle: job?.title,
    };
  });

  return <CoverLettersClient letters={enriched} />;
}
