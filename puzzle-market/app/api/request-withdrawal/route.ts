import { NextResponse } from "next/server";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

const withdrawalMethods = [
  "visa_card",
  "bank_transfer",
  "paypal",
  "usdt",
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

    const destinationLabel =
      typeof body.destination ===
      "string"
        ? body.destination.trim()
        : "";

    if (
      destinationLabel.length < 4 ||
      destinationLabel.length > 120
    ) {
      return NextResponse.json(
        {
          error:
            "Add valid payout details",
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

    const amountCents =
      Math.round(amount * 100);

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

    return NextResponse.json({
      withdrawalId,
    });
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
