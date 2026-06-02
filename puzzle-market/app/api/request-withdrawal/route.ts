import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";

const withdrawalMethods = [
  "stripe_instant",
  "stripe_standard",
] as const;

type WithdrawalMethod =
  (typeof withdrawalMethods)[number];

function isWithdrawalMethod(
  value: unknown
): value is WithdrawalMethod {
  return (
    typeof value === "string" &&
    withdrawalMethods.includes(
      value as WithdrawalMethod
    )
  );
}

export async function POST(
  request: Request
) {
  try {
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

    const body =
      await request.json();

    const amount =
      Number(body.amount);

    if (
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount > 10000
    ) {
      return NextResponse.json(
        {
          error:
            "Withdrawal amount must be between $1 and $10,000",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !isWithdrawalMethod(
        body.method
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Choose a withdrawal method",
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

    const {
      data: profile,
      error: profileError,
    } =
      await admin
        .from("market_profiles")
        .select(
          "stripe_account_id"
        )
        .eq("id", userData.user.id)
        .maybeSingle();

    const stripeAccountId =
      profile?.stripe_account_id as
        | string
        | null
        | undefined;

    if (
      profileError ||
      !stripeAccountId
    ) {
      return NextResponse.json(
        {
          error:
            "Connect your Stripe payout account first",
        },
        {
          status: 409,
        }
      );
    }

    const stripeConfig =
      getStripeConfig();
    const stripe =
      new Stripe(
        stripeConfig.secretKey
      );

    const connectedAccount =
      await stripe.accounts.retrieve(
        stripeAccountId
      );

    if (
      connectedAccount.payouts_enabled !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "Finish Stripe payout onboarding first",
        },
        {
          status: 409,
        }
      );
    }

    const amountCents =
      Math.round(amount * 100);
    const destinationLabel =
      body.method ===
      "stripe_instant"
        ? "Stripe Instant Payout"
        : "Stripe Standard Payout";

    const {
      data: withdrawalId,
      error: withdrawalError,
    } =
      await admin.rpc(
        "request_wallet_withdrawal",
        {
          p_user_id:
            userData.user.id,
          p_amount_cents:
            amountCents,
          p_method: body.method,
          p_destination_label:
            destinationLabel,
        }
      );

    if (withdrawalError) {
      return NextResponse.json(
        {
          error:
            withdrawalError.message,
        },
        {
          status: 409,
        }
      );
    }

    await admin
      .from(
        "wallet_withdrawal_requests"
      )
      .update({
        status: "processing",
      })
      .eq("id", withdrawalId);

    let transferId = "";

    try {
      const transfer =
        await stripe.transfers.create(
          {
            amount: amountCents,
            currency: "usd",
            destination:
              stripeAccountId,
            transfer_group:
              `withdrawal_${withdrawalId}`,
            metadata: {
              withdrawal_id:
                String(withdrawalId),
              user_id:
                userData.user.id,
            },
          },
          {
            idempotencyKey:
              `withdrawal_transfer_${withdrawalId}`,
          }
        );

      transferId = transfer.id;

      const payout =
        await stripe.payouts.create(
          {
            amount: amountCents,
            currency: "usd",
            method:
              body.method ===
              "stripe_instant"
                ? "instant"
                : "standard",
            metadata: {
              withdrawal_id:
                String(withdrawalId),
              user_id:
                userData.user.id,
            },
          },
          {
            stripeAccount:
              stripeAccountId,
            idempotencyKey:
              `withdrawal_payout_${withdrawalId}`,
          }
        );

      const {
        error: completeError,
      } =
        await admin.rpc(
          "complete_wallet_withdrawal",
          {
            p_withdrawal_id:
              withdrawalId,
            p_provider_reference:
              payout.id,
            p_provider_transfer_reference:
              transfer.id,
          }
        );

      if (completeError) {
        throw completeError;
      }

      return NextResponse.json({
        withdrawalId,
        payoutId: payout.id,
        transferId: transfer.id,
        status: "paid",
      });
    } catch (stripeError) {
      const message =
        stripeError instanceof Error
          ? stripeError.message
          : "Stripe payout failed";

      if (transferId) {
        try {
          await stripe.transfers.createReversal(
            transferId,
            {
              amount: amountCents,
            },
            {
              idempotencyKey:
                `withdrawal_reversal_${withdrawalId}`,
            }
          );
        } catch (reversalError) {
          console.error(
            reversalError
          );

          await admin
            .from(
              "wallet_withdrawal_requests"
            )
            .update({
              status: "failed",
              provider_error:
                "Stripe payout failed and transfer reversal needs admin review",
              provider_transfer_reference:
                transferId,
            })
            .eq(
              "id",
              withdrawalId
            );

          return NextResponse.json(
            {
              error:
                "Payout failed after transfer. Admin review required.",
            },
            {
              status: 500,
            }
          );
        }
      }

      await admin.rpc(
        "fail_wallet_withdrawal_and_refund",
        {
          p_withdrawal_id:
            withdrawalId,
          p_provider_error:
            message,
        }
      );

      return NextResponse.json(
        {
          error: message,
        },
        {
          status: 409,
        }
      );
    }

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Withdrawal request failed",
      },
      {
        status: 500,
      }
    );
  }
}
