import "server-only";

import {
  isPlatformOwnerName,
  publicOwnerName,
} from "@/lib/public-identity";
import { normalizePuzzleCategory } from "@/lib/brand-metadata";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { growthBpsForPriceCents } from "@/lib/price-index";

export type MarketplaceListing = {
  id: number | string;
  seller_name: string;
  seller_user_id?: string;
  fragment_id: string;
  title: string;
  image: string;
  piece: string;
  price: number;
  rarity: string;
  category?: string;
  brand?: string | null;
  created_at?: string;
  exact_listing?: boolean;
  puzzle_rows?: number;
  puzzle_columns?: number;
  sale_type: "Primary Sale" | "Collector Resale";
  availability: "Available";
  available_supply: number;
  total_supply: number;
  price_history?: import("@/lib/price-index").PriceHistoryPoint[];
  monthly_growth_percent?: number;
};

type ListingRow = {
  id: string;
  price_cents: number;
  created_at: string;
  seller_user_id: string;
  piece_id?: string;
  listing_type?: string | null;
  puzzle_pieces: {
    piece_index: number;
    puzzle_catalog: {
      slug: string;
      title: string;
      image_url: string;
      rows: number;
      columns: number;
      rarity: string | null;
      category: string | null;
      brand_name: string | null;
    } | {
      slug: string;
      title: string;
      image_url: string;
      rows: number;
      columns: number;
      rarity: string | null;
      category: string | null;
      brand_name: string | null;
    }[];
  } | {
    piece_index: number;
    puzzle_catalog: {
      slug: string;
      title: string;
      image_url: string;
      rows: number;
      columns: number;
      rarity: string | null;
      category: string | null;
      brand_name: string | null;
    };
  }[];
};

export type MarketplaceListingsResult = {
  listings: MarketplaceListing[];
  activeCount: number;
  nextOffset: number | null;
};

export type MarketplaceListingFilters = {
  search?: string;
  category?: string;
  rarity?: string;
  saleType?: "ALL" | "Primary Sale" | "Collector Resale";
  priceRange?: "ALL" | "UNDER_25" | "25_100" | "OVER_100";
};

function hasMarketplaceFilters(
  filters?: MarketplaceListingFilters
) {
  return Boolean(
    filters?.search?.trim() ||
      (filters?.category && filters.category !== "ALL") ||
      (filters?.rarity && filters.rarity !== "ALL") ||
      (filters?.saleType && filters.saleType !== "ALL") ||
      (filters?.priceRange && filters.priceRange !== "ALL")
  );
}

function categoryMatchesFilter(
  itemCategory: string | null | undefined,
  selectedCategory: string
) {
  return (
    normalizePuzzleCategory(itemCategory) ===
    normalizePuzzleCategory(selectedCategory)
  );
}

function listingMatchesFilters(
  listing: MarketplaceListing,
  filters?: MarketplaceListingFilters
) {
  const search = filters?.search?.trim().toLowerCase();

  if (
    search &&
    !listing.title.toLowerCase().includes(search)
  ) {
    return false;
  }

  if (
    filters?.category &&
    filters.category !== "ALL" &&
    !categoryMatchesFilter(
      listing.category,
      filters.category
    )
  ) {
    return false;
  }

  if (
    filters?.rarity &&
    filters.rarity !== "ALL" &&
    listing.rarity !== filters.rarity
  ) {
    return false;
  }

  if (
    filters?.saleType &&
    filters.saleType !== "ALL" &&
    listing.sale_type !== filters.saleType
  ) {
    return false;
  }

  if (filters?.priceRange === "UNDER_25") {
    return listing.price < 25;
  }

  if (filters?.priceRange === "25_100") {
    return listing.price >= 25 && listing.price <= 100;
  }

  if (filters?.priceRange === "OVER_100") {
    return listing.price > 100;
  }

  return true;
}

function normalizeListingType(
  row: ListingRow,
  sellerName?: string | null,
  hasVerifiedTrade = false
): "Primary Sale" | "Collector Resale" {
  const rawType =
    row.listing_type?.toLowerCase() || "";

  if (hasVerifiedTrade) {
    return "Collector Resale";
  }

  if (
    rawType.includes("primary") ||
    rawType.includes("vault")
  ) {
    return "Primary Sale";
  }

  if (isPlatformOwnerName(sellerName)) {
    return "Primary Sale";
  }

  return "Collector Resale";
}

export async function loadMarketplaceListings({
  limit,
  offset,
  filters,
}: {
  limit?: number;
  offset?: number;
  filters?: MarketplaceListingFilters;
} = {}): Promise<MarketplaceListingsResult> {
  const admin =
    createSupabaseAdmin();

  const maxRows =
    Math.min(
      24,
      Math.max(1, limit || 12)
    );

  const startOffset =
    Math.max(0, offset || 0);

  const hasFilters =
    hasMarketplaceFilters(filters);

  const dbStartOffset =
    hasFilters ? 0 : startOffset;

  const dbMaxRows =
    hasFilters ? 2000 : maxRows;

  const query = admin
    .from("piece_listings")
    .select(
      `
      id,
      piece_id,
      price_cents,
      created_at,
      seller_user_id,
      listing_type,
      puzzle_pieces!inner (
        piece_index,
        puzzle_catalog!inner (
          slug,
          title,
          image_url,
          rows,
          columns,
          rarity,
          category,
          brand_name
        )
      )
    `,
      {
        count: "exact",
      }
    )
    .eq("status", "active")
    .order("created_at", {
      ascending: false,
    })
    .range(
      dbStartOffset,
      dbStartOffset + dbMaxRows - 1
    );

  let { data, error, count } =
    await query;

  if (error?.code === "42703") {
    const legacyResult = await admin
      .from("piece_listings")
      .select(
        `
        id,
        piece_id,
        price_cents,
        created_at,
        seller_user_id,
        puzzle_pieces!inner (
          piece_index,
          puzzle_catalog!inner (
            slug,
            title,
            image_url,
          rows,
          columns,
          rarity,
          category,
          brand_name
        )
      )
      `,
        {
          count: "exact",
        }
      )
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      })
      .range(
        dbStartOffset,
        dbStartOffset + dbMaxRows - 1
      );

    data =
      legacyResult.data?.map((row) => {
        const pieces = Array.isArray(
          row.puzzle_pieces
        )
          ? row.puzzle_pieces
          : [row.puzzle_pieces];

        return {
          ...row,
          listing_type: null,
          puzzle_pieces: pieces.map((piece) => {
            const catalogs = Array.isArray(
              piece.puzzle_catalog
            )
              ? piece.puzzle_catalog
              : [piece.puzzle_catalog];

            return {
              ...piece,
              puzzle_catalog: catalogs.map(
                (catalog) => ({
                  ...catalog,
                  category:
                    catalog.category || null,
                  brand_name:
                    catalog.brand_name || null,
                })
              ),
            };
          }),
        };
      }) || null;
    error = legacyResult.error;
    count = legacyResult.count;
  }

  if (error) {
    throw error;
  }

  const rows =
    (data as unknown as ListingRow[]) || [];

  const sellerIds = [
    ...new Set(
      rows.map((row) => row.seller_user_id)
    ),
  ];

  const sellersPromise =
    sellerIds.length === 0
      ? Promise.resolve({ data: [] })
      : admin
          .from("market_profiles")
          .select("id,username")
          .in("id", sellerIds);

  const { data: sellers } =
    await sellersPromise;

  const pieceIds = rows
    .map((row) => row.piece_id)
    .filter(
      (pieceId): pieceId is string =>
        typeof pieceId === "string" &&
        pieceId.length > 0
    );

  const { data: trades } =
    pieceIds.length === 0
      ? { data: [] }
      : await admin
          .from("piece_trades")
          .select("piece_id")
          .in("piece_id", pieceIds);

  const tradedPieceIds =
    new Set(
      (trades || []).map(
        (trade) => trade.piece_id
      )
    );

  const sellerMap = new Map(
    (sellers || []).map((seller) => [
      seller.id,
      seller,
    ])
  );

  const allListings = rows.map((row) => {
    const piece = Array.isArray(
      row.puzzle_pieces
    )
      ? row.puzzle_pieces[0]
      : row.puzzle_pieces;

    const catalog = Array.isArray(
      piece.puzzle_catalog
    )
      ? piece.puzzle_catalog[0]
      : piece.puzzle_catalog;

    const seller =
      sellerMap.get(row.seller_user_id);
    const sellerName =
      publicOwnerName(seller);

    const totalSupply =
      Math.max(
        1,
        (catalog.rows || 1) *
          (catalog.columns || 1)
      );

    return {
      id: row.id,
      seller_user_id:
        row.seller_user_id,
      seller_name:
        sellerName,
      fragment_id:
        catalog.slug,
      title: catalog.title,
      image: catalog.image_url,
      piece: String(piece.piece_index),
      price: row.price_cents / 100,
      rarity: catalog.rarity || "Rare",
      category:
        catalog.category || "Other",
      brand: catalog.brand_name || null,
      created_at: row.created_at,
      exact_listing: true,
      puzzle_rows: catalog.rows,
      puzzle_columns: catalog.columns,
      sale_type:
        normalizeListingType(
          row,
          sellerName,
          row.piece_id
            ? tradedPieceIds.has(
                row.piece_id
              )
            : false
        ),
      availability: "Available" as const,
      available_supply: 1,
      total_supply: totalSupply,
      monthly_growth_percent:
        normalizeListingType(
          row,
          sellerName,
          row.piece_id
            ? tradedPieceIds.has(
                row.piece_id
              )
            : false
        ) === "Primary Sale"
          ? growthBpsForPriceCents(
              row.price_cents
            ) / 100
          : undefined,
    };
  });

  const matchedListings =
    hasFilters
      ? allListings.filter((listing) =>
          listingMatchesFilters(
            listing,
            filters
          )
        )
      : allListings;

  const listings =
    hasFilters
      ? matchedListings.slice(
          startOffset,
          startOffset + maxRows
        )
      : matchedListings;

  const activeCount =
    hasFilters
      ? matchedListings.length
      : count ?? startOffset + listings.length;

  return {
    listings,
    activeCount,
    nextOffset:
      startOffset + listings.length <
      activeCount
        ? startOffset + listings.length
        : null,
  };
}
