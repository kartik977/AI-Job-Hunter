import { getCurrentOrgContext } from "@/lib/org";
import { ProfileForm } from "@/components/settings/profile-form";
import { SettingsShell } from "@/components/settings/settings-shell";

export default async function ProfileSettingsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  return (
    <SettingsShell title="Profile" subtitle="Manage your account">
      <ProfileForm
        fullName={ctx.profile?.full_name ?? ""}
        email={ctx.profile?.email ?? ctx.user.email ?? ""}
      />
    </SettingsShell>
  );
}
