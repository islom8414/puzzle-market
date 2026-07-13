import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";
import { ensureUserProfile } from "@/lib/user-profile";

export async function POST(
  request: Request
) {

  try {

    const stripeConfig =
      getStripeConfig();

    const stripe =
      new Stripe(
        stripeConfig.secretKey
      );

    const body =
      await request.json();

    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: "Login required",
        },
        {
          status: 401,
        }
      );
    }

    const amount =
      Number(body.amount);

    const amountCents =
      Math.round(amount * 100);

    if (
      !Number.isFinite(amount) ||
      amountCents < 100 ||
      amountCents > 1000000 ||
      Math.abs(
        amount * 100 -
          amountCents
      ) > 0.000001
    ) {
      return NextResponse.json(
        {
          error:
            "Enter an amount from $1 to $10,000 with no more than 2 decimal places",
        },
        {
          status: 400,
        }
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
          error: "Invalid session",
        },
        {
          status: 401,
        }
      );
    }

    if (!userData.user.email) {
      return NextResponse.json(
        {
          error:
            "Complete profile setup first",
        },
        {
          status: 409,
        }
      );
    }

    const ensuredProfile =
      await ensureUserProfile(
        admin,
        userData.user
      );

    if (!ensuredProfile.profile.username) {
      return NextResponse.json(
        {
          error:
            "Complete profile setup first",
        },
        {
          status: 409,
        }
      );
    }

    const profileUrl =
      new URL(
        "/profile",
        request.url
      ).toString();

    const session =
      await stripe.checkout.sessions.create({

        payment_method_types: [
          "card"
        ],

        mode: "payment",

        line_items: [
          {
            price_data: {

              currency: "usd",

              product_data: {
                name:
                  "Puzzle Market Wallet Topup",
              },

              unit_amount:
                amountCents,

            },

            quantity: 1,
          },
        ],

        success_url:
          profileUrl,

        cancel_url:
          profileUrl,

        client_reference_id:
          userData.user.id,

        metadata: {
          kind: "wallet_topup",
          user_id:
            userData.user.id,
        },

      });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        error: "Stripe Error",
      },
      {
        status: 500,
      }
    );

  }

}
