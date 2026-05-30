import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  platformOwnerEmails,
  publicOwnerName,
} from "@/lib/public-identity";

const platformOwnerEmail =
  platformOwnerEmails[0];

type PieceListingRow = {
  id: string;
  piece_id: string;
  seller_user_id: string;
  price_cents: number;
  status: string;
  created_at: string;
};

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const puzzleSlug =
      searchParams.get("puzzle") || "";

    const pieceParam =
      searchParams.get("piece");

    const hasPieceFilter =
      pieceParam !== null &&
      pieceParam.trim() !== "" &&
      Number.isInteger(
        Number(pieceParam)
      );

    const pieceIndex = hasPieceFilter
      ? Number(pieceParam)
      : NaN;

    if (!puzzleSlug) {
      return NextResponse.json({
        listings: [],
      });
    }

    const admin =
      createSupabaseAdmin();

    const {
      data: catalog,
      error: catalogError,
    } =
      await admin
        .from("puzzle_catalog")
        .select("*")
        .eq("slug", puzzleSlug)
        .maybeSingle();

    if (
      catalogError ||
      !catalog
    ) {
      return NextResponse.json({
        listings: [],
      });
    }

    if (!hasPieceFilter) {
      const { data: pieces } =
        await admin
          .from("puzzle_pieces")
          .select("id, piece_index")
          .eq(
            "puzzle_id",
            catalog.id
          );

      const pieceIds =
        pieces?.map(
          (item) => item.id
        ) || [];

      if (pieceIds.length === 0) {
        return NextResponse.json({
          listings: [],
        });
      }

      const { data: listings } =
        await admin
          .from("piece_listings")
          .select(
            "id, price_cents, created_at, seller_user_id, piece_id"
          )
          .eq("status", "active")
          .in("piece_id", pieceIds);

      const pieceMap = new Map(
        (pieces || []).map(
          (item) => [item.id, item]
        )
      );

      const sellerIds = [
        ...new Set(
          (listings || []).map(
            (item) =>
              item.seller_user_id
          )
        ),
      ];

      const { data: sellers } =
        await admin
          .from("market_profiles")
          .select(
            "id,email,username"
          )
          .in("id", sellerIds);

      const sellerMap = new Map(
        (sellers || []).map(
          (seller) => [
            seller.id,
            seller,
          ]
        )
      );

      const mapped = (listings || []).map(
        (listing) => {
          const piece =
            pieceMap.get(
              listing.piece_id
            );

          return {
            id: listing.id,
            seller_user_id:
              listing.seller_user_id,
            seller_email:
              publicOwnerName(
                sellerMap.get(
                  listing.seller_user_id
                )
              ),
            fragment_id:
              catalog.slug,
            title: catalog.title,
            image: catalog.image_url,
            piece: String(
              piece?.piece_index ?? 0
            ),
            price:
              listing.price_cents /
              100,
            rarity: "Legendary",
            created_at:
              listing.created_at,
            exact_listing: true,
            puzzle_rows: catalog.rows,
            puzzle_columns:
              catalog.columns,
          };
        }
      );

      return NextResponse.json({
        listings: mapped,
      });
    }

    const {
      data: ownerProfile,
    } =
      await admin
        .from("market_profiles")
        .select("*")
        .eq(
          "email",
          platformOwnerEmail
        )
        .maybeSingle();

    if (!ownerProfile) {
      return NextResponse.json({
        listings: [],
        warning:
          "Platform owner profile is missing",
      });
    }

    const {
      data: piece,
      error: pieceError,
    } =
      await admin
        .from("puzzle_pieces")
        .upsert(
          {
            puzzle_id: catalog.id,
            piece_index: pieceIndex,
            shape_seed:
              pieceIndex * 100 + 7,
            is_market_piece: true,
          },
          {
            onConflict:
              "puzzle_id,piece_index",
          }
        )
        .select("*")
        .single();

    if (
      pieceError ||
      !piece
    ) {
      return NextResponse.json(
        {
          error:
            pieceError?.message ||
            "Puzzle piece failed",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: ownership,
    } =
      await admin
        .from("piece_ownership")
        .select("*")
        .eq(
          "piece_id",
          piece.id
        )
        .maybeSingle();

    let currentOwnerId =
      ownership?.owner_user_id as
        | string
        | undefined;

    if (!currentOwnerId) {
      await admin
        .from("piece_ownership")
        .insert({
          piece_id: piece.id,
          owner_user_id:
            ownerProfile.id,
        });

      currentOwnerId =
        ownerProfile.id;
    }

    const {
      data: existingListing,
    } =
      await admin
        .from("piece_listings")
        .select("*")
        .eq(
          "piece_id",
          piece.id
        )
        .eq(
          "status",
          "active"
        )
        .maybeSingle<PieceListingRow>();

    let listing =
      existingListing;

    if (
      !listing &&
      currentOwnerId === ownerProfile.id
    ) {
      const {
        data,
      } =
        await admin
          .from("piece_listings")
          .insert({
            piece_id: piece.id,
            seller_user_id:
              ownerProfile.id,
            price_cents: 10_000,
            status: "active",
          })
          .select("*")
          .single<PieceListingRow>();

      listing = data;
    }

    if (!listing) {
      return NextResponse.json({
        listings: [],
      });
    }

    const {
      data: seller,
    } =
      await admin
        .from("market_profiles")
        .select(
          "id,email,username"
        )
        .eq(
          "id",
          listing.seller_user_id
        )
        .maybeSingle();

    return NextResponse.json({
      listings: [
        {
          id: listing.id,
          seller_user_id:
            listing.seller_user_id,
          seller_email:
            publicOwnerName(
              seller
            ),
          fragment_id: catalog.slug,
          title: catalog.title,
          image: catalog.image_url,
          piece: String(pieceIndex),
          price:
            listing.price_cents / 100,
          rarity: "Legendary",
          created_at:
            listing.created_at,
          exact_listing: true,
        },
      ],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Exact listing load failed",
      },
      {
        status: 500,
      }
    );
  }
}
