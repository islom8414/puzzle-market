import "server-only";

import type {
  SupabaseClient,
  User,
} from "@supabase/supabase-js";

import {
  isCompleteUsername,
  sanitizeUsername,
} from "@/lib/display-name";
import {
  makeReferralCode,
  normalizeReferralCode,
} from "@/lib/referrals";

type MarketProfile = {
  id: string;
  email: string;
  username: string;
  subscription_tier?: string | null;
  subscription_status?: string | null;
  referral_code?: string | null;
  referred_by_user_id?: string | null;
  stripe_account_id?: string | null;
  stripe_customer_id?: string | null;
};

function metadataString(
  user: User,
  key: string
) {
  const value =
    user.user_metadata?.[key];

  return typeof value === "string"
    ? value
    : "";
}

function usernameCandidates(
  user: User
) {
  const idSuffix =
    user.id
      .replace(/-/g, "")
      .slice(0, 8);

  const rawCandidates = [
    metadataString(user, "username"),
    metadataString(user, "preferred_username"),
    `collector_${idSuffix}`,
  ];

  const unique = new Set<string>();

  for (const raw of rawCandidates) {
    const clean =
      sanitizeUsername(raw);

    if (isCompleteUsername(clean)) {
      unique.add(clean);
    }
  }

  unique.add(`collector_${idSuffix}`);

  return [...unique].slice(0, 8);
}

async function resolveReferrerId(
  admin: SupabaseClient,
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

export async function ensureUserProfile(
  admin: SupabaseClient,
  user: User
) {
  const { data: existing, error } =
    await admin
      .from("market_profiles")
      .select(
        "id,email,username,subscription_tier,subscription_status,referral_code,referred_by_user_id,stripe_account_id,stripe_customer_id"
      )
      .eq("id", user.id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  const existingProfile =
    existing as MarketProfile | null;

  if (existingProfile?.username) {
    await admin
      .from("wallet_accounts")
      .upsert(
        { user_id: user.id },
        { onConflict: "user_id" }
      );

    return {
      profile: existingProfile,
      created: false,
    };
  }

  const email =
    user.email?.trim();

  if (!email) {
    throw new Error(
      "Account email is missing"
    );
  }

  const referrerId =
    await resolveReferrerId(
      admin,
      user.user_metadata?.referral_code,
      user.id
    );

  let lastError: unknown = null;

  for (const candidate of usernameCandidates(
    user
  )) {
    const username =
      sanitizeUsername(candidate);

    if (!isCompleteUsername(username)) {
      continue;
    }

    const payload = {
      id: user.id,
      email,
      username,
      referral_code:
        makeReferralCode(
          username,
          user.id
        ),
      referred_by_user_id:
        referrerId,
      referral_applied_at:
        referrerId
          ? new Date().toISOString()
          : null,
    };

    const { data: created, error: upsertError } =
      await admin
        .from("market_profiles")
        .upsert(payload, {
          onConflict: "id",
        })
        .select(
          "id,email,username,subscription_tier,subscription_status,referral_code,referred_by_user_id,stripe_account_id,stripe_customer_id"
        )
        .maybeSingle();

    const createdProfile =
      created as MarketProfile | null;

    if (!upsertError && createdProfile?.username) {
      await admin
        .from("wallet_accounts")
        .upsert(
          { user_id: user.id },
          { onConflict: "user_id" }
        );

      return {
        profile: createdProfile,
        created: true,
      };
    }

    lastError = upsertError;

    if (
      upsertError?.code !== "23505" &&
      !upsertError?.message
        ?.toLowerCase()
        .includes("duplicate")
    ) {
      break;
    }
  }

  const fallbackUsername =
    `collector_${user.id
      .replace(/-/g, "")
      .slice(0, 12)}`;

  const { data: fallback, error: fallbackError } =
    await admin
      .from("market_profiles")
      .upsert(
        {
          id: user.id,
          email,
          username: fallbackUsername,
          referral_code:
            makeReferralCode(
              fallbackUsername,
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
        "id,email,username,subscription_tier,subscription_status,referral_code,referred_by_user_id,stripe_account_id,stripe_customer_id"
      )
      .maybeSingle();

  const fallbackProfile =
    fallback as MarketProfile | null;

  if (
    fallbackError ||
    !fallbackProfile?.username
  ) {
    throw (
      fallbackError ||
      lastError ||
      new Error(
        "Failed to create market profile"
      )
    );
  }

  await admin
    .from("wallet_accounts")
    .upsert(
      { user_id: user.id },
      { onConflict: "user_id" }
    );

  return {
    profile: fallbackProfile,
    created: true,
  };
}
