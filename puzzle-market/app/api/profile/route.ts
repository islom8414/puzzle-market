import { NextResponse } from "next/server";

import {
  isCompleteUsername,
  sanitizeUsername,
} from "@/lib/display-name";
import { hasActivePaidSubscription } from "@/lib/subscription-access";
import {
  makeReferralCode,
  normalizeReferralCode,
} from "@/lib/referrals";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

async function resolveReferrerId(
  admin: ReturnType<typeof createSupabaseAdmin>,
  code: unknown,
  currentUserId: string
) {
  const referralCode =
    normalizeReferralCode(code);

  if (!referralCode) {
    return null;
  }

  const { data: referrer } =
    await admin
      .from("market_profiles")
      .select("id")
      .eq("referral_code", referralCode)
      .maybeSingle();

  if (
    !referrer?.id ||
    referrer.id === currentUserId
  ) {
    return null;
  }

  return referrer.id as string;
}

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

    const metadataUsername =
      sanitizeUsername(
        typeof user.user_metadata
          ?.username === "string"
          ? user.user_metadata.username
          : ""
      );

    let { data: profile } =
      await admin
        .from("market_profiles")
        .select(
          "username, email, subscription_tier, subscription_status, referral_code, referred_by_user_id"
        )
        .eq("id", user.id)
        .maybeSingle();

    if (
      !profile &&
      metadataUsername &&
      user.email
    ) {
      const referrerId =
        await resolveReferrerId(
          admin,
          user.user_metadata
            ?.referral_code,
          user.id
        );
      const { data: created } =
        await admin
          .from("market_profiles")
          .upsert(
            {
              id: user.id,
              email: user.email,
              username:
                metadataUsername,
              referral_code:
                makeReferralCode(
                  metadataUsername,
                  user.id
                ),
              referred_by_user_id:
                referrerId,
              referral_applied_at:
                referrerId
                  ? new Date().toISOString()
                  : null,
            },
            { onConflict: "id" }
          )
          .select(
            "username, email, subscription_tier, subscription_status, referral_code, referred_by_user_id"
          )
          .maybeSingle();

      profile = created;
    }

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
      subscriptionTier:
        profile?.subscription_tier ||
        null,
      subscriptionStatus:
        profile?.subscription_status ||
        null,
      referralCode:
        profile?.referral_code ||
        null,
      referredByUserId:
        profile?.referred_by_user_id ||
        null,
      hasActiveSubscription:
        hasActivePaidSubscription(
          profile,
          user
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

    const { data: existingProfile } =
      await admin
        .from("market_profiles")
        .select(
          "referral_code,referred_by_user_id"
        )
        .eq("id", user.id)
        .maybeSingle();

    const referrerId =
      existingProfile
        ?.referred_by_user_id
        ? null
        : await resolveReferrerId(
            admin,
            body.referralCode ||
              user.user_metadata
                ?.referral_code,
            user.id
          );

    const { error } =
      await admin
        .from("market_profiles")
        .upsert(
          {
            id: user.id,
            email,
            username,
            referral_code:
              existingProfile
                ?.referral_code ||
              makeReferralCode(
                username,
                user.id
              ),
            ...(referrerId
              ? {
                  referred_by_user_id:
                    referrerId,
                  referral_applied_at:
                    new Date().toISOString(),
                }
              : {}),
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
