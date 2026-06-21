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
  totalPieces: number,
  rows = Math.round(
    Math.sqrt(totalPieces)
  ),
  columns = Math.max(
    1,
    Math.round(
      totalPieces /
        Math.max(1, rows)
    )
  )
) {
  let hash = 0;

  for (
    let index = 0;
    index < slug.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        slug.charCodeAt(index)) >>>
      0;
  }

  const centerRow =
    (rows - 1) / 2;
  const centerColumn =
    (columns - 1) / 2;
  const maxDistance =
    Math.hypot(
      centerRow,
      centerColumn
    ) || 1;

  const candidates =
    Array.from(
      { length: totalPieces },
      (_, pieceIndex) => {
        const row = Math.floor(
          pieceIndex / columns
        );
        const column =
          pieceIndex % columns;
        const isCorner =
          (row === 0 ||
            row === rows - 1) &&
          (column === 0 ||
            column ===
              columns - 1);
        const isEdge =
          row === 0 ||
          row === rows - 1 ||
          column === 0 ||
          column ===
            columns - 1;
        const distance =
          Math.hypot(
            row - centerRow,
            column - centerColumn
          );
        const centerWeight =
          1 -
          distance /
            maxDistance;

        return {
          pieceIndex,
          weight:
            1 +
            centerWeight * 8 +
            (isEdge ? -0.8 : 1.5) +
            (isCorner ? -1.5 : 0),
        };
      }
    ).filter(
      (candidate) =>
        candidate.weight > 0
    );

  const totalWeight =
    candidates.reduce(
      (sum, candidate) =>
        sum + candidate.weight,
      0
    );

  let cursor =
    (hash / 0xffffffff) *
    totalWeight;

  for (const candidate of candidates) {
    cursor -= candidate.weight;

    if (cursor <= 0) {
      return candidate.pieceIndex;
    }
  }

  return (
    candidates.at(-1)?.pieceIndex || 0
  );
}

export function normalizeMarketPieceCount(
  value: unknown
) {
  const count = Number(value);

  if (!Number.isFinite(count)) {
    return 1;
  }

  return Math.max(
    1,
    Math.min(3, Math.floor(count))
  );
}

export function pickMissingPieceIndexes(
  slug: string,
  totalPieces: number,
  count: number,
  rows = Math.round(
    Math.sqrt(totalPieces)
  ),
  columns = Math.max(
    1,
    Math.round(
      totalPieces /
        Math.max(1, rows)
    )
  )
) {
  const wantedCount =
    Math.min(
      totalPieces,
      normalizeMarketPieceCount(count)
    );
  const indexes: number[] = [];
  let salt = 0;

  while (
    indexes.length < wantedCount &&
    salt < totalPieces * 4
  ) {
    const pieceIndex =
      pickMissingPieceIndex(
        `${slug}:${salt}`,
        totalPieces,
        rows,
        columns
      );

    if (
      !indexes.includes(pieceIndex)
    ) {
      indexes.push(pieceIndex);
    }

    salt += 1;
  }

  for (
    let pieceIndex = 0;
    indexes.length < wantedCount &&
    pieceIndex < totalPieces;
    pieceIndex += 1
  ) {
    if (
      !indexes.includes(pieceIndex)
    ) {
      indexes.push(pieceIndex);
    }
  }

  return indexes;
}
