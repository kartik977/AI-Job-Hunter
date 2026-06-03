import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanTier, SubscriptionStatus } from "@/types/database";
import Stripe from "stripe";

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: "active",
    canceled: "canceled",
    past_due: "past_due",
    trialing: "trialing",
    incomplete: "incomplete",
  };
  return map[status] ?? "active";
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  orgId: string,
  plan: PlanTier
) {
  const admin = createAdminClient();
  const seatLimit = plan === "team" ? 3 : 1;

  await admin.from("subscriptions").upsert(
    {
      organization_id: orgId,
      stripe_subscription_id: subscription.id,
      plan,
      status: mapStatus(subscription.status),
      seat_limit: seatLimit,
      current_period_end: (subscription as Stripe.Subscription & { current_period_end?: number })
        .current_period_end
        ? new Date(
            (subscription as Stripe.Subscription & { current_period_end: number })
              .current_period_end * 1000
          ).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id" }
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid signature" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("stripe_webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await admin.from("stripe_webhook_events").insert({ event_id: event.id });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.organization_id;
    const plan = (session.metadata?.plan ?? "pro") as PlanTier;
    const subId = session.subscription as string;

    if (orgId && subId) {
      const subscription = await stripe.subscriptions.retrieve(subId);
      await syncSubscription(subscription, orgId, plan);
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const orgId = subscription.metadata?.organization_id;
    const plan = (subscription.metadata?.plan ?? "pro") as PlanTier;

    if (orgId) {
      if (event.type === "customer.subscription.deleted") {
        await admin
          .from("subscriptions")
          .update({
            plan: "free",
            status: "canceled",
            stripe_subscription_id: null,
            seat_limit: 1,
            updated_at: new Date().toISOString(),
          })
          .eq("organization_id", orgId);
      } else {
        await syncSubscription(subscription, orgId, plan);
      }
    }
  }

  return NextResponse.json({ received: true });
}
