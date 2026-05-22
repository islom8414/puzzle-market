import { NextResponse } from "next/server";
import Stripe from "stripe";

import { createSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  request: Request
) {
  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY;

  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (
    !stripeSecretKey ||
    !webhookSecret
  ) {
    return NextResponse.json(
      {
        error: "Stripe webhook not configured",
      },
      {
        status: 500,
      }
    );
  }

  const signature =
    request.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return NextResponse.json(
      {
        error: "Stripe signature missing",
      },
      {
        status: 400,
      }
    );
  }

  const stripe =
    new Stripe(stripeSecretKey);

  let event: Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        await request.text(),
        signature,
        webhookSecret
      );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Invalid Stripe webhook",
      },
      {
        status: 400,
      }
    );
  }

  if (
    event.type ===
    "checkout.session.completed"
  ) {
    const session =
      event.data
        .object as Stripe.Checkout.Session;

    const userId =
      session.metadata?.user_id;

    if (
      session.metadata?.kind ===
        "wallet_topup" &&
      session.payment_status ===
        "paid" &&
      userId &&
      session.amount_total
    ) {
      const admin =
        createSupabaseAdmin();

      const { error } =
        await admin.rpc(
          "credit_wallet_topup",
          {
            p_user_id: userId,
            p_amount_cents:
              session.amount_total,
            p_stripe_session_id:
              session.id,
          }
        );

      if (error) {
        console.error(error);

        return NextResponse.json(
          {
            error: "Wallet credit failed",
          },
          {
            status: 500,
          }
        );
      }
    }
  }

  return NextResponse.json({
    received: true,
  });
}
