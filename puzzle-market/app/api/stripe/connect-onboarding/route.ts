import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";

export const runtime = "nodejs";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json().catch(
        () => ({})
      );
    const requestedCountry =
      typeof body.country ===
      "string"
        ? body.country
            .trim()
            .toUpperCase()
        : "";
    const accountCountry =
      /^[A-Z]{2}$/.test(
        requestedCountry
      )
        ? requestedCountry
        : process.env
            .STRIPE_CONNECT_COUNTRY ||
          "US";

    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Login required" },
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
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const stripeConfig =
      getStripeConfig();
    const stripe =
      new Stripe(
        stripeConfig.secretKey
      );

    const {
      data: profile,
      error: profileError,
    } =
      await admin
        .from("market_profiles")
        .select(
          "id, email, username, stripe_account_id"
        )
        .eq("id", userData.user.id)
        .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          error:
            "Complete profile setup first",
        },
        { status: 409 }
      );
    }

    let accountId =
      profile.stripe_account_id as
        | string
        | null;

    if (accountId) {
      const existingAccount =
        await stripe.accounts.retrieve(
          accountId
        );

      if (
        existingAccount.country &&
        existingAccount.country !==
          accountCountry
      ) {
        return NextResponse.json(
          {
            error: `This Stripe payout account is already set up for ${existingAccount.country}. Stripe does not allow changing the country after account creation. Use that country or ask support to reset the payout account before creating a new one.`,
          },
          { status: 409 }
        );
      }
    } else {
      const account =
        await stripe.accounts.create({
          type: "express",
          country: accountCountry,
          email:
            profile.email ||
            userData.user.email ||
            undefined,
          business_type:
            "individual",
          capabilities: {
            transfers: {
              requested: true,
            },
          },
          metadata: {
            user_id:
              userData.user.id,
            username:
              profile.username || "",
          },
        });

      accountId = account.id;

      const { error } =
        await admin
          .from(
            "market_profiles"
          )
          .update({
            stripe_account_id:
              accountId,
          })
          .eq(
            "id",
            userData.user.id
          );

      if (error) {
        throw error;
      }
    }

    const origin =
      new URL(request.url).origin;

    const accountLink =
      await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/withdraw`,
        return_url: `${origin}/withdraw`,
        type: "account_onboarding",
      });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Stripe onboarding failed",
      },
      { status: 500 }
    );
  }
}
