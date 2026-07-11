import "server-only";

import { findFallbackPuzzle } from "@/lib/fallback-puzzles";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export type PuzzleDetail = {
  title: string;
  image_url: string;
  rows: number;
  columns: number;
  missing_piece_index: number | null;
  missing_piece_count?: number | null;
  market_piece_indexes?: number[];
  available_piece_indexes?: number[];
  active_listing_count?: number;
  lowest_price?: number | null;
  rarity: string | null;
  brand_name?: string | null;
  brand_country_code?: string | null;
  category?: string | null;
};

type CatalogRow = PuzzleDetail & {
  id: string;
  slug: string;
};

function fallbackToDetail(
  slug: string
): PuzzleDetail | null {
  const fallback =
    findFallbackPuzzle(slug);

  if (!fallback) {
    return null;
  }

  return {
    title: fallback.title,
    image_url: fallback.image_url,
    rows: fallback.rows,
    columns: fallback.columns,
    missing_piece_index:
      fallback.missing_piece_index ??
      null,
    missing_piece_count:
      fallback.missing_piece_count,
    market_piece_indexes:
      typeof fallback.missing_piece_index !==
      "number"
        ? []
        : [fallback.missing_piece_index],
    rarity: fallback.rarity || "Rare",
    category: fallback.category,
    brand_name: fallback.brand_name,
    brand_country_code:
      fallback.brand_country_code,
    active_listing_count: 0,
    lowest_price: null,
    available_piece_indexes: [],
  };
}

export async function loadPuzzleDetail(
  slug: string
): Promise<PuzzleDetail | null> {
  if (!slug) {
    return null;
  }

  try {
    const admin =
      createSupabaseAdmin();

    let { data, error } =
      await admin
        .from("puzzle_catalog")
        .select(
          "id,slug,title,image_url,rows,columns,missing_piece_index,rarity,missing_piece_count,brand_name,brand_country_code,category"
        )
        .eq("slug", slug)
        .maybeSingle<CatalogRow>();

    if (error?.code === "42703") {
      const legacyResult = await admin
        .from("puzzle_catalog")
        .select(
          "id,slug,title,image_url,rows,columns,missing_piece_index,rarity,missing_piece_count"
        )
        .eq("slug", slug)
        .maybeSingle<CatalogRow>();

      data = legacyResult.data
        ? {
            ...legacyResult.data,
            brand_name: null,
            brand_country_code: null,
            category: null,
          }
        : null;
      error = legacyResult.error;
    }

    if (error || !data) {
      return fallbackToDetail(slug);
    }

    const { data: pieces } =
      await admin
        .from("puzzle_pieces")
        .select("id,piece_index,is_market_piece")
        .eq("puzzle_id", data.id)
        .order("piece_index", {
          ascending: true,
        });

    const pieceIds =
      pieces?.map((piece) => piece.id) ||
      [];

    const { data: listings } =
      pieceIds.length > 0
        ? await admin
            .from("piece_listings")
            .select("piece_id,price_cents")
            .eq("status", "active")
            .in("piece_id", pieceIds)
        : { data: [] };

    const pieceIndexById = new Map(
      (pieces || []).map((piece) => [
        piece.id,
        piece.piece_index as number,
      ])
    );

    const activeListings =
      listings || [];

    const prices =
      activeListings
        .map((listing) =>
          Number(listing.price_cents)
        )
        .filter(Number.isFinite);

    const marketPieceIndexes =
      (pieces || [])
        .filter(
          (piece) =>
            piece.is_market_piece === true
        )
        .map(
          (piece) =>
            piece.piece_index as number
        );

    const availablePieceIndexes =
      activeListings
        .map((listing) =>
          pieceIndexById.get(
            listing.piece_id
          )
        )
        .filter(
          (
            index
          ): index is number =>
            Number.isInteger(index)
        );

    return {
      ...data,
      market_piece_indexes:
        marketPieceIndexes,
      available_piece_indexes:
        availablePieceIndexes,
      active_listing_count:
        activeListings.length,
      lowest_price:
        prices.length > 0
          ? Math.min(...prices) / 100
          : null,
    };
  } catch (error) {
    console.warn(
      "Puzzle detail unavailable",
      error
    );
    return fallbackToDetail(slug);
  }
}
