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

function hashSeed(value: string) {
  let hash = 0;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash =
      (hash * 31 +
        value.charCodeAt(index)) >>>
      0;
  }

  return hash;
}

function defaultRows(
  totalPieces: number
) {
  return Math.round(
    Math.sqrt(totalPieces)
  );
}

function defaultColumns(
  totalPieces: number,
  rows: number
) {
  return Math.max(
    1,
    Math.round(
      totalPieces /
        Math.max(1, rows)
    )
  );
}

function getPieceCandidates(
  slug: string,
  totalPieces: number,
  rows: number,
  columns: number
) {
  const centerRow =
    (rows - 1) / 2;
  const centerColumn =
    (columns - 1) / 2;
  const maxDistance =
    Math.hypot(
      centerRow,
      centerColumn
    ) || 1;
  const seed = hashSeed(slug);

  return Array.from(
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
          column === columns - 1);
      const isEdge =
        row === 0 ||
        row === rows - 1 ||
        column === 0 ||
        column === columns - 1;
      const distance =
        Math.hypot(
          row - centerRow,
          column - centerColumn
        );
      const centerWeight =
        1 -
        distance / maxDistance;
      const rowBand =
        row < centerRow
          ? "top"
          : row > centerRow
            ? "bottom"
            : "middle";
      const columnBand =
        column < centerColumn
          ? "left"
          : column > centerColumn
            ? "right"
            : "center";
      const seededNoise =
        ((hashSeed(
          `${slug}:${pieceIndex}:${seed}`
        ) %
          1000) /
          1000) *
        0.8;

      return {
        pieceIndex,
        row,
        column,
        zone: `${rowBand}-${columnBand}`,
        score:
          1 +
          centerWeight * 10 +
          (isEdge ? -1.4 : 2.2) +
          (isCorner ? -2.6 : 0) +
          seededNoise,
      }
    }
  )
    .filter(
      (candidate) =>
        candidate.score > 0
    )
    .sort(
      (a, b) => b.score - a.score
    );
}

export function pickMissingPieceIndex(
  slug: string,
  totalPieces: number,
  rows = defaultRows(totalPieces),
  columns = defaultColumns(
    totalPieces,
    rows
  )
) {
  const candidates =
    getPieceCandidates(
      slug,
      totalPieces,
      rows,
      columns
    );

  const totalWeight =
    candidates.reduce(
      (sum, candidate) =>
        sum + candidate.score,
      0
    );

  let cursor =
    (hashSeed(slug) / 0xffffffff) *
    totalWeight;

  for (const candidate of candidates) {
    cursor -= candidate.score;

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
  rows = defaultRows(totalPieces),
  columns = defaultColumns(
    totalPieces,
    rows
  )
) {
  const wantedCount =
    Math.min(
      totalPieces,
      normalizeMarketPieceCount(count)
    );
  const candidates =
    getPieceCandidates(
      slug,
      totalPieces,
      rows,
      columns
    );
  const indexes: typeof candidates = [];
  const usedZones =
    new Set<string>();
  const minimumDistance =
    wantedCount <= 1
      ? 0
      : Math.max(
          1.4,
          Math.min(rows, columns) /
            (wantedCount + 1)
        );

  const canUseCandidate = (
    candidate: (typeof candidates)[number],
    enforceZone: boolean,
    enforceDistance: boolean
  ) => {
    if (
      enforceZone &&
      usedZones.has(candidate.zone)
    ) {
      return false;
    }

    if (!enforceDistance) {
      return true;
    }

    return indexes.every((chosen) => {
      const distance = Math.hypot(
        chosen.row - candidate.row,
        chosen.column - candidate.column
      );

      return (
        distance >= minimumDistance
      );
    });
  };

  while (
    indexes.length < wantedCount &&
    candidates.length > 0
  ) {
    const chosen =
      candidates.find((candidate) =>
        canUseCandidate(
          candidate,
          true,
          true
        )
      ) ||
      candidates.find((candidate) =>
        canUseCandidate(
          candidate,
          false,
          true
        )
      ) ||
      candidates.find((candidate) =>
        canUseCandidate(
          candidate,
          false,
          false
        )
      );

    if (!chosen) {
      break;
    }

    indexes.push(chosen);
    usedZones.add(chosen.zone);
    candidates.splice(
      candidates.indexOf(chosen),
      1
    );
  }

  for (
    let pieceIndex = 0;
    indexes.length < wantedCount &&
    pieceIndex < totalPieces;
    pieceIndex += 1
  ) {
    if (
      indexes.every(
        (item) =>
          item.pieceIndex !== pieceIndex
      )
    ) {
      indexes.push({
        pieceIndex,
        row: Math.floor(
          pieceIndex / columns
        ),
        column:
          pieceIndex % columns,
        zone: "fallback",
        score: 0,
      });
    }
  }

  return indexes.map(
    (item) => item.pieceIndex
  );
}
