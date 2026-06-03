import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobNotesForm } from "@/components/jobs/job-notes-form";
import { GenerateCoverLetterButton } from "@/components/jobs/generate-cover-letter";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: job } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.orgId)
    .single();

  if (!job) notFound();

  const { data: optimizations } = await supabase
    .from("optimizations")
    .select("id, score, created_at")
    .eq("job_application_id", id)
    .order("created_at", { ascending: false });

  const { data: letters } = await supabase
    .from("cover_letters")
    .select("id, title, updated_at")
    .eq("job_application_id", id);

  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title")
    .eq("organization_id", ctx.orgId)
    .limit(1);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">
          {job.title} @ {job.company}
        </h1>
        <Badge className="mt-2 capitalize">{job.status}</Badge>
        {job.url && (
          <p className="mt-2">
            <a href={job.url} className="text-primary text-sm hover:underline" target="_blank" rel="noreferrer">
              View posting
            </a>
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <JobNotesForm jobId={job.id} initialNotes={job.notes ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analyses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {optimizations?.length ? (
            optimizations.map((o) => (
              <Link
                key={o.id}
                href={`/dashboard/optimize/${o.id}`}
                className="block text-sm hover:underline"
              >
                Score {o.score}% — {new Date(o.created_at).toLocaleDateString()}
              </Link>
            ))
          ) : (
            <Link href={`/dashboard/optimize/new`}>
              <Button size="sm">Run ATS analysis</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover letters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {letters?.map((l) => (
            <Link key={l.id} href={`/dashboard/cover-letters/${l.id}`} className="block text-sm hover:underline">
              {l.title}
            </Link>
          ))}
          {resumes?.[0] && (
            <GenerateCoverLetterButton
              jobId={job.id}
              resumeId={resumes[0].id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
