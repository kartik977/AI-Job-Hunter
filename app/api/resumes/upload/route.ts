import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile, ALLOWED_MIME_TYPES } from "@/lib/resume/extract-text";
import { parseResumeFromText } from "@/lib/ai/parse-resume";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.default_org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const orgId = profile.default_org_id;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("organization_id", orgId)
    .single();

  const plan = (sub?.plan ?? "free") as PlanTier;
  const limits = PLAN_LIMITS[plan];

  const { count } = await supabase
    .from("resumes")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  if ((count ?? 0) >= limits.maxResumes) {
    return NextResponse.json(
      { error: `Resume limit reached (${limits.maxResumes}). Upgrade your plan.` },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string) || "My Resume";

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PDF or DOCX." },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let rawText: string;
  try {
    rawText = await extractTextFromFile(buffer, file.type);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Parse failed" },
      { status: 400 }
    );
  }

  let parsed;
  try {
    parsed = await parseResumeFromText(rawText);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI parse failed" },
      { status: 500 }
    );
  }

  const storagePath = `${user.id}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    );
  }

  const { data: resume, error: dbError } = await supabase
    .from("resumes")
    .insert({
      organization_id: orgId,
      user_id: user.id,
      title,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      parsed_json: parsed,
    })
    .select()
    .single();

  if (dbError || !resume) {
    return NextResponse.json(
      { error: dbError?.message ?? "Failed to save resume" },
      { status: 500 }
    );
  }

  await supabase.from("resume_versions").insert({
    resume_id: resume.id,
    organization_id: orgId,
    label: "Original",
    content_json: parsed,
    is_primary: true,
    created_by: user.id,
  });

  return NextResponse.json({ resume });
}
