import MarketplaceClient from "./MarketplaceClient";
import {
  loadMarketplaceListings,
  type MarketplaceListing,
} from "@/lib/marketplace-listings";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const loadCachedMarketplaceListings =
  unstable_cache(
    () =>
      loadMarketplaceListings({
        limit: 8,
      }),
    ["marketplace-listings-initial"],
    {
      revalidate: 15,
      tags: ["marketplace-listings"],
    }
  );

export default async function MarketplacePage() {
  let initialListings: MarketplaceListing[] = [];
  let initialActiveCount: number | null = null;
  let initialStatus: "success" | "error" =
    "success";

  try {
    const result =
      await loadCachedMarketplaceListings();

    initialListings =
      result.listings;
    initialActiveCount =
      result.activeCount;
  } catch (error) {
    console.error(
      "Marketplace listings could not be loaded.",
      error
    );
    initialStatus = "error";
  }

  return (
    <MarketplaceClient
      initialListings={initialListings}
      initialActiveCount={initialActiveCount}
      initialStatus={initialStatus}
    />
  );
}
