import type { SupabaseClient } from "@supabase/supabase-js";

import {
  growthBpsForPriceCents,
  type PriceHistoryPoint,
} from "@/lib/price-index";

type PriceHistoryRow = {
  listing_id: string;
  price_cents: number;
  previous_price_cents: number | null;
  growth_bps: number | null;
  reason: string;
  effective_at: string;
};

export async function loadListingPriceHistory(
  admin: SupabaseClient,
  listingIds: string[]
) {
  const uniqueIds = [
    ...new Set(
      listingIds.filter(Boolean)
    ),
  ];

  if (uniqueIds.length === 0) {
    return new Map<
      string,
      PriceHistoryPoint[]
    >();
  }

  const { data, error } =
    await admin
      .from("piece_price_history")
      .select(
        "listing_id,price_cents,previous_price_cents,growth_bps,reason,effective_at"
      )
      .in("listing_id", uniqueIds)
      .order("effective_at", {
        ascending: true,
      });

  if (error) {
    if (
      error.code === "42P01" ||
      error.code === "42703"
    ) {
      return new Map<
        string,
        PriceHistoryPoint[]
      >();
    }

    throw error;
  }

  const map = new Map<
    string,
    PriceHistoryPoint[]
  >();

  for (const row of
    (data || []) as PriceHistoryRow[]) {
    const points =
      map.get(row.listing_id) || [];

    points.push({
      date: row.effective_at,
      price: row.price_cents / 100,
      previousPrice:
        row.previous_price_cents === null
          ? null
          : row.previous_price_cents /
            100,
      growthPercent:
        row.growth_bps === null
          ? null
          : row.growth_bps / 100,
      reason: row.reason,
    });

    map.set(row.listing_id, points);
  }

  return map;
}

export function listingPricePayload(
  listingId: string,
  priceCents: number,
  historyMap: Map<
    string,
    PriceHistoryPoint[]
  >
) {
  const history =
    historyMap.get(listingId) || [];

  const hasCurrentPoint =
    history.some(
      (point) =>
        Math.round(point.price * 100) ===
        priceCents
    );

  const monthlyGrowthBps =
    growthBpsForPriceCents(
      priceCents
    );

  return {
    price_history: hasCurrentPoint
      ? history
      : [
          ...history,
          {
            date: new Date().toISOString(),
            price: priceCents / 100,
            previousPrice: null,
            growthPercent: null,
            reason: "current",
          },
        ],
    monthly_growth_percent:
      monthlyGrowthBps / 100,
  };
}

