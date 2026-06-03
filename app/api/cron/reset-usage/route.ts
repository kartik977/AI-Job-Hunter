import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const start = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-01`;

  const { data: orgs } = await admin.from("organizations").select("id");

  for (const org of orgs ?? []) {
    await admin.from("usage_counters").upsert(
      {
        organization_id: org.id,
        period_start: start,
        analyses_count: 0,
        exports_count: 0,
        optimizations_count: 0,
      },
      { onConflict: "organization_id,period_start", ignoreDuplicates: false }
    );
  }

  return NextResponse.json({ reset: orgs?.length ?? 0, period: start });
}
