import { getCurrentOrgContext } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { TeamPanel } from "@/components/settings/team-panel";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { SettingsShell } from "@/components/settings/settings-shell";
import type { PlanTier } from "@/types/database";

export default async function TeamSettingsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, role, user_id")
    .eq("organization_id", ctx.orgId);

  const userIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const enriched = (members ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    profiles: profileMap.get(m.user_id) ?? undefined,
  }));

  const plan = (ctx.subscription?.plan ?? "free") as PlanTier;
  const limits = PLAN_LIMITS[plan];

  return (
    <SettingsShell title="Team" subtitle="Invite collaborators to your workspace">
      {!limits.canTeam && (
        <p className="text-white/50 text-sm mb-4">
          Team invites are included on all plans.
        </p>
      )}
      <TeamPanel
        members={enriched}
        canInvite={limits.canTeam}
        seatLimit={ctx.subscription?.seat_limit ?? 1}
      />
    </SettingsShell>
  );
}
