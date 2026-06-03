import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertUsage, incrementUsage } from "@/lib/billing/assertUsage";
import { analyzeResume } from "@/lib/ai/analyze";
import { resumeContentSchema } from "@/types/resume";
import { rateLimitByUser } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimitByUser(user.id);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const body = await request.json();
  const { resumeId, jobDescription, jobApplicationId, resumeVersionId } = body;

  if (!resumeId || !jobDescription?.trim()) {
    return NextResponse.json(
      { error: "resumeId and jobDescription required" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_org_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.default_org_id;
  if (!orgId) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const usageCheck = await assertUsage(orgId, "analyze");
  if (!usageCheck.ok) {
    return NextResponse.json({ error: usageCheck.message }, { status: 403 });
  }

  const { data: resume } = await supabase
    .from("resumes")
    .select("parsed_json, organization_id")
    .eq("id", resumeId)
    .eq("organization_id", orgId)
    .single();

  if (!resume?.parsed_json) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  let content = resumeContentSchema.parse(resume.parsed_json);

  if (resumeVersionId) {
    const { data: version } = await supabase
      .from("resume_versions")
      .select("content_json")
      .eq("id", resumeVersionId)
      .single();
    if (version?.content_json) {
      content = resumeContentSchema.parse(version.content_json);
    }
  }

  let analysis;
  try {
    analysis = await analyzeResume(content, jobDescription);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Analysis failed" },
      { status: 500 }
    );
  }

  const { data: optimization, error } = await supabase
    .from("optimizations")
    .insert({
      organization_id: orgId,
      user_id: user.id,
      resume_id: resumeId,
      resume_version_id: resumeVersionId ?? null,
      job_application_id: jobApplicationId ?? null,
      jd_text: jobDescription.slice(0, 20000),
      score: analysis.overall_score,
      analysis_json: analysis,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await incrementUsage(orgId, "analyze");

  return NextResponse.json({ optimization, analysis });
}
