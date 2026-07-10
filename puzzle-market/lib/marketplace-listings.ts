import "server-only";

import {
  listingPricePayload,
  loadListingPriceHistory,
} from "@/lib/listing-price-history";
import { publicOwnerName } from "@/lib/public-identity";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

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
  sale_type: "Primary Sale" | "Resale";
  availability: "Available";
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
};

function normalizeListingType(
  row: ListingRow
): "Primary Sale" | "Resale" {
  const rawType =
    row.listing_type?.toLowerCase() || "";

  if (
    rawType.includes("primary") ||
    rawType.includes("vault")
  ) {
    return "Primary Sale";
  }

  return "Resale";
}

export async function loadMarketplaceListings({
  limit,
}: {
  limit?: number;
} = {}): Promise<MarketplaceListingsResult> {
  const admin =
    createSupabaseAdmin();

  const maxRows =
    Math.max(1, limit || 300);

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
    .range(0, maxRows - 1);

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
            rarity
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
      .range(0, maxRows - 1);

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
                  category: null,
                  brand_name: null,
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

  const priceHistoryPromise =
    loadListingPriceHistory(
      admin,
      rows.map((row) => row.id)
    );

  const [
    { data: sellers },
    priceHistoryMap,
  ] = await Promise.all([
    sellersPromise,
    priceHistoryPromise,
  ]);

  const sellerMap = new Map(
    (sellers || []).map((seller) => [
      seller.id,
      seller,
    ])
  );

  const listings = rows.map((row) => {
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

    return {
      id: row.id,
      seller_user_id:
        row.seller_user_id,
      seller_name:
        publicOwnerName(seller),
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
        normalizeListingType(row),
      availability: "Available" as const,
      ...listingPricePayload(
        row.id,
        row.price_cents,
        priceHistoryMap
      ),
    };
  });

  return {
    listings,
    activeCount: count ?? listings.length,
  };
}
