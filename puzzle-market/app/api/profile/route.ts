import { NextResponse } from "next/server";

import {
  isCompleteUsername,
  sanitizeUsername,
} from "@/lib/display-name";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

async function getAuthedUser(
  request: Request
) {
  const token =
    getBearerToken(request);

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Login required" },
        { status: 401 }
      ),
    };
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
    return {
      error: NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      ),
    };
  }

  return {
    admin,
    user: userData.user,
  };
}

export async function GET(
  request: Request
) {
  try {
    const auth =
      await getAuthedUser(request);

    if ("error" in auth && auth.error) {
      return auth.error;
    }

    const { admin, user } = auth;

    const { data: profile } =
      await admin
        .from("market_profiles")
        .select("username, email")
        .eq("id", user.id)
        .maybeSingle();

    const username =
      sanitizeUsername(
        profile?.username
      );

    return NextResponse.json({
      username,
      email:
        profile?.email ||
        user.email ||
        "",
      profileComplete:
        isCompleteUsername(
          username
        ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load profile",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request
) {
  try {
    const auth =
      await getAuthedUser(request);

    if ("error" in auth && auth.error) {
      return auth.error;
    }

    const { admin, user } = auth;

    const body =
      await request.json();

    const username =
      sanitizeUsername(
        typeof body.username ===
          "string"
          ? body.username
          : ""
      );

    if (
      !isCompleteUsername(
        username
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Username must be at least 3 letters or numbers",
        },
        { status: 400 }
      );
    }

    const email =
      user.email?.trim() || "";

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Account email is missing",
        },
        { status: 400 }
      );
    }

    const { error } =
      await admin
        .from("market_profiles")
        .upsert(
          {
            id: user.id,
            email,
            username,
          },
          {
            onConflict: "id",
          }
        );

    if (error) {
      const message =
        error.code === "23505" ||
        error.message.includes(
          "duplicate"
        )
          ? "Username is already taken"
          : error.message;

      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    return NextResponse.json({
      username,
      profileComplete: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save profile",
      },
      { status: 500 }
    );
  }
}
