import { NextResponse } from "next/server";

import {
  makeReferralCode,
  nextReferralMilestone,
} from "@/lib/referrals";
import { getCanonicalSiteUrl } from "@/lib/site-url";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(
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

    const { data: profile } =
      await admin
        .from("market_profiles")
        .select(
          "id,username,email,referral_code"
        )
        .eq("id", userData.user.id)
        .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Complete your profile first",
        },
        { status: 409 }
      );
    }

    const referralCode =
      profile.referral_code ||
      makeReferralCode(
        profile.username,
        userData.user.id
      );

    if (!profile.referral_code) {
      await admin
        .from("market_profiles")
        .update({
          referral_code:
            referralCode,
        })
        .eq("id", userData.user.id);
    }

    const [
      registeredResult,
      qualifiedResult,
      rewardsResult,
    ] = await Promise.all([
      admin
        .from("market_profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "referred_by_user_id",
          userData.user.id
        ),
      admin
        .from("market_profiles")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "referred_by_user_id",
          userData.user.id
        )
        .in("subscription_tier", [
          "starter",
          "premium",
          "creator",
          "sweepstakes",
        ])
        .in("subscription_status", [
          "active",
          "trialing",
        ]),
      admin
        .from("referral_rewards")
        .select(
          "id,threshold_count,qualified_count,reward_cents,remaining_cents,status,created_at,used_at"
        )
        .eq("user_id", userData.user.id)
        .order("threshold_count", {
          ascending: true,
        }),
    ]);

    const qualifiedCount =
      qualifiedResult.count || 0;
    const nextMilestone =
      nextReferralMilestone(
        qualifiedCount
      );

    return NextResponse.json({
      referralCode,
      referralUrl:
        `${getCanonicalSiteUrl()}/register?ref=${encodeURIComponent(referralCode)}`,
      registeredCount:
        registeredResult.count || 0,
      qualifiedCount,
      nextMilestone,
      rewards:
        rewardsResult.data || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load referrals",
      },
      { status: 500 }
    );
  }
}
