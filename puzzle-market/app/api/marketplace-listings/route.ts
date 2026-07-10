import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { loadMarketplaceListings } from "@/lib/marketplace-listings";

export const runtime = "nodejs";
export const revalidate = 15;

const loadCachedMarketplaceListings =
  unstable_cache(
    (limit: number, offset: number) =>
      loadMarketplaceListings({
        limit,
        offset,
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

    const result =
      await loadCachedMarketplaceListings(
        Number.isFinite(limit)
          ? limit
          : 12,
        Number.isFinite(offset)
          ? offset
          : 0
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
