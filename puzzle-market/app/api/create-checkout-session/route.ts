import { NextResponse } from "next/server";

import Stripe from "stripe";

const stripe = new Stripe(
  process.env
    .STRIPE_SECRET_KEY!,
  {
    apiVersion:
      "2025-04-30.basil",
  }
);

export async function POST(
  request: Request
) {

  try {

    const body =
      await request.json();

    const amount =
      body.amount;

    const session =
      await stripe.checkout.sessions.create({

        payment_method_types:
          ["card"],

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
          "https://puzzle-market-lmny.vercel.app/profile",

        cancel_url:
          "https://puzzle-market-lmny.vercel.app/profile",

      });

    return NextResponse.json({
      url:
        session.url,
    });

  } catch (error) {

    return NextResponse.json(
      {
        error:
          "Stripe Error",
      },
      {
        status: 500,
      }
    );

  }

}