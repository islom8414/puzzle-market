import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createSupabaseAdmin } from "@/lib/supabase-admin";

type SubscriptionTier = "starter" | "premium" | "creator";

type SupabaseAdmin = ReturnType<typeof createSupabaseAdmin>;

const activeSubscriptionStatuses = new Set([
  "active",
  "trialing",
]);

function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  if (tier === "premium" || tier === "creator") {
    return tier;
  }

  return "starter";
}

function getCustomerId(subscription: Stripe.Subscription) {
  const customer = subscription.customer;

  if (typeof customer === "string") {
    return customer;
  }

  return customer?.id || null;
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription) {
  const value = (subscription as Stripe.Subscription & {
    current_period_end?: number;
  }).current_period_end;

  return value
    ? new Date(value * 1000).toISOString()
    : null;
}

async function syncSubscription(
  admin: SupabaseAdmin,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.user_id;

  if (!userId) {
    console.warn("Subscription missing user_id metadata", subscription.id);
    return;
  }

  const isActive = activeSubscriptionStatuses.has(subscription.status);
  const tier = isActive
    ? normalizeTier(subscription.metadata?.tier)
    : "free";

  const { error } = await admin
    .from("market_profiles")
    .update({
      subscription_tier: tier,
      subscription_status: subscription.status,
      stripe_customer_id: getCustomerId(subscription),
      stripe_subscription_id: subscription.id,
      subscription_current_period_end: getCurrentPeriodEnd(subscription),
      subscription_updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Stripe signature missing" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey);
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Invalid Stripe webhook" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdmin();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;

      if (
        session.metadata?.kind === "wallet_topup" &&
        session.payment_status === "paid" &&
        userId &&
        session.amount_total
      ) {
        const { error } = await admin.rpc("credit_wallet_topup", {
          p_user_id: userId,
          p_amount_cents: session.amount_total,
          p_stripe_session_id: session.id,
        });

        if (error) {
          throw error;
        }
      }

      if (
        session.metadata?.kind === "subscription" &&
        session.subscription
      ) {
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );

        await syncSubscription(admin, subscription);
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(
        admin,
        event.data.object as Stripe.Subscription
      );
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
