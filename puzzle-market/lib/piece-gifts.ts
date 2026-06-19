import "server-only";

import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createOwnershipCode } from "@/lib/ownership-certificate";
import { sendOwnershipEmail } from "@/lib/ownership-email";
import { getCanonicalSiteUrl } from "@/lib/site-url";

export function createGiftToken() {
  return crypto
    .randomBytes(24)
    .toString("base64url");
}

type ClaimedGift = {
  gift_id: string;
  trade_id: string;
  piece_id: string;
  puzzle_title: string;
  puzzle_slug: string;
  piece_index: number;
};

export async function claimGiftByToken(
  admin: SupabaseClient,
  user: {
    id: string;
    email?: string | null;
  },
  giftToken: string
) {
  if (!user.email) {
    return {
      claimed: false,
      error: "Gift recipient email is missing",
    };
  }

  const { data, error } = await admin.rpc(
    "claim_piece_gift",
    {
      p_recipient_id: user.id,
      p_recipient_email: user.email,
      p_gift_token: giftToken,
    }
  );

  if (error) {
    return {
      claimed: false,
      error: error.message,
    };
  }

  const claim = Array.isArray(data)
    ? (data[0] as ClaimedGift | undefined)
    : (data as ClaimedGift | undefined);

  if (!claim) {
    return {
      claimed: false,
      error: "Gift claim returned no result",
    };
  }

  const origin = getCanonicalSiteUrl();
  const certificateCode = createOwnershipCode({
    tradeId: claim.trade_id,
    pieceId: claim.piece_id,
    ownerId: user.id,
  });
  const certificateUrl =
    `${origin}/ownership/${encodeURIComponent(certificateCode)}`;

  const emailResult =
    await sendOwnershipEmail({
      to: user.email,
      puzzleTitle: claim.puzzle_title,
      puzzleSlug: claim.puzzle_slug,
      tradeId: claim.trade_id,
      pieceId: claim.piece_id,
      pieceIndex: claim.piece_index,
      certificateCode,
      certificateUrl,
      origin,
    });

  return {
    claimed: true,
    giftId: claim.gift_id,
    tradeId: claim.trade_id,
    pieceId: claim.piece_id,
    puzzleTitle: claim.puzzle_title,
    puzzleSlug: claim.puzzle_slug,
    emailSent: emailResult.sent,
    emailReason:
      "reason" in emailResult
        ? emailResult.reason
        : null,
  };
}

export async function claimPendingGiftsForUser(
  admin: SupabaseClient,
  user: {
    id: string;
    email?: string | null;
  }
) {
  if (!user.email) {
    return [];
  }

  const { data: gifts } = await admin
    .from("piece_gifts")
    .select("gift_token")
    .eq("status", "pending")
    .ilike("recipient_email", user.email);

  const results = [];

  for (const gift of gifts || []) {
    if (!gift.gift_token) {
      continue;
    }

    results.push(
      await claimGiftByToken(
        admin,
        user,
        gift.gift_token
      )
    );
  }

  return results;
}
