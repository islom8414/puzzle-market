import { NextResponse } from "next/server";

import { loadMarketplaceListings } from "@/lib/marketplace-listings";

export const runtime = "nodejs";
export const revalidate = 15;

export async function GET() {
  try {
    const result =
      await loadMarketplaceListings();

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
