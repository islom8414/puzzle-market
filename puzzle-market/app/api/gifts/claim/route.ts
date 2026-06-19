import { NextResponse } from "next/server";

import { claimGiftByToken } from "@/lib/piece-gifts";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

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

    const body =
      await request.json();
    const giftToken =
      String(body.giftToken || "")
        .trim();

    if (!giftToken) {
      return NextResponse.json(
        { error: "Gift token required" },
        { status: 400 }
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

    const result =
      await claimGiftByToken(
        admin,
        {
          id: userData.user.id,
          email:
            userData.user.email,
        },
        giftToken
      );

    if (!result.claimed) {
      return NextResponse.json(
        {
          error:
            result.error ||
            "Gift claim failed",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      result
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Gift claim failed",
      },
      { status: 500 }
    );
  }
}
