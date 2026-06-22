import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  listingPricePayload,
  loadListingPriceHistory,
} from "@/lib/listing-price-history";
import { publicOwnerName } from "@/lib/public-identity";

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
          .select("id,username")
          .in("id", sellerIds);

      const sellerMap = new Map(
        (sellers || []).map(
          (seller) => [
            seller.id,
            seller,
          ]
        )
      );

      const priceHistoryMap =
        await loadListingPriceHistory(
          admin,
          (listings || []).map(
            (item) => item.id
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
            seller_name:
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
            rarity:
              catalog.rarity ||
              "Rare",
            category:
              catalog.category ||
              "Other",
            brand:
              catalog.brand_name ||
              null,
            created_at:
              listing.created_at,
            exact_listing: true,
            puzzle_rows: catalog.rows,
            puzzle_columns:
              catalog.columns,
            ...listingPricePayload(
              listing.id,
              listing.price_cents,
              priceHistoryMap
            ),
          };
        }
      );

      return NextResponse.json({
        listings: mapped,
      });
    }

    const {
      data: ownerUsers,
    } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const ownerUser =
      ownerUsers?.users.find(
        (user) =>
          user.app_metadata
            ?.platform_owner === true
      );
    const { data: ownerProfile } =
      ownerUser
        ? await admin
            .from("market_profiles")
            .select("*")
            .eq("id", ownerUser.id)
            .maybeSingle()
        : { data: null };

    if (!ownerProfile) {
      return NextResponse.json({
        listings: [],
        warning:
          "Marketplace vault is not configured",
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

      if (listing) {
        await admin.rpc(
          "record_piece_listing_price",
          {
            p_listing_id:
              listing.id,
            p_reason: "created",
          }
        );
      }
    }

    if (!listing) {
      return NextResponse.json({
        listings: [],
      });
    }

    const priceHistoryMap =
      await loadListingPriceHistory(
        admin,
        [listing.id]
      );

    const {
      data: seller,
    } =
      await admin
        .from("market_profiles")
        .select("id,username")
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
          seller_name:
            publicOwnerName(
              seller
            ),
          fragment_id: catalog.slug,
          title: catalog.title,
          image: catalog.image_url,
          piece: String(pieceIndex),
          price:
            listing.price_cents / 100,
          rarity:
            catalog.rarity ||
            "Rare",
          category:
            catalog.category ||
            "Other",
          brand:
            catalog.brand_name ||
            null,
          created_at:
            listing.created_at,
          exact_listing: true,
          puzzle_rows: catalog.rows,
          puzzle_columns:
            catalog.columns,
          ...listingPricePayload(
            listing.id,
            listing.price_cents,
            priceHistoryMap
          ),
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
