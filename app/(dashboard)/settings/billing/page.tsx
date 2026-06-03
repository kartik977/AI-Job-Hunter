import { getCurrentOrgContext } from "@/lib/org";
import { getAiProviderLabel } from "@/lib/ai/provider";
import { BillingActions } from "@/components/settings/billing-actions";
import { SettingsShell } from "@/components/settings/settings-shell";

export default async function BillingSettingsPage() {
  const ctx = await getCurrentOrgContext();
  if (!ctx) return null;

  const plan = ctx.subscription?.plan ?? "free";

  return (
    <SettingsShell title="Billing" subtitle="Free forever — no payment required">
      <BillingActions currentPlan={plan} engineLabel={getAiProviderLabel()} />
    </SettingsShell>
  );
}
