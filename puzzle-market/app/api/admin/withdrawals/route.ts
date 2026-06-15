import { NextResponse } from "next/server";

import { isAdminUser } from "@/lib/market-access";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

async function requireAdmin(
  request: Request
) {
  const token =
    getBearerToken(request);

  if (!token) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Login required" },
        { status: 401 }
      ),
    };
  }

  const admin =
    createSupabaseAdmin();
  const {
    data,
    error,
  } =
    await admin.auth.getUser(token);

  if (
    error ||
    !data.user ||
    !isAdminUser(data.user)
  ) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      ),
    };
  }

  return {
    allowed: true,
    admin,
  };
}

export async function GET(
  request: Request
) {
  const access =
    await requireAdmin(request);

  if (!access.allowed) {
    return access.response;
  }

  const admin = access.admin!;

  const { data, error } =
    await admin
      .from(
        "wallet_withdrawal_requests"
      )
      .select(
        "id,user_id,amount_cents,method,destination_label,status,provider_reference,provider_transfer_reference,provider_error,created_at,updated_at,market_profiles(email,username)"
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(50);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    withdrawals: data || [],
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAdmin(request);

  if (!access.allowed) {
    return access.response;
  }

  const admin = access.admin!;

  const body =
    await request.json().catch(
      () => ({})
    );

  const withdrawalId =
    typeof body.withdrawalId ===
    "string"
      ? body.withdrawalId
      : "";
  const action =
    typeof body.action === "string"
      ? body.action
      : "";
  const reference =
    typeof body.reference ===
    "string"
      ? body.reference
          .trim()
          .slice(0, 200)
      : "";
  const note =
    typeof body.note === "string"
      ? body.note.trim().slice(0, 500)
      : "";

  if (!withdrawalId) {
    return NextResponse.json(
      {
        error:
          "Withdrawal id is required",
      },
      { status: 400 }
    );
  }

  if (action === "processing") {
    const { error } =
      await admin
        .from(
          "wallet_withdrawal_requests"
        )
        .update({
          status: "processing",
          admin_note:
            note || null,
        })
        .eq("id", withdrawalId)
        .in("status", [
          "pending",
          "processing",
        ]);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  }

  if (action === "paid") {
    const { error } =
      await admin.rpc(
        "complete_wallet_withdrawal",
        {
          p_withdrawal_id:
            withdrawalId,
          p_provider_reference:
            reference ||
            "manual_payout",
          p_provider_transfer_reference:
            note || null,
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  }

  if (
    action === "failed_refund"
  ) {
    const { error } =
      await admin.rpc(
        "fail_wallet_withdrawal_and_refund",
        {
          p_withdrawal_id:
            withdrawalId,
          p_provider_error:
            note ||
            "Manual payout failed and was refunded",
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  }

  return NextResponse.json(
    { error: "Unknown action" },
    { status: 400 }
  );
}
