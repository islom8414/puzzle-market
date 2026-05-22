import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export async function POST(
  request: Request
) {

  try {

    const stripeSecretKey =
      process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {

      return NextResponse.json(
        {
          error: "Stripe key missing",
        },
        {
          status: 500,
        }
      );

    }

    const stripe =
      new Stripe(
        stripeSecretKey
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

    if (
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > 10000
    ) {
      return NextResponse.json(
        {
          error: "Invalid topup amount",
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

    const username =
      typeof body.username ===
        "string"
        ? body.username.trim()
        : "";

    if (
      !userData.user.email ||
      username.length < 3 ||
      username.length > 40
    ) {
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

    const {
      error: profileError,
    } =
      await admin
        .from("market_profiles")
        .upsert({
          id: userData.user.id,
          email:
            userData.user.email,
          username,
        });

    if (profileError) {
      console.error(profileError);

      return NextResponse.json(
        {
          error:
            "Profile setup required",
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
                amount * 100,

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

  } catch {

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
