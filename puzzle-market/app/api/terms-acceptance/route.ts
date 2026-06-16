import { NextResponse } from "next/server";

import {
  TERMS_VERSION,
} from "@/lib/legal";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

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

    const metadata = {
      ...(userData.user
        .user_metadata || {}),
      terms_accepted_at:
        new Date().toISOString(),
      terms_version:
        TERMS_VERSION,
    };

    const { error } =
      await admin.auth.admin.updateUserById(
        userData.user.id,
        {
          user_metadata: metadata,
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      termsVersion:
        TERMS_VERSION,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save agreement",
      },
      { status: 500 }
    );
  }
}

