import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createSupabaseAdmin, getBearerToken } from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";

type PlanTier = "starter" | "premium" | "creator";

const plans: Record<PlanTier, { name: string; amount: number }> = {
  starter: {
    name: "Puzzle Market Starter",
    amount: 100,
  },
  premium: {
    name: "Puzzle Market Premium",
    amount: 1000,
  },
  creator: {
    name: "Puzzle Market Creator",
    amount: 10000,
  },
};

function fallbackUsername(email: string, userId: string) {
  const base = email
    .split("@")[0]
    ?.replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 18);

  return base
    ? `${base}_${userId.slice(0, 6)}`
    : `collector_${userId.slice(0, 6)}`;
}

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

  const { data: existingProfile } = await admin
    .from("market_profiles")
    .select("id, username, stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  let profile = existingProfile;

  if (!profile) {
    const { data, error } = await admin
      .from("market_profiles")
      .insert({
        id: user.id,
        username: fallbackUsername(user.email, user.id),
      })
      .select("id, username, stripe_customer_id")
      .single();

    if (error) {
      console.error("Profile setup failed:", error);

      return NextResponse.json(
        { error: "Profile setup failed" },
        { status: 500 }
      );
    }

    profile = data;
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
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
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
      },
      subscription_data: {
        metadata: {
          kind: "subscription",
          user_id: user.id,
          tier,
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