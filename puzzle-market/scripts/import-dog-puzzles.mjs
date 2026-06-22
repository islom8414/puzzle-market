import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ROWS = 4;
const COLUMNS = 4;
const TOTAL_PIECES = ROWS * COLUMNS;
const CATEGORY = "Animals";
const BUCKET = "fragments";
const STORAGE_DIR = "puzzles/animals";

const items = [
  {
    title: "Garden Pack",
    slug: "garden-pack",
    price: 8,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-0c280bb2-5e6b-42bb-b89a-21b627a229a6.png",
  },
  {
    title: "Shibuya Guardian",
    slug: "shibuya-guardian",
    price: 18,
    marketPieces: 3,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-7646a494-1185-445b-ab53-0bea33358f47.png",
  },
  {
    title: "Poodle Path",
    slug: "poodle-path",
    price: 7,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-e605b73d-0d1f-4bea-8d05-ac52d60c561e.png",
  },
  {
    title: "Frenchie Garden",
    slug: "frenchie-garden",
    price: 6,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-7b99fb0d-0e53-432f-909d-6fa94c881bea.png",
  },
  {
    title: "Pug Patrol",
    slug: "pug-patrol",
    price: 5,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-2b2a40d7-069a-405a-b9bd-97b2b328e660.png",
  },
  {
    title: "Chihuahua Walk",
    slug: "chihuahua-walk",
    price: 4,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-1ed266ee-9dff-45cf-ac22-30bf68ea112c.png",
  },
  {
    title: "Shepherd Bloom",
    slug: "shepherd-bloom",
    price: 9,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-cfc79cca-2409-4bff-9309-64815f25d88f.png",
  },
  {
    title: "Rottweiler Gate",
    slug: "rottweiler-gate",
    price: 9,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-28d5e44d-73a8-4cea-97db-eda38a9f0840.png",
  },
  {
    title: "Doberman Path",
    slug: "doberman-path",
    price: 8,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-af32d9b3-6ce9-4a11-b5bf-01c9acfc4d08.png",
  },
  {
    title: "Golden Lake",
    slug: "golden-lake",
    price: 16,
    marketPieces: 3,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-e3434f3c-dd87-4ae3-956d-60579481d40c.png",
  },
  {
    title: "Beagle Shore",
    slug: "beagle-shore",
    price: 7,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-233e3870-0bce-44b3-bfa0-654f554c3416.png",
  },
  {
    title: "Pointer Lake",
    slug: "pointer-lake",
    price: 8,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-dc059926-9bc7-47dd-bbf8-ac55d2347a7c.png",
  },
  {
    title: "Afghan Lake",
    slug: "afghan-lake",
    price: 14,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-ddfc3981-3066-42b7-acc4-1a4928b36c62.png",
  },
  {
    title: "Mountain Pups",
    slug: "mountain-pups",
    price: 6,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-a722dc60-8b23-4070-82ab-546d8a2a6fc1.png",
  },
  {
    title: "Village Puppies",
    slug: "village-puppies",
    price: 5,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-f96f346e-3b5f-4d0e-98c2-9f3c0bf661e6.png",
  },
  {
    title: "Alpine Husky",
    slug: "alpine-husky",
    price: 9,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-4dc219c8-b832-41c5-ab62-ac8b34868606.png",
  },
  {
    title: "Husky Pups",
    slug: "husky-pups",
    price: 8,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-1c9c574b-4b32-4484-a17c-f7abc8d9ac7d.png",
  },
  {
    title: "Shiba Meadow",
    slug: "shiba-meadow",
    price: 7,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-98cfc65e-72d7-48af-afad-2e159ec271a8.png",
  },
  {
    title: "Tatami Puppies",
    slug: "tatami-puppies",
    price: 6,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-d1917026-fa5d-4907-9f27-83039c984a90.png",
  },
  {
    title: "Garden Saint",
    slug: "garden-saint",
    price: 10,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-eb12db35-ed1c-498f-bcf6-8c037a38ffa6.png",
  },
  {
    title: "Cozy Fold",
    slug: "cozy-fold",
    price: 5,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-8342d135-94ea-433d-9d96-0822492b7408.png",
  },
  {
    title: "Siamese Chair",
    slug: "siamese-chair",
    price: 7,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-5fadda01-db56-4ab5-83ef-058db8a7975f.png",
  },
  {
    title: "Bengal Nap",
    slug: "bengal-nap",
    price: 7,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-e92bb53e-6b18-4d1b-9a86-3525885a7aa4.png",
  },
  {
    title: "Sphynx Rest",
    slug: "sphynx-rest",
    price: 8,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-dceb0b81-eba5-4943-8da0-79c76441e67f.png",
  },
  {
    title: "Kitten Nest",
    slug: "kitten-nest",
    price: 6,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-d7c23e68-582f-4a80-9308-ee411ed752e0.png",
  },
  {
    title: "Kyoto Kittens",
    slug: "kyoto-kittens",
    price: 9,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-8d276185-b043-4c8e-af41-6635e2b46ddb.png",
  },
  {
    title: "Library Cats",
    slug: "library-cats",
    price: 12,
    marketPieces: 3,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-61c191b1-41e4-4f90-afb1-5cf43d89b6a1.png",
  },
  {
    title: "Garden Bengal",
    slug: "garden-bengal",
    price: 8,
    marketPieces: 1,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-716dfac3-5bdf-40ee-8bc4-f49766549a54.png",
  },
  {
    title: "Snow Cabin Cat",
    slug: "snow-cabin-cat",
    price: 11,
    marketPieces: 2,
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-f931ce86-fb41-4e2d-9242-51c0a5995c6e.png",
  },
];

function pickMissingPieceIndex(slug) {
  let hash = 0;

  for (let index = 0; index < slug.length; index += 1) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }

  const centerRow = (ROWS - 1) / 2;
  const centerColumn = (COLUMNS - 1) / 2;
  const maxDistance = Math.hypot(centerRow, centerColumn) || 1;
  const candidates = Array.from({ length: TOTAL_PIECES }, (_, pieceIndex) => {
    const row = Math.floor(pieceIndex / COLUMNS);
    const column = pieceIndex % COLUMNS;
    const isCorner =
      (row === 0 || row === ROWS - 1) &&
      (column === 0 || column === COLUMNS - 1);
    const isEdge =
      row === 0 || row === ROWS - 1 || column === 0 || column === COLUMNS - 1;
    const distance = Math.hypot(row - centerRow, column - centerColumn);
    const centerWeight = 1 - distance / maxDistance;

    return {
      pieceIndex,
      weight: 1 + centerWeight * 8 + (isEdge ? -0.8 : 1.5) + (isCorner ? -1.5 : 0),
    };
  }).filter((candidate) => candidate.weight > 0);

  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let cursor = (hash / 0xffffffff) * totalWeight;

  for (const candidate of candidates) {
    cursor -= candidate.weight;

    if (cursor <= 0) {
      return candidate.pieceIndex;
    }
  }

  return candidates.at(-1)?.pieceIndex || 0;
}

function pickMissingPieceIndexes(slug, count) {
  const wantedCount = Math.max(1, Math.min(3, Math.floor(Number(count) || 1)));
  const indexes = [pickMissingPieceIndex(slug)];
  let salt = 0;

  while (indexes.length < wantedCount && salt < TOTAL_PIECES * 4) {
    const nextIndex = pickMissingPieceIndex(`${slug}:${salt}`);

    if (!indexes.includes(nextIndex)) {
      indexes.push(nextIndex);
    }

    salt += 1;
  }

  for (let index = 0; indexes.length < wantedCount && index < TOTAL_PIECES; index += 1) {
    if (!indexes.includes(index)) {
      indexes.push(index);
    }
  }

  return indexes;
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

async function getOwnerProfile(admin) {
  const requestedEmail = process.env.IMPORT_OWNER_EMAIL?.trim().toLowerCase();

  if (requestedEmail) {
    const { data, error } = await admin
      .from("market_profiles")
      .select("id,email,username")
      .ilike("email", requestedEmail)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Owner profile not found for ${requestedEmail}`);
    }

    return data;
  }

  const { data: users, error } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    throw new Error(error.message);
  }

  const adminUser = users.users.find((user) => {
    const metadata = user.app_metadata || {};
    return metadata.role === "admin" || metadata.platform_owner === true;
  });

  if (!adminUser?.id) {
    throw new Error("No admin user found. Set IMPORT_OWNER_EMAIL and rerun.");
  }

  const { data: profile, error: profileError } = await admin
    .from("market_profiles")
    .select("id,email,username")
    .eq("id", adminUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Admin profile not found in market_profiles.");
  }

  return profile;
}

async function uploadImage(admin, item, buffer) {
  const storagePath = `${STORAGE_DIR}/${item.slug}.jpg`;
  const upload = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
    cacheControl: "31536000",
    contentType: "image/jpeg",
    upsert: true,
  });

  if (upload.error) {
    throw new Error(`${item.title}: ${upload.error.message}`);
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function ensurePuzzle(admin, owner, item, imageUrl) {
  const missingPieceIndexes = pickMissingPieceIndexes(item.slug, item.marketPieces);
  const missingPieceIndex = missingPieceIndexes[0];
  const missingPieceSet = new Set(missingPieceIndexes);
  const priceCents = Math.round(item.price * 100);
  const rarity = item.price <= 10 ? "Rare" : "Epic";

  const { data: puzzle, error: puzzleError } = await admin
    .from("puzzle_catalog")
    .upsert(
      {
        slug: item.slug,
        title: item.title,
        image_url: imageUrl,
        rows: ROWS,
        columns: COLUMNS,
        missing_piece_count: missingPieceIndexes.length,
        missing_piece_index: missingPieceIndex,
        rarity,
        brand_name: null,
        brand_country_code: null,
        category: CATEGORY,
      },
      { onConflict: "slug" }
    )
    .select("id,slug,title")
    .single();

  if (puzzleError || !puzzle) {
    throw new Error(`${item.title}: ${puzzleError?.message || "catalog failed"}`);
  }

  const pieces = Array.from({ length: TOTAL_PIECES }, (_, index) => ({
    puzzle_id: puzzle.id,
    piece_index: index,
    shape_seed:
      parseInt(hashBuffer(Buffer.from(`${item.slug}:${index}`)).slice(0, 8), 16) %
      1000000,
    is_market_piece: missingPieceSet.has(index),
  }));

  const { data: insertedPieces, error: piecesError } = await admin
    .from("puzzle_pieces")
    .upsert(pieces, { onConflict: "puzzle_id,piece_index" })
    .select("id,piece_index,is_market_piece");

  if (piecesError || !insertedPieces) {
    throw new Error(`${item.title}: ${piecesError?.message || "pieces failed"}`);
  }

  const marketPieces = insertedPieces.filter((piece) =>
    missingPieceSet.has(piece.piece_index)
  );

  if (marketPieces.length !== missingPieceIndexes.length) {
    throw new Error(`${item.title}: market pieces not found`);
  }

  for (const marketPiece of marketPieces) {
    const { error: ownershipError } = await admin.from("piece_ownership").upsert(
      {
        piece_id: marketPiece.id,
        owner_user_id: owner.id,
      },
      { onConflict: "piece_id" }
    );

    if (ownershipError) {
      throw new Error(`${item.title}: ${ownershipError.message}`);
    }

    await admin
      .from("piece_listings")
      .update({ status: "cancelled" })
      .eq("piece_id", marketPiece.id)
      .eq("status", "active")
      .neq("seller_user_id", owner.id);

    const { data: existingListing } = await admin
      .from("piece_listings")
      .select("id")
      .eq("piece_id", marketPiece.id)
      .eq("seller_user_id", owner.id)
      .eq("status", "active")
      .maybeSingle();

    let listingId = existingListing?.id;

    if (listingId) {
      const { error: updateError } = await admin
        .from("piece_listings")
        .update({ price_cents: priceCents })
        .eq("id", listingId);

      if (updateError) {
        throw new Error(`${item.title}: ${updateError.message}`);
      }
    } else {
      const { data: newListing, error: listingError } = await admin
        .from("piece_listings")
        .insert({
          piece_id: marketPiece.id,
          seller_user_id: owner.id,
          price_cents: priceCents,
          status: "active",
        })
        .select("id")
        .single();

      if (listingError || !newListing) {
        throw new Error(`${item.title}: ${listingError?.message || "listing failed"}`);
      }

      listingId = newListing.id;
    }

    if (listingId) {
      await admin.rpc("record_piece_listing_price", {
        p_listing_id: listingId,
        p_reason: "import",
      });
    }
  }

  return {
    title: item.title,
    slug: item.slug,
    price: item.price,
    rarity,
    missingPieceIndexes,
  };
}

async function main() {
  const supabaseUrl = await requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = await requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const owner = await getOwnerProfile(admin);
  const seenHashes = new Map();
  const imported = [];

  for (const item of items) {
    await fs.access(item.source);

    const buffer = await sharp(item.source)
      .rotate()
      .resize(1280, 720, {
        fit: "cover",
        position: "attention",
      })
      .jpeg({
        quality: 88,
        mozjpeg: true,
      })
      .toBuffer();
    const hash = hashBuffer(buffer);

    if (seenHashes.has(hash)) {
      console.log(`Skipped duplicate: ${item.title} matches ${seenHashes.get(hash)}`);
      continue;
    }

    seenHashes.set(hash, item.title);

    const imageUrl = await uploadImage(admin, item, buffer);
    const result = await ensurePuzzle(admin, owner, item, imageUrl);
    imported.push(result);
    console.log(
      `Imported ${result.title} - $${result.price} (${result.rarity}, ${result.missingPieceIndexes.length} pieces)`
    );
  }

  const outputPath = path.join("scripts", "last-dog-puzzle-import.json");
  await fs.writeFile(outputPath, `${JSON.stringify(imported, null, 2)}\n`);
  console.log(`Done. Imported ${imported.length} puzzle(s). Owner: ${owner.username}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
