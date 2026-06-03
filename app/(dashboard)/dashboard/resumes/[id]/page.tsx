import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { VersionList } from "@/components/resumes/version-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resumeContentSchema } from "@/types/resume";

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.orgId)
    .single();

  if (!resume) notFound();

  const { data: versions } = await supabase
    .from("resume_versions")
    .select("id, label, is_primary, created_at")
    .eq("resume_id", id)
    .order("created_at", { ascending: false });

  let preview = null;
  try {
    preview = resume.parsed_json
      ? resumeContentSchema.parse(resume.parsed_json)
      : null;
  } catch {
    preview = null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{resume.title}</h1>
          <p className="text-muted-foreground text-sm">{resume.file_name}</p>
        </div>
        <Link href={`/dashboard/optimize/new?resume=${id}`}>
          <Button>Analyze for a job</Button>
        </Link>
      </div>

      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parsed preview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 max-h-64 overflow-y-auto">
            {preview.summary && <p>{preview.summary}</p>}
            <p>
              <strong>Skills:</strong> {preview.skills.slice(0, 15).join(", ")}
            </p>
            <p>
              <strong>Experience entries:</strong> {preview.experience.length}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-semibold mb-4">Versions</h2>
        <VersionList resumeId={id} versions={versions ?? []} />
      </div>
    </div>
  );
}
