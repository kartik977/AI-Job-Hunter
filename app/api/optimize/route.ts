import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertUsage, incrementUsage } from "@/lib/billing/assertUsage";
import { optimizeResume } from "@/lib/ai/optimize";
import { resumeContentSchema, atsAnalysisSchema } from "@/types/resume";
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

  const { optimizationId } = await request.json();
  if (!optimizationId) {
    return NextResponse.json({ error: "optimizationId required" }, { status: 400 });
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

  const usageCheck = await assertUsage(orgId, "optimize");
  if (!usageCheck.ok) {
    return NextResponse.json({ error: usageCheck.message }, { status: 403 });
  }

  const { data: opt } = await supabase
    .from("optimizations")
    .select("*")
    .eq("id", optimizationId)
    .eq("organization_id", orgId)
    .single();

  if (!opt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: resumeRow } = await supabase
    .from("resumes")
    .select("parsed_json")
    .eq("id", opt.resume_id)
    .single();

  let content = resumeContentSchema.parse(resumeRow?.parsed_json ?? {});

  if (opt.resume_version_id) {
    const { data: ver } = await supabase
      .from("resume_versions")
      .select("content_json")
      .eq("id", opt.resume_version_id)
      .single();
    if (ver?.content_json) {
      content = resumeContentSchema.parse(ver.content_json);
    }
  }

  const analysis = atsAnalysisSchema.parse(opt.analysis_json);

  const { content: optimized, changesSummary } = await optimizeResume(
    content,
    opt.jd_text,
    analysis
  );

  const { data: version, error } = await supabase
    .from("resume_versions")
    .insert({
      resume_id: opt.resume_id,
      organization_id: orgId,
      label: `Optimized ${new Date().toLocaleDateString()}`,
      content_json: optimized,
      is_primary: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("resumes")
    .update({ parsed_json: optimized, updated_at: new Date().toISOString() })
    .eq("id", opt.resume_id);

  await incrementUsage(orgId, "optimize");

  return NextResponse.json({ version, changesSummary });
}
