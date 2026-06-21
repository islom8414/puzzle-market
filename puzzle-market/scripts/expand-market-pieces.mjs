import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

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

function hashNumber(value) {
  const hex = crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")
    .slice(0, 8);

  return parseInt(hex, 16);
}

function pickIndexes(slug, total, count) {
  const indexes = [];
  let salt = 0;

  while (indexes.length < count && salt < total * 4) {
    const index = hashNumber(`${slug}:${salt}`) % total;

    if (!indexes.includes(index)) {
      indexes.push(index);
    }

    salt += 1;
  }

  return indexes;
}

function desiredCount(puzzle, priceCents, currentCount) {
  const price = Math.max(1, Math.round(Number(priceCents || 100) / 100));
  const roll = hashNumber(`${puzzle.slug}:${puzzle.category || ""}`) % 10;

  let count = 1;

  if (price <= 10) {
    count = roll < 6 ? 1 : roll < 9 ? 2 : 3;
  } else if (price <= 50) {
    count = roll < 5 ? 2 : 3;
  } else {
    count = roll < 3 ? 2 : 3;
  }

  return Math.min(3, Math.max(currentCount, count));
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

async function main() {
  const [puzzles, pieces, listings, ownerships] = await Promise.all([
    getRows(
      "puzzle_catalog",
      "id,slug,title,rows,columns,category,missing_piece_count,missing_piece_index"
    ),
    getRows("puzzle_pieces", "id,puzzle_id,piece_index,is_market_piece"),
    getRows(
      "piece_listings",
      "id,piece_id,seller_user_id,price_cents,status"
    ),
    getRows("piece_ownership", "piece_id,owner_user_id"),
  ]);

  const piecesByPuzzle = new Map();
  const pieceByPuzzleIndex = new Map();
  const activeListingsByPiece = new Map();
  const ownershipByPiece = new Map();

  for (const piece of pieces) {
    const list = piecesByPuzzle.get(piece.puzzle_id) || [];
    list.push(piece);
    piecesByPuzzle.set(piece.puzzle_id, list);
    pieceByPuzzleIndex.set(`${piece.puzzle_id}:${piece.piece_index}`, piece);
  }

  for (const listing of listings) {
    if (listing.status === "active") {
      activeListingsByPiece.set(listing.piece_id, listing);
    }
  }

  for (const ownership of ownerships) {
    ownershipByPiece.set(ownership.piece_id, ownership.owner_user_id);
  }

  const results = [];

  for (const puzzle of puzzles) {
    const total = Number(puzzle.rows || 4) * Number(puzzle.columns || 4);
    const puzzlePieces = piecesByPuzzle.get(puzzle.id) || [];
    const marketPieces = puzzlePieces
      .filter((piece) => piece.is_market_piece)
      .sort((a, b) => a.piece_index - b.piece_index);

    const activeMarketListings = marketPieces
      .map((piece) => ({
        piece,
        listing: activeListingsByPiece.get(piece.id),
      }))
      .filter((row) => row.listing);

    if (activeMarketListings.length === 0) {
      results.push({
        title: puzzle.title,
        status: "skipped-no-active-listing",
      });
      continue;
    }

    const template = activeMarketListings[0];
    const wanted = desiredCount(
      puzzle,
      template.listing.price_cents,
      activeMarketListings.length
    );

    if (activeMarketListings.length > wanted) {
      const sortedActive = [...activeMarketListings].sort(
        (a, b) => a.piece.piece_index - b.piece.piece_index
      );
      const keep = sortedActive.slice(0, wanted);
      const remove = sortedActive.slice(wanted);

      for (const row of remove) {
        await admin
          .from("piece_listings")
          .update({ status: "cancelled" })
          .eq("id", row.listing.id);

        await admin
          .from("puzzle_pieces")
          .update({ is_market_piece: false })
          .eq("id", row.piece.id);
      }

      await admin
        .from("puzzle_catalog")
        .update({
          missing_piece_count: keep.length,
          missing_piece_index: keep[0]?.piece.piece_index ?? null,
        })
        .eq("id", puzzle.id);

      results.push({
        title: puzzle.title,
        category: puzzle.category,
        status: "trimmed",
        before: activeMarketListings.length,
        after: keep.length,
        removed: remove.map((row) => row.piece.piece_index),
      });
      continue;
    }

    if (activeMarketListings.length >= wanted) {
      const firstMarket = activeMarketListings[0]?.piece;
      await admin
        .from("puzzle_catalog")
        .update({
          missing_piece_count: activeMarketListings.length,
          missing_piece_index: firstMarket?.piece_index ?? null,
        })
        .eq("id", puzzle.id);

      results.push({
        title: puzzle.title,
        status: "already-ok",
        count: marketPieces.length,
      });
      continue;
    }

    const selected = [
      ...activeMarketListings.map((row) => row.piece.piece_index),
      ...pickIndexes(puzzle.slug, total, wanted),
    ].filter((index, position, list) => list.indexOf(index) === position)
      .slice(0, wanted);
    const existingMarketIndexes = new Set(
      activeMarketListings.map((row) => row.piece.piece_index)
    );

    const added = [];

    for (const pieceIndex of selected) {
      if (existingMarketIndexes.has(pieceIndex)) {
        continue;
      }

      const existing =
        pieceByPuzzleIndex.get(`${puzzle.id}:${pieceIndex}`) || null;

      if (existing && ownershipByPiece.has(existing.id)) {
        continue;
      }

      const { data: piece, error: pieceError } = await admin
        .from("puzzle_pieces")
        .upsert(
          {
            puzzle_id: puzzle.id,
            piece_index: pieceIndex,
            shape_seed: hashNumber(`${puzzle.slug}:${pieceIndex}`) % 1000000,
            is_market_piece: true,
          },
          { onConflict: "puzzle_id,piece_index" }
        )
        .select("id,piece_index")
        .single();

      if (pieceError || !piece) {
        throw new Error(
          `${puzzle.title}: ${pieceError?.message || "piece failed"}`
        );
      }

      const { error: ownershipError } = await admin
        .from("piece_ownership")
        .insert({
          piece_id: piece.id,
          owner_user_id: template.listing.seller_user_id,
        });

      if (ownershipError) {
        throw new Error(`${puzzle.title}: ${ownershipError.message}`);
      }

      const { data: listing, error: listingError } = await admin
        .from("piece_listings")
        .insert({
          piece_id: piece.id,
          seller_user_id: template.listing.seller_user_id,
          price_cents: template.listing.price_cents,
          status: "active",
        })
        .select("id")
        .single();

      if (listingError || !listing) {
        throw new Error(
          `${puzzle.title}: ${listingError?.message || "listing failed"}`
        );
      }

      await admin.rpc("record_piece_listing_price", {
        p_listing_id: listing.id,
        p_reason: "expand-market-pieces",
      });

      added.push(pieceIndex);
      existingMarketIndexes.add(pieceIndex);
    }

    const nextMarketIndexes = [
      ...new Set([
        ...activeMarketListings.map((row) => row.piece.piece_index),
        ...added,
      ]),
    ].sort((a, b) => a - b);

    await admin
      .from("puzzle_catalog")
      .update({
        missing_piece_count: Math.min(3, nextMarketIndexes.length),
        missing_piece_index: nextMarketIndexes[0] ?? null,
      })
      .eq("id", puzzle.id);

    results.push({
      title: puzzle.title,
      category: puzzle.category,
      status: "expanded",
      before: activeMarketListings.length,
      after: nextMarketIndexes.length,
      added,
    });
  }

  const expanded = results.filter((row) => row.status === "expanded");
  const trimmed = results.filter((row) => row.status === "trimmed");
  const summary = {
    totalPuzzles: results.length,
    expanded: expanded.length,
    trimmed: trimmed.length,
    skipped: results.filter((row) => row.status.startsWith("skipped")).length,
    alreadyOk: results.filter((row) => row.status === "already-ok").length,
  };

  console.log(JSON.stringify({ summary, expanded, trimmed }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
