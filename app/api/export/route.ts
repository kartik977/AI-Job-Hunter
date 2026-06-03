import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertUsage, incrementUsage } from "@/lib/billing/assertUsage";
import { renderResumePdf } from "@/lib/resume/render-pdf";
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

  const { resumeVersionId } = await request.json();
  if (!resumeVersionId) {
    return NextResponse.json({ error: "resumeVersionId required" }, { status: 400 });
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

  const usageCheck = await assertUsage(orgId, "export");
  if (!usageCheck.ok) {
    return NextResponse.json({ error: usageCheck.message }, { status: 403 });
  }

  const { data: version } = await supabase
    .from("resume_versions")
    .select("content_json, resume_id")
    .eq("id", resumeVersionId)
    .eq("organization_id", orgId)
    .single();

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  const content = resumeContentSchema.parse(version.content_json);
  const buffer = await renderResumePdf(content);

  await incrementUsage(orgId, "export");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="resume-${resumeVersionId}.pdf"`,
    },
  });
}
