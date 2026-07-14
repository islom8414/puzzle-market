import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { loadMarketplaceListings } from "@/lib/marketplace-listings";

export const runtime = "nodejs";
export const revalidate = 15;

const loadCachedMarketplaceListings =
  unstable_cache(
    (
      limit: number,
      offset: number,
      search: string,
      category: string,
      rarity: string,
      saleType: string,
      priceRange: string
    ) =>
      loadMarketplaceListings({
        limit,
        offset,
        filters: {
          search,
          category,
          rarity,
          saleType:
            saleType === "Primary Sale" ||
            saleType === "Collector Resale"
              ? saleType
              : "ALL",
          priceRange:
            priceRange === "UNDER_25" ||
            priceRange === "25_100" ||
            priceRange === "OVER_100"
              ? priceRange
              : "ALL",
        },
      }),
    ["marketplace-listings-api-page"],
    {
      revalidate: 15,
      tags: ["marketplace-listings"],
    }
  );

export async function GET(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const limit = Number(
      searchParams.get("limit") || 12
    );
    const offset = Number(
      searchParams.get("offset") || 0
    );
    const search =
      searchParams.get("search") || "";
    const category =
      searchParams.get("category") || "ALL";
    const rarity =
      searchParams.get("rarity") || "ALL";
    const saleType =
      searchParams.get("saleType") || "ALL";
    const priceRange =
      searchParams.get("priceRange") || "ALL";

    const result =
      await loadCachedMarketplaceListings(
        Number.isFinite(limit)
          ? limit
          : 12,
        Number.isFinite(offset)
          ? offset
          : 0,
        search,
        category,
        rarity,
        saleType,
        priceRange
      );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        listings: [],
        activeCount: 0,
        error:
          error instanceof Error
            ? error.message
            : "Marketplace listings could not be loaded.",
      },
      { status: 500 }
    );
  }
}
