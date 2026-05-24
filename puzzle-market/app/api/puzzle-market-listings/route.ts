import { NextResponse } from "next/server";

import { puzzles } from "@/data/puzzles";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

const platformOwnerEmail =
  "islommatchanov888@gmail.com";

const rows = 5;
const columns = 5;

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
      searchParams.get("piece") || "";

    const pieceIndex =
      Number(pieceParam);

    const puzzle =
      puzzles.find(
        (item) =>
          item.slug === puzzleSlug
      );

    if (
      !puzzle ||
      !Number.isInteger(pieceIndex)
    ) {
      return NextResponse.json({
        listings: [],
      });
    }

    const admin =
      createSupabaseAdmin();

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
      data: catalog,
      error: catalogError,
    } =
      await admin
        .from("puzzle_catalog")
        .upsert(
          {
            slug: puzzle.slug,
            title: puzzle.title,
            image_url: puzzle.image,
            rows,
            columns,
            missing_piece_count: 1,
          },
          {
            onConflict: "slug",
          }
        )
        .select("*")
        .single();

    if (
      catalogError ||
      !catalog
    ) {
      return NextResponse.json(
        {
          error:
            catalogError?.message ||
            "Puzzle catalog failed",
        },
        {
          status: 500,
        }
      );
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
              puzzle.id * 100 +
              pieceIndex,
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
            price_cents:
              puzzle.price * 100,
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
            seller?.username ||
            seller?.email ||
            "Market Owner",
          fragment_id: puzzle.slug,
          title: puzzle.title,
          image: puzzle.image,
          piece: String(pieceIndex),
          price:
            listing.price_cents / 100,
          rarity: puzzle.rarity,
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
