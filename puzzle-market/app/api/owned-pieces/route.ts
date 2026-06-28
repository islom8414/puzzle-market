import { NextResponse } from "next/server";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import { getCanonicalSiteUrl } from "@/lib/site-url";

const QUERY_CHUNK_SIZE = 100;

function chunkValues<T>(
  values: T[],
  size = QUERY_CHUNK_SIZE
) {
  const chunks: T[][] = [];

  for (
    let index = 0;
    index < values.length;
    index += size
  ) {
    chunks.push(
      values.slice(index, index + size)
    );
  }

  return chunks;
}

export async function GET(
  request: Request
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: "Login required",
        },
        {
          status: 401,
        }
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
        {
          error: "Invalid session",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: ownership,
    } =
      await admin
        .from("piece_ownership")
        .select(
          "piece_id,acquired_at,puzzle_pieces(id,piece_index,puzzle_catalog(slug,title,image_url,rows,columns))"
        )
        .eq(
          "owner_user_id",
          userData.user.id
        );

    const pieceIds =
      ownership?.map(
        (row) => row.piece_id
      ) || [];

    const listings = [];
    const gifts = [];

    for (const chunk of chunkValues(pieceIds)) {
      const {
        data: listingRows,
        error: listingsError,
      } = await admin
        .from("piece_listings")
        .select(
          "id,piece_id,price_cents,status"
        )
        .in("piece_id", chunk)
        .eq("status", "active");

      if (listingsError) {
        throw listingsError;
      }

      listings.push(
        ...(listingRows || [])
      );

      const {
        data: giftRows,
        error: giftsError,
      } = await admin
        .from("piece_gifts")
        .select(
          "piece_id,recipient_email,gift_token,status"
        )
        .in("piece_id", chunk)
        .eq(
          "sender_user_id",
          userData.user.id
        )
        .eq("status", "pending");

      if (giftsError) {
        throw giftsError;
      }

      gifts.push(...(giftRows || []));
    }

    const activeByPiece =
      new Map(
        (listings || []).map(
          (listing) => [
            listing.piece_id,
            listing,
          ]
        )
      );
    const pendingGiftByPiece =
      new Map(
        (gifts || []).map(
          (gift) => [
            gift.piece_id,
            gift,
          ]
        )
      );
    const origin =
      getCanonicalSiteUrl();

    const pieces =
      (ownership || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (row: any) => {
          const piece =
            row.puzzle_pieces;
          const puzzle =
            piece?.puzzle_catalog;
          const listing =
            activeByPiece.get(
              row.piece_id
            );
          const gift =
            pendingGiftByPiece.get(
              row.piece_id
            );

          return {
            pieceId: row.piece_id,
            pieceIndex:
              piece?.piece_index,
            puzzleSlug:
              puzzle?.slug,
            title:
              puzzle?.title,
            image:
              puzzle?.image_url,
            rows:
              puzzle?.rows || 5,
            columns:
              puzzle?.columns || 5,
            listingId:
              listing?.id || null,
            listingPrice:
              listing
                ? listing.price_cents /
                  100
                : null,
            giftPendingEmail:
              gift?.recipient_email ||
              null,
            giftClaimUrl:
              gift?.gift_token
                ? `${origin}/gift/${encodeURIComponent(gift.gift_token)}`
                : null,
          };
        }
      );

    return NextResponse.json({
      pieces,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Owned pieces failed",
      },
      {
        status: 500,
      }
    );
  }
}
