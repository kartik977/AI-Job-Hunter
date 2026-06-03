import { createClient } from "@/lib/supabase/server";

export async function getCurrentOrgContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, default_org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.default_org_id) return null;

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("organization_id", profile.default_org_id)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.default_org_id)
    .single();

  return {
    user,
    profile,
    org,
    orgId: profile.default_org_id,
    subscription,
  };
}
