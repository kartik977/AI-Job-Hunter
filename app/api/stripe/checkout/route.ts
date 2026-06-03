import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { STRIPE_PLANS } from "@/lib/stripe/plans";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = await request.json();
  const planConfig =
    plan === "team" ? STRIPE_PLANS.team : STRIPE_PLANS.pro;

  if (!planConfig.priceId) {
    return NextResponse.json(
      {
        error:
          "Payments are disabled. JobHunter AI is free — no checkout needed.",
        free: true,
      },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_org_id, email")
    .eq("id", user.id)
    .single();

  if (!profile?.default_org_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", profile.default_org_id)
    .single();

  const stripe = getStripe();
  let customerId = org?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email ?? user.email,
      metadata: { organization_id: profile.default_org_id },
    });
    customerId = customer.id;
    await supabase
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", profile.default_org_id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${appUrl}/settings/billing?success=1`,
    cancel_url: `${appUrl}/settings/billing?canceled=1`,
    metadata: {
      organization_id: profile.default_org_id,
      plan: planConfig.plan,
    },
    subscription_data: {
      metadata: {
        organization_id: profile.default_org_id,
        plan: planConfig.plan,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
