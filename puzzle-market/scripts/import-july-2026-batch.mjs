import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const ROOT = "C:/Users/hp/Desktop/картинки";
const ROWS = 4;
const COLUMNS = 4;
const TOTAL_PIECES = ROWS * COLUMNS;
const BUCKET = "fragments";
const STORAGE_DIR = "puzzles/imports-20260703";
const DRY_RUN = process.argv.includes("--dry-run");

const explicitFiles = [
  "8d797896-1531-4a3b-b18a-4027442d33ce.jpg",
  "23de6a36-c631-4fb8-a1ba-d018d9930bc8.jpg",
  "050fe46d-01bb-4601-b50b-ecd12fb218a3.jpg",
  "43e4f3eb-1f56-4907-81c5-295443ad7f46.jpg",
  "63c6dc59-f141-45af-8dc7-e720badf6b4f.jpg",
  "915cf470-3066-4e24-9315-f31b47724542.jpg",
  "947cea9b-96b8-481e-8dda-97d15594fe83.jpg",
  "988c1a59-d819-4bb8-ace6-2cd7bd588aa3.jpg",
  "2701fad4-63cb-4e7a-8f2a-29920b32a86a.jpg",
  "a78390af-3ba1-4698-8200-328fe2da05b0.jpg",
  "83700dd5-fda8-4b85-bf47-5228eb1684e6.jpg",
  "af2c7616-b8b8-4e9b-821c-c0144a1ec1af.jpg",
  "b6b4acf4-fec3-4c54-b643-41bbc077ea19.jpg",
  "bbf3eef5-f5ea-437c-a81c-0fcf6159aa8f.jpg",
  "c0ba4a2f-ddae-4335-8aee-eb9c0908a49b.jpg",
  "b1b985cf-ab65-4597-aebd-b4484432f97e.jpg",
  "c21a99fb-9e20-4342-84cc-f9deeb4ba3b5.jpg",
  "f4cac2f4-9b8a-4b2c-96fb-bae6637bd03b.jpg",
  "photo_2026-06-29_22-58-07.jpg",
  "0c5ef7e9-10f4-4935-8046-d25013ee0c3b.jpg",
  "0d99b407-7d8d-45ac-abca-3f5469a917ed.jpg",
  "3f321315-8fc6-4089-b25f-554f29447602.jpg",
  "6d07c6d6-c0a7-4445-ba5a-9b4e80218ffc.jpg",
];

const exactMetadata = {
  "8d797896-1531-4a3b-b18a-4027442d33ce.jpg": ["Village Basket Bicycle", "Travel & Landmarks", 5],
  "23de6a36-c631-4fb8-a1ba-d018d9930bc8.jpg": ["Exchange House Manager", "Other", 6],
  "050fe46d-01bb-4601-b50b-ecd12fb218a3.jpg": ["London Classic Motorbike", "Cars", 7],
  "43e4f3eb-1f56-4907-81c5-295443ad7f46.jpg": ["Fuji Commuter Bike", "Travel & Landmarks", 6],
  "63c6dc59-f141-45af-8dc7-e720badf6b4f.jpg": ["Tokyo Night Motorbikes", "Cars", 8],
  "915cf470-3066-4e24-9315-f31b47724542.jpg": ["Coastal Red Sport Motorbike", "Cars", 9],
  "947cea9b-96b8-481e-8dda-97d15594fe83.jpg": ["Carnival Juggler Smile", "Toys", 5],
  "988c1a59-d819-4bb8-ace6-2cd7bd588aa3.jpg": ["Painter Color Tree", "Art", 4],
  "2701fad4-63cb-4e7a-8f2a-29920b32a86a.jpg": ["Northern Kitchen Chef", "Food & Drink", 6],
  "a78390af-3ba1-4698-8200-328fe2da05b0.jpg": ["Pyramid Plaza Bicycle", "Travel & Landmarks", 6],
  "83700dd5-fda8-4b85-bf47-5228eb1684e6.jpg": ["Vineyard Touring Bike", "Travel & Landmarks", 7],
  "af2c7616-b8b8-4e9b-821c-c0144a1ec1af.jpg": ["Moonlit Pine Ink Garden", "Art", 6],
  "b6b4acf4-fec3-4c54-b643-41bbc077ea19.jpg": ["Paris Evening Motorbike", "Cars", 8],
  "bbf3eef5-f5ea-437c-a81c-0fcf6159aa8f.jpg": ["Quiet Studio Still Life", "Art", 3],
  "c0ba4a2f-ddae-4335-8aee-eb9c0908a49b.jpg": ["Seoul Foldable Cargo Bike", "Travel & Landmarks", 6],
  "b1b985cf-ab65-4597-aebd-b4484432f97e.jpg": ["Metropolitan Cargo Bicycle", "Travel & Landmarks", 6],
  "c21a99fb-9e20-4342-84cc-f9deeb4ba3b5.jpg": ["Autumn Truck Driver", "Other", 4],
  "f4cac2f4-9b8a-4b2c-96fb-bae6637bd03b.jpg": ["Modern Tram Bike Point", "Travel & Landmarks", 6],
  "photo_2026-06-29_22-58-07.jpg": ["Santorini Sunset Harbor", "Travel & Landmarks", 9],
  "0c5ef7e9-10f4-4935-8046-d25013ee0c3b.jpg": ["Canal Studio Painting", "Art", 5],
  "0d99b407-7d8d-45ac-abca-3f5469a917ed.jpg": ["Coastal Trail Touring Bike", "Travel & Landmarks", 7],
  "3f321315-8fc6-4089-b25f-554f29447602.jpg": ["Colosseum Touring Bicycle", "Travel & Landmarks", 8],
  "6d07c6d6-c0a7-4445-ba5a-9b4e80218ffc.jpg": ["Old Town Master Barber", "Other", 5],
};

const ordinalMetadata = [
  ["Palace Dance Celebration", "Art", 8],
  ["Blue Arena Football Shirt", "Football", 6],
  ["Sunset Fairway Putt", "Golf", 6],
  ["Derby Match Sprint", "Football", 7],
  ["Window Coffee Archive", "Food & Drink", 4],
  ["Lakeside Golf Swing", "Golf", 6],
  ["Island Terrace Espresso", "Food & Drink", 5],
  ["Bunker Sand Shot", "Golf", 6],
  ["Blue Bridge Football Shirt", "Football", 6],
  ["Tea Room Garden Vase", "Flowers", 5],
  ["Crimson Stadium Shirt", "Football", 6],
  ["Studio Coffee Sketch", "Food & Drink", 4],
  ["Yellow Arena Football Shirt", "Football", 6],
  ["Red Stripe Football Shirt", "Football", 6],
  ["Rose Garden Bouquet", "Flowers", 7],
  ["Cafe Latte Hands", "Food & Drink", 4],
  ["Golden Hour Golf Blast", "Golf", 7],
  ["Library Flower Notes", "Flowers", 7],
  ["Red Arena Football Shirt", "Football", 6],
  ["Ocean Matcha Window", "Food & Drink", 5],
  ["Striped Stadium Shirt", "Football", 6],
  ["Vintage Football Boots", "Football", 5],
  ["Blue Stadium Football Shirt", "Football", 6],
  ["Red Classic Football Shirt", "Football", 6],
  ["Tea Ceremony Set", "Food & Drink", 5],
  ["White Stadium Football Shirt", "Football", 6],
  ["Tatami Tea Table", "Food & Drink", 5],
  ["Street Sport Motorbike", "Cars", 8],
  ["Garden Tea Set", "Food & Drink", 5],
  ["Half Blue Stadium Shirt", "Football", 6],
  ["Blue Street Motorbike", "Cars", 8],
  ["Purple Stadium Football Shirt", "Football", 6],
  ["Red Carpet Film Star", "Other", 7],
  ["Navy Paris Football Shirt", "Football", 6],
  ["Yellow Camp Stadium Shirt", "Football", 6],
  ["White Paris Football Shirt", "Football", 6],
  ["Orange Stadium Goalkeeper Shirt", "Football", 6],
  ["Stone Garden Tea Set", "Food & Drink", 5],
  ["Window Travel Coffee", "Food & Drink", 5],
  ["Red Stadium Football Shirt", "Football", 6],
  ["White Galaxy Football Shirt", "Football", 6],
  ["Blue Retro Stadium Shirt", "Football", 6],
  ["Pastel Garden Bouquet", "Flowers", 7],
  ["Mountain Cabin Coffee", "Food & Drink", 5],
  ["Sky Blue Stadium Shirt", "Football", 6],
  ["Red Blue Stadium Shirt", "Football", 6],
  ["Match Ball Boots", "Football", 5],
  ["Yellow Arena Club Shirt", "Football", 6],
  ["Tea Room Guests", "Food & Drink", 5],
  ["Cliffside Coffee View", "Food & Drink", 6],
  ["Seaside Tea Cup", "Food & Drink", 5],
  ["Turquoise Balcony Tea", "Food & Drink", 5],
  ["Garden Incense Tea", "Food & Drink", 5],
  ["White Classic Stadium Shirt", "Football", 6],
  ["Garden Ikebana Vase", "Flowers", 7],
  ["Library Rose Arrangement", "Flowers", 7],
  ["Green Stadium Football Shirt", "Football", 6],
  ["Night City Motorbike", "Cars", 8],
  ["Black Stadium Shirt", "Football", 6],
  ["Fireplace Flower Room", "Flowers", 7],
  ["White Stadium Crest Shirt", "Football", 6],
  ["Neon Yellow Stadium Shirt", "Football", 6],
  ["Night Football Clash", "Football", 7],
  ["Library Floral Still Life", "Flowers", 7],
  ["White Bridge Football Shirt", "Football", 6],
  ["Festive Palace Dancer", "Art", 8],
  ["White Madrid Stadium Shirt", "Football", 6],
  ["Orbit Postage Stamp", "Space", 4],
];

const titlePools = {
  library: ["Walnut Library Wall", "Collector Book Nook", "Map Room Shelves", "Antique Reading Corner"],
  radio: ["Vintage Table Radio", "Bakelite Evening Radio"],
  baseball: ["Home Plate Dive", "Green Diamond Swing", "Pitcher Dust Cloud", "Catcher Tag Moment"],
  gaming: ["Night Boss Battle", "Desert Firefight", "Five Star Highway", "Neon Kart Sprint", "Castle Cat Run", "Ancient Jump Quest", "Cavern Block Run", "Void Island Quest"],
  golf: ["Cliffside Golf Chip", "Ocean Green Putt", "Sand Save Moment"],
  space: ["Planetary Museum Rover", "Red Canyon Explorer", "Mars Canyon Dawn", "Bronze Red Planet", "Golden Cloud Planet", "Blue Ring Giant", "Storm Ring World", "Ice Ring Planet", "Lunar Rover Trail", "Orbital Repair Walk", "Earth Moon Reflection"],
  bees: ["Cherry Blossom Bee", "Lavender Honey Bee", "Golden Pollen Macro", "Garden Hive Morning"],
  city: ["Skyline Evening Roads", "Old Canal Lane", "Stone Alley Twilight", "Lantern Stair Street", "Traditional Town Night", "Tokyo Overpass Glow"],
  garden: ["Autumn Bridge Garden", "Lotus Pagoda Garden", "Mist Pavilion Pond", "Willow Courtyard Garden"],
  landscape: ["Mountain Sunrise Valley", "Volcanic Harbor Sunset", "Snow Lake Village", "Sailing Cove Sunset", "Greek Island Dusk", "Alpine Canal Sunset", "Emerald Rice Terraces", "Cliff Temple Sunrise"],
  art: ["Window Still Life", "Velvet Library Portrait", "Mountain Lake View", "Cottage Family Painting", "Cubist City Study", "Mechanical Abstract Eye", "Color Mask Abstract", "Autumn Ink Bridge", "Moon Pine Temple", "Starry Pine Temple", "Market Canvas Scene"],
  bike: ["Patagonia Gravel Bike", "Westminster Commuter Bike", "Capital Cargo Bicycle", "Shibuya Red Motorbike"],
};

function loadEnvFile(filePath = ".env.local") {
  return fs
    .readFile(filePath, "utf8")
    .then((contents) => {
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
          continue;
        }

        const [name, ...valueParts] = trimmed.split("=");
        if (!process.env[name]) {
          process.env[name] = valueParts.join("=").replace(/^["']|["']$/g, "");
        }
      }
    })
    .catch(() => {});
}

function hashBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function hashText(value) {
  return parseInt(hashBuffer(Buffer.from(value)).slice(0, 8), 16);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

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
      (row === 0 || row === ROWS - 1) && (column === 0 || column === COLUMNS - 1);
    const isEdge = row === 0 || row === ROWS - 1 || column === 0 || column === COLUMNS - 1;
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

function chooseFrom(poolName, fileName) {
  const pool = titlePools[poolName];
  return pool[hashText(fileName) % pool.length];
}

function metadataForFile(fileName, ordinal) {
  const exact = exactMetadata[fileName];
  if (exact) {
    const [title, category, price] = exact;
    return { title, category, price };
  }

  const byOrdinal = ordinalMetadata[ordinal];
  if (byOrdinal) {
    const [title, category, price] = byOrdinal;
    return { title, category, price };
  }

  if (/18-14-/.test(fileName)) return { title: chooseFrom("library", fileName), category: "Other", price: 4 };
  if (/18-16-3|18-16-4[02]/.test(fileName)) return { title: chooseFrom("radio", fileName), category: "Music", price: 4 };
  if (/18-16-4[9]|18-16-5/.test(fileName)) return { title: chooseFrom("baseball", fileName), category: "Baseball", price: 6 };
  if (/18-17-|18-18-0|18-18-1|18-18-2[03]/.test(fileName)) return { title: chooseFrom("gaming", fileName), category: "Gaming", price: 7 };
  if (/18-18-2[69]|18-18-3[25]/.test(fileName)) return { title: chooseFrom("golf", fileName), category: "Golf", price: 6 };
  if (/18-18-35|18-18-4|18-18-5|18-19-0|18-19-1[148]/.test(fileName)) return { title: chooseFrom("space", fileName), category: "Space", price: 8 };
  if (/18-19-2|18-19-3|18-19-4|18-19-5|18-20-00/.test(fileName)) return { title: chooseFrom("space", fileName), category: "Space", price: 8 };
  if (/18-20-0[37]|18-20-1[036]|18-20-20/.test(fileName)) return { title: chooseFrom("bees", fileName), category: "Animals", price: 5 };
  if (/18-20-2|18-20-3|18-20-4|18-20-5|18-21-0|18-21-10/.test(fileName)) return { title: chooseFrom("city", fileName), category: "Travel & Landmarks", price: 7 };
  if (/18-21-1[37]|18-21-2|18-21-31/.test(fileName)) return { title: chooseFrom("garden", fileName), category: "Nature", price: 7 };
  if (/18-21-3[479]|18-21-4|18-21-5|18-22-0|18-22-1[18]|18-22-22/.test(fileName)) return { title: chooseFrom("landscape", fileName), category: "Travel & Landmarks", price: 9 };
  if (/18-22-15|18-22-19|18-22-2[258]|18-22-3[14]|18-22-4|18-23-47/.test(fileName)) return { title: chooseFrom("art", fileName), category: "Art", price: 6 };
  if (/18-25-59|18-27-|18-28-45/.test(fileName)) return { title: chooseFrom("bike", fileName), category: "Travel & Landmarks", price: 7 };

  return { title: `Collector Image ${hashText(fileName) % 10000}`, category: "Other", price: 5 };
}

function missingCountFor(fileName) {
  return 1 + (hashText(fileName) % 3);
}

function uniqueValue(base, usedValues, formatSuffix = (suffix) => ` ${suffix}`) {
  const suffixes = ["II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  let candidate = base;
  let index = 0;

  while (usedValues.has(candidate.toLowerCase())) {
    candidate = `${base}${formatSuffix(suffixes[index] || `#${index + 2}`)}`;
    index += 1;
  }

  usedValues.add(candidate.toLowerCase());
  return candidate;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function collectFiles() {
  const allNames = await fs.readdir(ROOT);
  const requested = new Set(allNames.filter((name) => /\.jpe?g$/i.test(name)));

  for (const name of explicitFiles) {
    if (allNames.includes(name)) {
      requested.add(name);
    }
  }

  return [...requested].sort();
}

async function fetchExistingCatalog(admin) {
  const titles = new Set();
  const slugs = new Set();
  const imageUrls = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await admin
      .from("puzzle_catalog")
      .select("title,slug,image_url")
      .range(from, from + step - 1);

    if (error) {
      throw new Error(error.message);
    }

    for (const puzzle of data || []) {
      if (puzzle.title) titles.add(puzzle.title.toLowerCase());
      if (puzzle.slug) slugs.add(puzzle.slug.toLowerCase());
      if (puzzle.image_url) imageUrls.push({ title: puzzle.title, imageUrl: puzzle.image_url });
    }

    if (!data || data.length < step) {
      break;
    }

    from += step;
  }

  return { titles, slugs, imageUrls };
}

async function fetchExistingImageHashes(admin) {
  const { imageUrls } = await fetchExistingCatalog(admin);
  const hashes = new Map();

  for (const item of imageUrls) {
    try {
      const response = await fetch(item.imageUrl);
      if (!response.ok) {
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      hashes.set(hashBuffer(buffer), item.title || item.imageUrl);
    } catch {
      // Older or private image URLs should not block the import.
    }
  }

  return hashes;
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
        missing_piece_index: missingPieceIndexes[0],
        rarity,
        brand_name: null,
        brand_country_code: null,
        category: item.category,
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
    shape_seed: parseInt(hashBuffer(Buffer.from(`${item.slug}:${index}`)).slice(0, 8), 16) % 1000000,
    is_market_piece: missingPieceSet.has(index),
  }));

  const { data: insertedPieces, error: piecesError } = await admin
    .from("puzzle_pieces")
    .upsert(pieces, { onConflict: "puzzle_id,piece_index" })
    .select("id,piece_index,is_market_piece");

  if (piecesError || !insertedPieces) {
    throw new Error(`${item.title}: ${piecesError?.message || "pieces failed"}`);
  }

  const marketPieces = insertedPieces.filter((piece) => missingPieceSet.has(piece.piece_index));
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
    category: item.category,
    price: item.price,
    rarity,
    missingPieceIndexes,
  };
}

async function buildItems(admin) {
  const files = await collectFiles();
  const { titles, slugs } = await fetchExistingCatalog(admin);

  return files.map((fileName, index) => {
    const metadata = metadataForFile(fileName, index);
    const baseSlug = slugify(metadata.title);
    const alreadyExists =
      titles.has(metadata.title.toLowerCase()) || slugs.has(baseSlug.toLowerCase());
    const title = alreadyExists ? metadata.title : uniqueValue(metadata.title, titles);
    const slug = alreadyExists
      ? baseSlug
      : uniqueValue(baseSlug, slugs, (suffix) => `-${suffix.toLowerCase().replaceAll(" ", "-")}`);

    return {
      ...metadata,
      alreadyExists,
      fileName,
      title,
      slug,
      marketPieces: missingCountFor(fileName),
      source: path.join(ROOT, fileName).replaceAll("\\", "/"),
    };
  });
}

async function main() {
  await loadEnvFile();

  const admin = createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const owner = DRY_RUN ? { id: "dry-run", username: "dry-run" } : await getOwnerProfile(admin);
  const items = await buildItems(admin);
  const existingImageHashes = await fetchExistingImageHashes(admin);
  const seenHashes = new Map();
  const imported = [];
  const skipped = [];

  for (const item of items) {
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

    if (item.alreadyExists) {
      skipped.push({ title: item.title, reason: "existing-title-or-slug", fileName: item.fileName });
      console.log(`Skipped existing catalog item: ${item.title}`);
      continue;
    }

    if (existingImageHashes.has(hash)) {
      const duplicateOf = existingImageHashes.get(hash);
      skipped.push({ title: item.title, duplicateOf, reason: "existing-image", fileName: item.fileName });
      console.log(`Skipped existing image: ${item.title} matches ${duplicateOf}`);
      continue;
    }

    if (seenHashes.has(hash)) {
      const duplicateOf = seenHashes.get(hash);
      skipped.push({ title: item.title, duplicateOf, reason: "batch-duplicate", fileName: item.fileName });
      console.log(`Skipped duplicate: ${item.title} matches ${duplicateOf}`);
      continue;
    }

    seenHashes.set(hash, item.title);

    if (DRY_RUN) {
      imported.push({
        title: item.title,
        category: item.category,
        price: item.price,
        missingPieceCount: item.marketPieces,
        fileName: item.fileName,
        hash,
      });
      continue;
    }

    const imageUrl = await uploadImage(admin, item, buffer);
    const result = await ensurePuzzle(admin, owner, item, imageUrl);
    imported.push(result);
    result.fileName = item.fileName;
    result.hash = hash;
    console.log(
      `Imported ${result.title} - $${result.price} (${result.category}, ${result.missingPieceIndexes.length} pieces)`
    );
  }

  const summary = {
    imported,
    skipped,
    importedCount: imported.length,
    skippedCount: skipped.length,
    owner: owner.username,
  };

  const outputPath = path.join("scripts", "last-july-2026-import.json");
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`Done. Imported ${imported.length}; skipped duplicates ${skipped.length}. Owner: ${owner.username}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
