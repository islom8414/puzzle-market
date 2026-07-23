import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createSupabaseAdmin, getBearerToken } from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";
import { ensureUserProfile } from "@/lib/user-profile";

type PlanTier = "starter" | "premium" | "creator" | "sweepstakes";

const trialDays = 3;
const sweepstakesRulesVersion = "2026-07-23";

const plans: Record<
  PlanTier,
  {
    name: string;
    amount: number;
    bonusCents: number;
    trialDays: number;
    intervalCount: number;
    description: string;
  }
> = {
  starter: {
    name: "Puzzle Market Starter",
    amount: 100,
    bonusCents: 500,
    trialDays,
    intervalCount: 1,
    description:
      "3-day free trial. Bonus puzzle credit is added after the first successful subscription payment.",
  },
  premium: {
    name: "Puzzle Market Premium",
    amount: 1000,
    bonusCents: 2000,
    trialDays,
    intervalCount: 1,
    description:
      "3-day free trial. Bonus puzzle credit is added after the first successful subscription payment.",
  },
  creator: {
    name: "Puzzle Market Creator",
    amount: 10000,
    bonusCents: 10000,
    trialDays,
    intervalCount: 1,
    description:
      "3-day free trial. Bonus puzzle credit is added after the first successful subscription payment.",
  },
  sweepstakes: {
    name: "Puzzle Market New Year Entry Pass",
    amount: 700,
    bonusCents: 0,
    trialDays: 0,
    intervalCount: 6,
    description:
      "6-month giveaway entry plan with marketplace, resale, and auction access.",
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

  const sweepstakesRulesAccepted =
    body?.sweepstakesRulesAccepted === true;

  if (tier === "sweepstakes" && !sweepstakesRulesAccepted) {
    return NextResponse.json(
      { error: "Official Giveaway Rules must be accepted" },
      { status: 400 }
    );
  }

  const rulesAcceptedAt =
    tier === "sweepstakes" ? new Date().toISOString() : null;
  const rulesMetadata: Record<string, string> =
    tier === "sweepstakes" && rulesAcceptedAt
      ? {
          sweepstakes_rules_accepted: "true",
          sweepstakes_rules_version: sweepstakesRulesVersion,
          sweepstakes_rules_accepted_at: rulesAcceptedAt,
        }
      : {};

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
      payment_method_collection:
        plan.trialDays > 0 ? "always" : undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            recurring: {
              interval: "month",
              interval_count: plan.intervalCount,
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
        trial_days: String(plan.trialDays),
        bonus_cents: String(plan.bonusCents),
        ...rulesMetadata,
      },
      subscription_data: {
        ...(plan.trialDays > 0
          ? { trial_period_days: plan.trialDays }
          : {}),
        metadata: {
          kind: "subscription",
          user_id: user.id,
          tier,
          bonus_cents: String(plan.bonusCents),
          ...rulesMetadata,
        },
      },
      success_url: `${origin}/profile?subscription=success`,
      cancel_url:
        tier === "sweepstakes"
          ? `${origin}/subscribe?subscription=cancelled&plan=sweepstakes#sweepstakes-entry-pass`
          : `${origin}/subscribe?subscription=cancelled`,
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
