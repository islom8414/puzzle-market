import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const apply = process.argv.includes("--apply");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required."
  );
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

function cleanName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isPlatformOwnerName(value) {
  return [
    "admin",
    "puzzle market",
    "puzzle market vault",
    "puzzlemarket",
  ].includes(cleanName(value));
}

function hashSeed(value) {
  return parseInt(
    crypto
      .createHash("sha256")
      .update(String(value))
      .digest("hex")
      .slice(0, 8),
    16
  );
}

function pieceCandidates(slug, totalPieces, rows, columns) {
  const centerRow = (rows - 1) / 2;
  const centerColumn = (columns - 1) / 2;
  const maxDistance =
    Math.hypot(centerRow, centerColumn) || 1;
  const seed = hashSeed(slug);

  return Array.from({ length: totalPieces }, (_, pieceIndex) => {
    const row = Math.floor(pieceIndex / columns);
    const column = pieceIndex % columns;
    const isCorner =
      (row === 0 || row === rows - 1) &&
      (column === 0 || column === columns - 1);
    const isEdge =
      row === 0 ||
      row === rows - 1 ||
      column === 0 ||
      column === columns - 1;
    const distance = Math.hypot(
      row - centerRow,
      column - centerColumn
    );
    const centerWeight = 1 - distance / maxDistance;
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
    const noise =
      ((hashSeed(`${slug}:${pieceIndex}:${seed}`) % 1000) /
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
        noise,
    };
  })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);
}

function chooseDistinctiveIndexes({
  slug,
  totalPieces,
  rows,
  columns,
  count,
  blockedIndexes,
}) {
  const candidates = pieceCandidates(
    slug,
    totalPieces,
    rows,
    columns
  ).filter(
    (candidate) => !blockedIndexes.has(candidate.pieceIndex)
  );
  const chosen = [];
  const usedZones = new Set();
  const minimumDistance =
    count <= 1
      ? 0
      : Math.max(1.4, Math.min(rows, columns) / (count + 1));

  const canUse = (candidate, enforceZone, enforceDistance) => {
    if (enforceZone && usedZones.has(candidate.zone)) {
      return false;
    }

    if (!enforceDistance) {
      return true;
    }

    return chosen.every(
      (item) =>
        Math.hypot(
          item.row - candidate.row,
          item.column - candidate.column
        ) >= minimumDistance
    );
  };

  while (chosen.length < count && candidates.length > 0) {
    const next =
      candidates.find((item) => canUse(item, true, true)) ||
      candidates.find((item) => canUse(item, false, true)) ||
      candidates.find((item) => canUse(item, false, false));

    if (!next) {
      break;
    }

    chosen.push(next);
    usedZones.add(next.zone);
    candidates.splice(candidates.indexOf(next), 1);
  }

  return chosen.map((item) => item.pieceIndex);
}

async function getRows(table, select) {
  const rows = [];
  let from = 0;
  const pageSize = 1000;

  for (;;) {
    const { data, error } = await admin
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }

    rows.push(...(data || []));

    if (!data || data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return rows;
}

async function recordListing(listingId, reason) {
  const { error } = await admin.rpc(
    "record_piece_listing_price",
    {
      p_listing_id: listingId,
      p_reason: reason,
    }
  );

  if (error) {
    console.warn(
      `price history skipped for ${listingId}: ${error.message}`
    );
  }
}

async function main() {
  const [puzzles, pieces, listings, ownerships, trades, profiles] =
    await Promise.all([
      getRows(
        "puzzle_catalog",
        "id,slug,title,rows,columns,missing_piece_count,missing_piece_index"
      ),
      getRows(
        "puzzle_pieces",
        "id,puzzle_id,piece_index,is_market_piece,shape_seed"
      ),
      getRows(
        "piece_listings",
        "id,piece_id,seller_user_id,price_cents,status"
      ),
      getRows("piece_ownership", "piece_id,owner_user_id"),
      getRows("piece_trades", "piece_id"),
      getRows("market_profiles", "id,username"),
    ]);

  const profileById = new Map(
    profiles.map((profile) => [profile.id, profile])
  );
  const piecesByPuzzle = new Map();
  const pieceByPuzzleIndex = new Map();
  const ownershipByPiece = new Map(
    ownerships.map((ownership) => [
      ownership.piece_id,
      ownership.owner_user_id,
    ])
  );
  const tradedPieceIds = new Set(
    trades.map((trade) => trade.piece_id)
  );

  for (const piece of pieces) {
    const list = piecesByPuzzle.get(piece.puzzle_id) || [];
    list.push(piece);
    piecesByPuzzle.set(piece.puzzle_id, list);
    pieceByPuzzleIndex.set(
      `${piece.puzzle_id}:${piece.piece_index}`,
      piece
    );
  }

  const activeListings = listings.filter(
    (listing) => listing.status === "active"
  );
  const listingByPiece = new Map(
    activeListings.map((listing) => [listing.piece_id, listing])
  );
  const plans = [];

  for (const puzzle of puzzles) {
    const puzzlePieces = piecesByPuzzle.get(puzzle.id) || [];
    const primaryListings = puzzlePieces
      .map((piece) => ({
        piece,
        listing: listingByPiece.get(piece.id),
      }))
      .filter(({ piece, listing }) => {
        if (!listing || tradedPieceIds.has(piece.id)) {
          return false;
        }

        const profile = profileById.get(listing.seller_user_id);
        const ownerId = ownershipByPiece.get(piece.id);

        return (
          ownerId === listing.seller_user_id &&
          isPlatformOwnerName(profile?.username)
        );
      })
      .sort((a, b) => a.piece.piece_index - b.piece.piece_index);

    if (primaryListings.length === 0) {
      continue;
    }

    const rows = Number(puzzle.rows || 4);
    const columns = Number(puzzle.columns || 4);
    const totalPieces = rows * columns;
    const count = Math.min(3, primaryListings.length);
    const sellerId = primaryListings[0].listing.seller_user_id;
    const priceCents = primaryListings[0].listing.price_cents;

    const blockedIndexes = new Set();

    for (const piece of puzzlePieces) {
      const listing = listingByPiece.get(piece.id);
      const ownerId = ownershipByPiece.get(piece.id);

      if (
        tradedPieceIds.has(piece.id) ||
        (ownerId && ownerId !== sellerId) ||
        (listing && listing.seller_user_id !== sellerId)
      ) {
        blockedIndexes.add(piece.piece_index);
      }
    }

    const nextIndexes = chooseDistinctiveIndexes({
      slug: puzzle.slug,
      totalPieces,
      rows,
      columns,
      count,
      blockedIndexes,
    }).sort((a, b) => a - b);

    if (nextIndexes.length === 0) {
      continue;
    }

    const currentIndexes = primaryListings
      .slice(0, count)
      .map((row) => row.piece.piece_index)
      .sort((a, b) => a - b);

    if (currentIndexes.join(",") === nextIndexes.join(",")) {
      continue;
    }

    plans.push({
      puzzle,
      rows,
      columns,
      sellerId,
      priceCents,
      currentIndexes,
      nextIndexes,
      primaryListings,
    });
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    puzzlesToRefresh: plans.length,
    firstChanges: plans.slice(0, 20).map((plan) => ({
      title: plan.puzzle.title,
      from: plan.currentIndexes,
      to: plan.nextIndexes,
    })),
  };

  console.log(JSON.stringify(summary, null, 2));

  if (!apply) {
    return;
  }

  for (const plan of plans) {
    const keepIndexes = new Set(plan.nextIndexes);

    for (const { piece, listing } of plan.primaryListings) {
      if (keepIndexes.has(piece.piece_index)) {
        continue;
      }

      await admin
        .from("piece_listings")
        .update({ status: "cancelled" })
        .eq("id", listing.id);

      if (!tradedPieceIds.has(piece.id)) {
        await admin
          .from("puzzle_pieces")
          .update({ is_market_piece: false })
          .eq("id", piece.id);
      }
    }

    for (const pieceIndex of plan.nextIndexes) {
      let piece =
        pieceByPuzzleIndex.get(`${plan.puzzle.id}:${pieceIndex}`) ||
        null;

      if (!piece) {
        const { data, error } = await admin
          .from("puzzle_pieces")
          .insert({
            puzzle_id: plan.puzzle.id,
            piece_index: pieceIndex,
            shape_seed: hashSeed(`${plan.puzzle.slug}:${pieceIndex}`),
            is_market_piece: true,
          })
          .select("id,puzzle_id,piece_index")
          .single();

        if (error || !data) {
          throw new Error(
            `${plan.puzzle.title}: ${error?.message || "piece insert failed"}`
          );
        }

        piece = data;
        pieceByPuzzleIndex.set(
          `${plan.puzzle.id}:${pieceIndex}`,
          piece
        );
      } else {
        await admin
          .from("puzzle_pieces")
          .update({ is_market_piece: true })
          .eq("id", piece.id);
      }

      const ownerId = ownershipByPiece.get(piece.id);

      if (!ownerId) {
        await admin.from("piece_ownership").insert({
          piece_id: piece.id,
          owner_user_id: plan.sellerId,
        });
        ownershipByPiece.set(piece.id, plan.sellerId);
      } else if (ownerId !== plan.sellerId) {
        continue;
      }

      const existingListing = listingByPiece.get(piece.id);

      if (existingListing) {
        await admin
          .from("piece_listings")
          .update({
            price_cents: plan.priceCents,
            status: "active",
          })
          .eq("id", existingListing.id);
        continue;
      }

      const { data: listing, error } = await admin
        .from("piece_listings")
        .insert({
          piece_id: piece.id,
          seller_user_id: plan.sellerId,
          price_cents: plan.priceCents,
          status: "active",
        })
        .select("id")
        .single();

      if (error || !listing) {
        throw new Error(
          `${plan.puzzle.title}: ${error?.message || "listing insert failed"}`
        );
      }

      await recordListing(
        listing.id,
        "manual_update"
      );
    }

    await admin
      .from("puzzle_catalog")
      .update({
        missing_piece_count: plan.nextIndexes.length,
        missing_piece_index: plan.nextIndexes[0] ?? null,
      })
      .eq("id", plan.puzzle.id);
  }

  console.log(
    JSON.stringify(
      {
        refreshed: plans.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
