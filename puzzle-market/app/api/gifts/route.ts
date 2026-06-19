import { NextResponse } from "next/server";

import { sendGiftInviteEmail } from "@/lib/gift-email";
import { createGiftToken } from "@/lib/piece-gifts";
import { getCanonicalSiteUrl } from "@/lib/site-url";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

function normalizeEmail(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

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
    const pieceId =
      String(body.pieceId || "");
    const recipientEmail =
      normalizeEmail(body.email);
    const message =
      typeof body.message === "string"
        ? body.message.trim().slice(0, 500)
        : "";

    if (!pieceId || !recipientEmail.includes("@")) {
      return NextResponse.json(
        {
          error:
            "Piece and recipient email are required",
        },
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

    if (
      userData.user.email?.toLowerCase() ===
      recipientEmail
    ) {
      return NextResponse.json(
        {
          error:
            "Use another email for a gift recipient",
        },
        { status: 400 }
      );
    }

    const {
      data: profile,
    } = await admin
      .from("market_profiles")
      .select("username")
      .eq("id", userData.user.id)
      .maybeSingle();

    const {
      data: ownership,
    } = await admin
      .from("piece_ownership")
      .select(
        "piece_id,puzzle_pieces(piece_index,puzzle_catalog(title,slug))"
      )
      .eq("piece_id", pieceId)
      .eq(
        "owner_user_id",
        userData.user.id
      )
      .maybeSingle();

    if (!ownership) {
      return NextResponse.json(
        {
          error:
            "You do not own this piece",
        },
        { status: 403 }
      );
    }

    await admin
      .from("piece_listings")
      .update({
        status: "cancelled",
      })
      .eq("piece_id", pieceId)
      .eq("status", "active");

    const giftToken =
      createGiftToken();

    const {
      data: gift,
      error: giftError,
    } = await admin
      .from("piece_gifts")
      .insert({
        piece_id: pieceId,
        sender_user_id:
          userData.user.id,
        recipient_email:
          recipientEmail,
        gift_token: giftToken,
        message,
      })
      .select("id,gift_token")
      .single();

    if (giftError) {
      return NextResponse.json(
        {
          error: giftError.message,
        },
        { status: 409 }
      );
    }

    const rawPiece =
      ownership.puzzle_pieces as
        | unknown[]
        | unknown;
    const piece = (
      Array.isArray(rawPiece)
        ? rawPiece[0]
        : rawPiece
    ) as
      | {
          piece_index: number;
          puzzle_catalog:
            | {
                title: string;
                slug: string;
              }
            | {
                title: string;
                slug: string;
              }[];
        }
      | undefined;
    const catalog =
      Array.isArray(
        piece?.puzzle_catalog
      )
        ? piece?.puzzle_catalog[0]
        : piece?.puzzle_catalog;

    const origin =
      getCanonicalSiteUrl();
    const claimUrl =
      `${origin}/gift/${encodeURIComponent(gift.gift_token)}`;

    const emailResult =
      catalog
        ? await sendGiftInviteEmail({
            to: recipientEmail,
            senderName:
              profile?.username ||
              "A Puzzle Market collector",
            puzzleTitle:
              catalog.title,
            pieceIndex:
              piece?.piece_index || 0,
            claimUrl,
          })
        : {
            sent: false,
            reason:
              "Puzzle catalog not found",
          };

    return NextResponse.json({
      giftId: gift.id,
      claimUrl,
      emailSent: emailResult.sent,
      emailReason:
        "reason" in emailResult
          ? emailResult.reason
          : null,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Gift creation failed",
      },
      { status: 500 }
    );
  }
}
