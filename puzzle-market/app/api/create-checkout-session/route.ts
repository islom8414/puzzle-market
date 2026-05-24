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

    const fallbackUsername =
      userData.user.email
        ?.split("@")[0]
        ?.replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        )
        ?.slice(0, 40) ||
      "PuzzleUser";

    const rawUsername =
      typeof body.username ===
        "string"
        ? body.username.trim()
        : fallbackUsername;

    if (
      !userData.user.email ||
      rawUsername.length < 3
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

    const cleanUsername =
      rawUsername
        .replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        )
        .slice(0, 40) ||
      fallbackUsername;

    const {
      data: existingUsername,
    } =
      await admin
        .from("market_profiles")
        .select("id")
        .eq(
          "username",
          cleanUsername
        )
        .maybeSingle();

    const username =
      existingUsername &&
      existingUsername.id !==
        userData.user.id
        ? `${cleanUsername.slice(0, 31)}_${userData.user.id.slice(0, 8)}`
        : cleanUsername;

    const {
      error: profileError,
    } =
      await admin
        .from("market_profiles")
        .upsert(
          {
            id: userData.user.id,
            email:
              userData.user.email,
            username,
          },
          {
            onConflict: "id",
          }
        );

    if (profileError) {
      console.error(profileError);

      return NextResponse.json(
        {
          error:
            profileError.message ||
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
