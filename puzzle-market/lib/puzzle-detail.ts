import "server-only";

import { findFallbackPuzzle } from "@/lib/fallback-puzzles";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export type PuzzleDetail = {
  slug?: string;
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
  current_price?: number | null;
  available_fragments?: {
    listing_id: string;
    piece_index: number;
    price: number;
    sale_type: "Primary Sale" | "Collector Resale";
  }[];
  rarity: string | null;
  brand_name?: string | null;
  brand_country_code?: string | null;
  category?: string | null;
};

type CatalogRow = PuzzleDetail & {
  id: string;
  slug: string;
};

const catalogSelect =
  "id,slug,title,image_url,rows,columns,missing_piece_index,rarity,missing_piece_count,brand_name,brand_country_code,category";

const legacyCatalogSelect =
  "id,slug,title,image_url,rows,columns,missing_piece_index,rarity,missing_piece_count";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function safePositiveNumber(
  value: unknown,
  fallback: number
) {
  const number = Number(value);

  return Number.isFinite(number) &&
    number > 0
    ? number
    : fallback;
}

function normalizeDetail(
  detail: Partial<PuzzleDetail> & {
    id?: string;
    slug?: string;
  },
  requestedSlug: string
): PuzzleDetail {
  const rows = safePositiveNumber(
    detail.rows,
    4
  );
  const columns = safePositiveNumber(
    detail.columns,
    4
  );
  const missingPieceIndex =
    typeof detail.missing_piece_index ===
      "number" &&
    detail.missing_piece_index >= 0
      ? detail.missing_piece_index
      : null;
  const missingPieceCount =
    typeof detail.missing_piece_count ===
      "number" &&
    detail.missing_piece_count >= 0
      ? detail.missing_piece_count
      : missingPieceIndex === null
        ? 0
        : 1;

  return {
    title:
      detail.title?.trim() ||
      "Puzzle Collection",
    slug:
      detail.slug ||
      requestedSlug,
    image_url:
      detail.image_url?.trim() ||
      "/puzzle-market-cube-logo.png",
    rows,
    columns,
    missing_piece_index:
      missingPieceIndex,
    missing_piece_count:
      missingPieceCount,
    market_piece_indexes:
      detail.market_piece_indexes ||
      (missingPieceIndex === null
        ? []
        : [missingPieceIndex]),
    rarity:
      detail.rarity || "Rare",
    category:
      detail.category || "Other",
    brand_name:
      detail.brand_name || null,
    brand_country_code:
      detail.brand_country_code || null,
    active_listing_count:
      detail.active_listing_count || 0,
    lowest_price:
      detail.lowest_price ?? null,
    current_price:
      detail.current_price ?? null,
    available_fragments:
      detail.available_fragments || [],
    available_piece_indexes:
      detail.available_piece_indexes || [],
  };
}

function fallbackToDetail(
  slug: string
): PuzzleDetail | null {
  const fallback =
    findFallbackPuzzle(slug);

  if (!fallback) {
    return null;
  }

  return normalizeDetail({
    title: fallback.title,
    slug: fallback.slug,
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
    current_price: null,
    available_fragments: [],
    available_piece_indexes: [],
  }, slug);
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
        .select(catalogSelect)
        .eq("slug", slug)
        .maybeSingle<CatalogRow>();

    if (error?.code === "42703") {
      const legacyResult = await admin
        .from("puzzle_catalog")
        .select(legacyCatalogSelect)
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

    if (!error && !data && isUuid(slug)) {
      const byIdResult = await admin
        .from("puzzle_catalog")
        .select(catalogSelect)
        .eq("id", slug)
        .maybeSingle<CatalogRow>();

      if (byIdResult.error?.code === "42703") {
        const legacyById = await admin
          .from("puzzle_catalog")
          .select(legacyCatalogSelect)
          .eq("id", slug)
          .maybeSingle<CatalogRow>();

        data = legacyById.data
          ? {
              ...legacyById.data,
              brand_name: null,
              brand_country_code: null,
              category: null,
            }
          : null;
        error = legacyById.error;
      } else {
        data = byIdResult.data;
        error = byIdResult.error;
      }
    }

    if (error || !data) {
      return fallbackToDetail(slug);
    }

    const normalizedData =
      normalizeDetail(data, slug) as PuzzleDetail &
        CatalogRow;

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
            .select("id,piece_id,price_cents,seller_user_id")
            .eq("status", "active")
            .in("piece_id", pieceIds)
            .order("price_cents", {
              ascending: true,
            })
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

    const { data: trades } =
      pieceIds.length > 0
        ? await admin
            .from("piece_trades")
            .select("piece_id")
            .in("piece_id", pieceIds)
        : { data: [] };

    const tradedPieceIds =
      new Set(
        (trades || []).map(
          (trade) => trade.piece_id
        )
      );

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
      ...normalizedData,
      market_piece_indexes:
        marketPieceIndexes.length > 0
          ? marketPieceIndexes
          : normalizedData.market_piece_indexes,
      available_piece_indexes:
        availablePieceIndexes,
      active_listing_count:
        activeListings.length,
      lowest_price:
        prices.length > 0
          ? Math.min(...prices) / 100
          : null,
      current_price:
        prices.length > 0
          ? Math.min(...prices) / 100
          : null,
      available_fragments:
        activeListings
          .slice(0, 6)
          .map((listing) => ({
            listing_id: String(listing.id),
            piece_index:
              pieceIndexById.get(
                listing.piece_id
              ) ?? 0,
            price:
              Number(listing.price_cents) /
              100,
            sale_type:
              tradedPieceIds.has(
                listing.piece_id
              )
                ? "Collector Resale"
                : "Primary Sale",
          })),
    };
  } catch (error) {
    console.warn(
      "Puzzle detail unavailable",
      error
    );
    return fallbackToDetail(slug);
  }
}
