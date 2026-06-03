import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCoverLetter } from "@/lib/ai/cover-letter";
import { resumeContentSchema } from "@/types/resume";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import type { PlanTier } from "@/types/database";
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

  const { jobApplicationId, resumeId } = await request.json();
  if (!jobApplicationId || !resumeId) {
    return NextResponse.json(
      { error: "jobApplicationId and resumeId required" },
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

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("organization_id", orgId)
    .single();

  const plan = (sub?.plan ?? "free") as PlanTier;
  if (!PLAN_LIMITS[plan].canCoverLetter) {
    return NextResponse.json(
      { error: "Upgrade to Pro for cover letters." },
      { status: 403 }
    );
  }

  const { data: job } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", jobApplicationId)
    .eq("organization_id", orgId)
    .single();

  const { data: resume } = await supabase
    .from("resumes")
    .select("parsed_json")
    .eq("id", resumeId)
    .single();

  if (!job || !resume?.parsed_json) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: opt } = await supabase
    .from("optimizations")
    .select("jd_text")
    .eq("job_application_id", jobApplicationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const jd = opt?.jd_text ?? job.notes ?? "General application";

  const content = resumeContentSchema.parse(resume.parsed_json);
  const result = await generateCoverLetter(
    content,
    jd,
    job.company,
    job.title
  );

  const { data: letter, error } = await supabase
    .from("cover_letters")
    .insert({
      organization_id: orgId,
      user_id: user.id,
      job_application_id: jobApplicationId,
      title: `Cover Letter – ${job.company}`,
      content: result.content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ letter });
}
