import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import type { PlanTier } from "@/types/database";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role = "member" } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
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
    .select("plan, seat_limit")
    .eq("organization_id", orgId)
    .single();

  const plan = (sub?.plan ?? "free") as PlanTier;
  if (!PLAN_LIMITS[plan].canTeam) {
    return NextResponse.json(
      { error: "Upgrade to Team to invite members." },
      { status: 403 }
    );
  }

  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const seatLimit = sub?.seat_limit ?? 1;
  if ((count ?? 0) >= seatLimit) {
    return NextResponse.json(
      { error: `Seat limit reached (${seatLimit}). Add seats in billing.` },
      { status: 403 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: invite, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: orgId,
      email: email.toLowerCase(),
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const inviteUrl = `${appUrl}/invite/${token}`;

  return NextResponse.json({ invite, inviteUrl });
}
