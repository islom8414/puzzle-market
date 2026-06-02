import { NextResponse } from "next/server";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import {
  getCardsByPhone,
  getMontraReadiness,
} from "@/lib/montra";

export const runtime = "nodejs";

export async function POST(
  request: Request
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Login required" },
        { status: 401 }
      );
    }

    const readiness =
      getMontraReadiness();

    if (
      !readiness.configured ||
      !readiness.enabled
    ) {
      return NextResponse.json(
        {
          error:
            "Montra payouts are waiting for KYC approval and payout API keys",
          ...readiness,
        },
        { status: 409 }
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

    const body =
      await request.json();
    const phone =
      typeof body.phone ===
      "string"
        ? body.phone.trim()
        : "";

    if (phone.length < 7) {
      return NextResponse.json(
        {
          error:
            "Enter recipient phone number",
        },
        { status: 400 }
      );
    }

    const cards =
      await getCardsByPhone(phone);

    return NextResponse.json({
      cards,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load Montra cards",
      },
      { status: 500 }
    );
  }
}
