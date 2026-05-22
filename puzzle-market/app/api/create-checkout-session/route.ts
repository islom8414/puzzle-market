import { NextResponse } from "next/server";
import Stripe from "stripe";

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
                body.amount * 100,

            },

            quantity: 1,
          },
        ],

        success_url:
          profileUrl,

        cancel_url:
          profileUrl,

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
