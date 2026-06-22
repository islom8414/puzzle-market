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
    marketPieces: 3,
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
  {
    title: "Prairie Run",
    slug: "prairie-run",
    price: 8,
    marketPieces: 2,
    category: "Animals",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-bb5b77ed-1e55-4df2-ade1-ae39a9afc47e.png",
  },
  {
    title: "Crane Flight",
    slug: "crane-flight",
    price: 7,
    marketPieces: 1,
    category: "Animals",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-0c5845b5-cc0f-4713-a247-b5ce4f469077.png",
  },
  {
    title: "Stork Meadow",
    slug: "stork-meadow",
    price: 6,
    marketPieces: 1,
    category: "Animals",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-131d30ac-c947-4b48-a4f3-bec0c9cea316.png",
  },
  {
    title: "Eagle Valley",
    slug: "eagle-valley",
    price: 13,
    marketPieces: 2,
    category: "Animals",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-cba3ee6e-f7f1-4d37-97dd-cfa619782d9a.png",
  },
  {
    title: "Eagle Landing",
    slug: "eagle-landing",
    price: 12,
    marketPieces: 2,
    category: "Animals",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-b59f20f6-70a0-4e5e-839b-07fae81253ce.png",
  },
  {
    title: "Forest Owl",
    slug: "forest-owl",
    price: 9,
    marketPieces: 1,
    category: "Animals",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-8492a18e-6992-4db5-8bea-e969b7826190.png",
  },
  {
    title: "Snow Owl",
    slug: "snow-owl",
    price: 10,
    marketPieces: 2,
    category: "Animals",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-b60c3435-bac4-48a4-9e6d-8123e58181dd.png",
  },
  {
    title: "Coastal Sedan",
    slug: "coastal-sedan",
    price: 14,
    marketPieces: 2,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-5b5f297c-66a0-4137-9c50-f2a4596ad910.png",
  },
  {
    title: "Sunset Drive",
    slug: "sunset-drive",
    price: 9,
    marketPieces: 1,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-ba7cbfa5-761a-4362-881d-ee2431950b23.png",
  },
  {
    title: "Black Cruiser",
    slug: "black-cruiser",
    price: 11,
    marketPieces: 2,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-d1f78a5f-1a28-4584-ae57-4a778fbef473.png",
  },
  {
    title: "Harbor Luxury",
    slug: "harbor-luxury",
    price: 12,
    marketPieces: 2,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-14638f7c-b85c-4207-a999-f62308b59346.png",
  },
  {
    title: "Coast Rider",
    slug: "coast-rider",
    price: 8,
    marketPieces: 1,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-0350cb3a-bc56-403e-bbfe-26097786a20d.png",
  },
  {
    title: "Road Wagon",
    slug: "road-wagon",
    price: 9,
    marketPieces: 1,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-3a1dc4e3-5a55-47be-bc9a-21fab28f0c33.png",
  },
  {
    title: "Green Trail",
    slug: "green-trail",
    price: 7,
    marketPieces: 1,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-21e75a59-eee9-446f-b38c-1960814afca1.png",
  },
  {
    title: "Classic Ride",
    slug: "classic-ride",
    price: 8,
    marketPieces: 1,
    category: "Cars",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-9df00c74-8f6b-4cf8-a8b9-3ee0b1ee0c41.png",
  },
  {
    title: "Station Rush",
    slug: "station-rush",
    price: 6,
    marketPieces: 1,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-4b26f7bc-218b-4458-9315-5e0f9bf876b2.png",
  },
  {
    title: "Terminal Classic",
    slug: "terminal-classic",
    price: 10,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-bbf3406f-c704-444f-a47c-e9b28b58bfcd.png",
  },
  {
    title: "Karst River",
    slug: "karst-river",
    price: 11,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-59c046b9-74ae-4261-a7c8-34346d9fde85.png",
  },
  {
    title: "Fuji Blossom",
    slug: "fuji-blossom",
    price: 12,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-2e95e7ee-39bd-4731-95c9-d434a39c5b53.png",
  },
  {
    title: "Autumn Temple",
    slug: "autumn-temple",
    price: 10,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-acaacc30-6792-41ce-9597-87ef973233c6.png",
  },
  {
    title: "Desert Monuments",
    slug: "desert-monuments",
    price: 13,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-f69c314a-011a-4caa-a969-f837651b2a44.png",
  },
  {
    title: "Fjord Dusk",
    slug: "fjord-dusk",
    price: 10,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-26957b07-f540-4b2d-b740-018de7385d3b.png",
  },
  {
    title: "Nordic Cabin",
    slug: "nordic-cabin",
    price: 9,
    marketPieces: 1,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-0c5c5fe5-601a-4a83-8354-82dc4203c6d4.png",
  },
  {
    title: "Coastal Garden",
    slug: "coastal-garden",
    price: 10,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-73569aa4-72d5-405b-a6f6-1be8820cc5d0.png",
  },
  {
    title: "Cliff Village",
    slug: "cliff-village",
    price: 9,
    marketPieces: 1,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-d3ff27b0-cc8f-48a3-8e0b-c12646282376.png",
  },
  {
    title: "Taiga River",
    slug: "taiga-river",
    price: 8,
    marketPieces: 1,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-2dbccfd7-1a0a-4d1c-b678-5e4ea13a2bfb.png",
  },
  {
    title: "Emerald Lake",
    slug: "emerald-lake",
    price: 12,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-971a09d0-964e-4a93-91d8-4cd4aeb6d9fd.png",
  },
  {
    title: "Village Fields",
    slug: "village-fields",
    price: 6,
    marketPieces: 1,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-06432767-fc20-4039-96ed-72d489c09e12.png",
  },
  {
    title: "Misty Valley",
    slug: "misty-valley",
    price: 10,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-37384806-0f79-4f4d-91b7-3e93c5d99a4c.png",
  },
  {
    title: "Sunflower Hills",
    slug: "sunflower-hills",
    price: 7,
    marketPieces: 1,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-1c88ed52-c556-42f5-9268-77fe382d14ff.png",
  },
  {
    title: "Nomad Valley",
    slug: "nomad-valley",
    price: 9,
    marketPieces: 1,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-ad4b84cd-1ae5-418f-b3cd-73ac07d4743e.png",
  },
  {
    title: "Oasis Dunes",
    slug: "oasis-dunes",
    price: 12,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-8f6dcda9-a260-444f-9e1f-3b565e15972d.png",
  },
  {
    title: "Blue Cliffs",
    slug: "blue-cliffs",
    price: 10,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-a625d4f1-40e3-4239-8652-ccd816426193.png",
  },
  {
    title: "Savanna Sunset",
    slug: "savanna-sunset",
    price: 13,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-1058e301-0a91-48a5-a4cd-686111be35a9.png",
  },
  {
    title: "Ocean Peak",
    slug: "ocean-peak",
    price: 11,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-a38576ee-bdc5-42e9-862a-12d81e3a615d.png",
  },
  {
    title: "Cactus Canyon",
    slug: "cactus-canyon",
    price: 9,
    marketPieces: 1,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-b85286bc-ec87-46fc-888f-a4a496aba7df.png",
  },
  {
    title: "Alpine Coast",
    slug: "alpine-coast",
    price: 10,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-bfdcc7eb-0e7c-459b-ad0f-86a59bd595e1.png",
  },
  {
    title: "Steppe River",
    slug: "steppe-river",
    price: 9,
    marketPieces: 1,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-c817d93f-9fbd-4dbc-9ab1-1deb97ddeecc.png",
  },
  {
    title: "Silk Road Valley",
    slug: "silk-road-valley",
    price: 8,
    marketPieces: 1,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-dc9c4618-f67c-457d-91eb-9dfce1df2306.png",
  },
  {
    title: "Highland Trail",
    slug: "highland-trail",
    price: 11,
    marketPieces: 2,
    category: "Nature",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-1f38d188-bc24-4b19-814f-64044a9ded8f.png",
  },
  {
    title: "Rice Terrace Bay",
    slug: "rice-terrace-bay",
    price: 12,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-f539debf-4264-4361-b11f-a40e99da513b.png",
  },
  {
    title: "Green Bay Fields",
    slug: "green-bay-fields",
    price: 13,
    marketPieces: 2,
    category: "Travel & Landmarks",
    source:
      "C:/Users/hp/AppData/Local/Temp/codex-clipboard-105d4b83-1cb9-402b-8542-08503f467eda.png",
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
        category: item.category || CATEGORY,
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
