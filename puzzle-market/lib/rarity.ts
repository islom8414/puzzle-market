export type PuzzleRarity =
  | "Rare"
  | "Epic"
  | "Legendary";

export const RARITY_OPTIONS: {
  value: PuzzleRarity;
  label: string;
  minPrice: number;
  maxPrice: number | null;
  hint: string;
}[] = [
  {
    value: "Rare",
    label: "Rare",
    minPrice: 1,
    maxPrice: 10,
    hint: "$1 – $10",
  },
  {
    value: "Epic",
    label: "Epic",
    minPrice: 10,
    maxPrice: 100,
    hint: "$10 – $100",
  },
  {
    value: "Legendary",
    label: "Legendary",
    minPrice: 100,
    maxPrice: null,
    hint: "$100+",
  },
];

export function normalizeRarity(
  value: string | null | undefined
): PuzzleRarity | null {
  const normalized =
    value?.trim() || "";

  if (
    normalized === "Rare" ||
    normalized === "Epic" ||
    normalized === "Legendary"
  ) {
    return normalized;
  }

  return null;
}

export function validateRarityPrice(
  rarity: PuzzleRarity,
  priceUsd: number
) {
  const tier = RARITY_OPTIONS.find(
    (item) => item.value === rarity
  );

  if (!tier) {
    return "Invalid rarity";
  }

  if (
    !Number.isFinite(priceUsd) ||
    priceUsd <= 0
  ) {
    return "Enter a valid price";
  }

  if (priceUsd < tier.minPrice) {
    return `${rarity} price must be at least $${tier.minPrice}`;
  }

  if (
    tier.maxPrice !== null &&
    priceUsd > tier.maxPrice
  ) {
    return `${rarity} price must be $${tier.maxPrice} or less`;
  }

  return null;
}

export function pickMissingPieceIndex(
  slug: string,
  totalPieces: number
) {
  let hash = 0;

  for (
    let index = 0;
    index < slug.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        slug.charCodeAt(index)) %
      totalPieces;
  }

  return hash;
}
