import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createSupabaseAdmin, getBearerToken } from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";
import { ensureUserProfile } from "@/lib/user-profile";

type PlanTier = "starter" | "premium" | "creator";

const trialDays = 3;

const plans: Record<
  PlanTier,
  { name: string; amount: number; bonusCents: number }
> = {
  starter: {
    name: "Puzzle Market Starter",
    amount: 100,
    bonusCents: 500,
  },
  premium: {
    name: "Puzzle Market Premium",
    amount: 1000,
    bonusCents: 2000,
  },
  creator: {
    name: "Puzzle Market Creator",
    amount: 10000,
    bonusCents: 10000,
  },
};

export async function POST(request: Request) {
  let stripeConfig;

  try {
    stripeConfig = getStripeConfig();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stripe is not configured",
      },
      { status: 500 }
    );
  }

  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const admin = createSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tier = body?.tier as PlanTier | undefined;
  const plan = tier ? plans[tier] : null;

  if (!tier || !plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { profile } = await ensureUserProfile(
    admin,
    user
  );

  if (!profile?.username) {
    return NextResponse.json(
      { error: "Complete profile setup first" },
      { status: 409 }
    );
  }

  const stripe = new Stripe(stripeConfig.secretKey);
  const origin = new URL(request.url).origin;
  const customer = profile?.stripe_customer_id || undefined;

  let session;

  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer,
      customer_email: customer ? undefined : user.email,
      payment_method_collection: "always",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: `${trialDays}-day free trial. Bonus puzzle credit is added after the first successful subscription payment.`,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "subscription",
        user_id: user.id,
        tier,
        trial_days: String(trialDays),
        bonus_cents: String(plan.bonusCents),
      },
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          kind: "subscription",
          user_id: user.id,
          tier,
          bonus_cents: String(plan.bonusCents),
        },
      },
      success_url: `${origin}/profile?subscription=success`,
      cancel_url: `${origin}/subscribe?subscription=cancelled`,
    });
  } catch (error) {
    console.error("Stripe checkout failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stripe checkout failed",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}
