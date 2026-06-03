import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const { data: invite } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .single();

  if (!invite || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  if (
    user.email?.toLowerCase() !== invite.email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Invite email does not match your account" },
      { status: 403 }
    );
  }

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("seat_limit")
    .eq("organization_id", invite.organization_id)
    .single();

  const { count } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", invite.organization_id);

  if ((count ?? 0) >= (sub?.seat_limit ?? 1)) {
    return NextResponse.json({ error: "Seat limit reached" }, { status: 403 });
  }

  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: invite.organization_id,
      user_id: user.id,
      role: invite.role,
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  await supabase
    .from("organization_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  await supabase
    .from("profiles")
    .update({ default_org_id: invite.organization_id })
    .eq("id", user.id);

  return NextResponse.json({ organizationId: invite.organization_id });
}
