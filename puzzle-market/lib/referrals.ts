import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export const REFERRAL_MILESTONES = [
  { threshold: 3, rewardCents: 1000 },
  { threshold: 7, rewardCents: 2000 },
  { threshold: 12, rewardCents: 3500 },
  { threshold: 20, rewardCents: 6000 },
  { threshold: 30, rewardCents: 10000 },
];

const activeStatuses = new Set([
  "active",
  "trialing",
]);

export function normalizeReferralCode(
  value: unknown
) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

export function makeReferralCode(
  username: string,
  userId: string
) {
  const base =
    normalizeReferralCode(username)
      .replace(/[_-]/g, "")
      .slice(0, 12) || "PUZZLE";
  const suffix = userId
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return `${base}-${suffix}`;
}

export function nextReferralMilestone(
  qualifiedCount: number
) {
  return (
    REFERRAL_MILESTONES.find(
      (milestone) =>
        qualifiedCount <
        milestone.threshold
    ) || null
  );
}

export function isQualifiedSubscription(
  profile:
    | {
        subscription_tier?: string | null;
        subscription_status?: string | null;
      }
    | null
    | undefined
) {
  return (
    profile?.subscription_tier !== "free" &&
    activeStatuses.has(
      profile?.subscription_status || ""
    )
  );
}

export async function awardReferralRewards(
  admin: SupabaseClient,
  invitedUserId: string
) {
  const { data: invited } =
    await admin
      .from("market_profiles")
      .select(
        "id,referred_by_user_id,subscription_tier,subscription_status"
      )
      .eq("id", invitedUserId)
      .maybeSingle();

  if (
    !invited?.referred_by_user_id ||
    !isQualifiedSubscription(invited)
  ) {
    return;
  }

  const referrerId =
    invited.referred_by_user_id as string;

  const { count } = await admin
    .from("market_profiles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("referred_by_user_id", referrerId)
    .in("subscription_tier", [
      "starter",
      "premium",
      "creator",
      "sweepstakes",
    ])
    .in("subscription_status", [
      "active",
      "trialing",
    ]);

  const qualifiedCount = count || 0;

  const earnedMilestones =
    REFERRAL_MILESTONES.filter(
      (milestone) =>
        qualifiedCount >=
        milestone.threshold
    );

  for (const milestone of earnedMilestones) {
    await admin
      .from("referral_rewards")
      .upsert(
        {
          user_id: referrerId,
          threshold_count:
            milestone.threshold,
          qualified_count:
            qualifiedCount,
          reward_cents:
            milestone.rewardCents,
          remaining_cents:
            milestone.rewardCents,
          status: "active",
        },
        {
          onConflict:
            "user_id,threshold_count",
          ignoreDuplicates: true,
        }
      );
  }
}
