import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";

export const runtime = "nodejs";

export async function GET(
  request: Request
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          connected: false,
          ready: false,
        },
        { status: 401 }
      );
    }

    const admin =
      createSupabaseAdmin();

    const {
      data: userData,
      error: userError,
    } =
      await admin.auth.getUser(
        token
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          connected: false,
          ready: false,
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
    } =
      await admin
        .from("market_profiles")
        .select(
          "stripe_account_id"
        )
        .eq("id", userData.user.id)
        .maybeSingle();

    const accountId =
      profile?.stripe_account_id as
        | string
        | null
        | undefined;

    if (!accountId) {
      return NextResponse.json({
        connected: false,
        ready: false,
      });
    }

    const stripeConfig =
      getStripeConfig();
    const stripe =
      new Stripe(
        stripeConfig.secretKey
      );

    const account =
      await stripe.accounts.retrieve(
        accountId
      );

    return NextResponse.json({
      connected: true,
      ready:
        account.payouts_enabled ===
        true,
      payoutsEnabled:
        account.payouts_enabled ===
        true,
      detailsSubmitted:
        account.details_submitted ===
        true,
      chargesEnabled:
        account.charges_enabled ===
        true,
      requirementsDue:
        account.requirements
          ?.currently_due || [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        connected: false,
        ready: false,
        error:
          error instanceof Error
            ? error.message
            : "Stripe status failed",
      },
      { status: 500 }
    );
  }
}
