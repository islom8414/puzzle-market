export type PriceHistoryPoint = {
  date: string;
  price: number;
  previousPrice: number | null;
  growthPercent: number | null;
  reason: string;
};

export function growthBpsForPriceCents(
  priceCents: number
) {
  if (priceCents <= 1_000) {
    return 500;
  }

  if (priceCents <= 10_000) {
    return 700;
  }

  return 900;
}

export function indexedPriceCents(
  priceCents: number,
  growthBps = growthBpsForPriceCents(
    priceCents
  )
) {
  return Math.max(
    priceCents + 1,
    Math.round(
      priceCents *
        (1 + growthBps / 10_000)
    )
  );
}

export function formatUsd(
  value: number
) {
  return value.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits:
        value >= 100 ? 0 : 2,
      maximumFractionDigits: 2,
    }
  );
}

