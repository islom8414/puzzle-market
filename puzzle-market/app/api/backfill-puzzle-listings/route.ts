import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/market-access";
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

    const user =
      userData.user;

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const body = await request
      .json()
      .catch(() => ({}));

    const priceValue = Number(
      body.price
    );

    const priceCents =
      Number.isFinite(priceValue) &&
      priceValue > 0
        ? Math.round(
            priceValue * 100
          )
        : 10_000;

    const { data: pieces } =
      await admin
        .from("puzzle_pieces")
        .select("id")
        .eq(
          "is_market_piece",
          true
        );

    let repaired = 0;

    for (const piece of pieces || []) {
      const ownerId = isAdminEmail(
        user.email
      )
        ? (
            await admin
              .from(
                "piece_ownership"
              )
              .select(
                "owner_user_id"
              )
              .eq(
                "piece_id",
                piece.id
              )
              .maybeSingle()
          ).data?.owner_user_id ||
          user.id
        : user.id;

      await admin
        .from("piece_ownership")
        .upsert(
          {
            piece_id: piece.id,
            owner_user_id: ownerId,
          },
          {
            onConflict: "piece_id",
          }
        );

      const {
        data: existingListing,
      } = await admin
        .from("piece_listings")
        .select("id")
        .eq("piece_id", piece.id)
        .eq("status", "active")
        .maybeSingle();

      if (!existingListing) {
        await admin
          .from("piece_listings")
          .insert({
            piece_id: piece.id,
            seller_user_id: ownerId,
            price_cents: priceCents,
            status: "active",
          });

        repaired += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      repaired,
      priceCents,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Backfill failed",
      },
      { status: 500 }
    );
  }
}
