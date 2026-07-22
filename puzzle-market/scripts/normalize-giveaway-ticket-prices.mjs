import { createClient } from "@supabase/supabase-js";

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

function normalizeTicketPriceCents(priceCents) {
  if (!Number.isFinite(priceCents) || priceCents <= 0) {
    return priceCents;
  }

  if (priceCents <= 100) {
    return 100;
  }

  const dollars = priceCents / 100;
  const roundedDollars = Math.max(7, Math.floor((dollars + 4) / 7) * 7);
  return roundedDollars * 100;
}

function formatUsd(cents) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

async function getActiveListings() {
  const rows = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await admin
      .from("piece_listings")
      .select("id,piece_id,price_cents,status")
      .eq("status", "active")
      .order("price_cents", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    rows.push(...(data || []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return rows;
}

async function main() {
  const listings = await getActiveListings();
  const changes = listings
    .map((listing) => ({
      ...listing,
      next_price_cents: normalizeTicketPriceCents(listing.price_cents),
    }))
    .filter((listing) => listing.next_price_cents !== listing.price_cents);

  const distribution = new Map();
  for (const listing of listings) {
    const normalized = normalizeTicketPriceCents(listing.price_cents);
    distribution.set(normalized, (distribution.get(normalized) || 0) + 1);
  }

  console.log(`Active listings: ${listings.length}`);
  console.log(`Prices to update: ${changes.length}`);
  console.log(
    [...distribution.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([cents, count]) => `${formatUsd(cents)}: ${count}`)
      .join(", ")
  );

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to update Supabase.");
    for (const change of changes.slice(0, 25)) {
      console.log(
        `${change.id}: ${formatUsd(change.price_cents)} -> ${formatUsd(
          change.next_price_cents
        )}`
      );
    }
    return;
  }

  for (const change of changes) {
    const { error } = await admin
      .from("piece_listings")
      .update({ price_cents: change.next_price_cents })
      .eq("id", change.id);

    if (error) {
      throw new Error(`${change.id}: ${error.message}`);
    }

    const { error: historyError } = await admin.rpc(
      "record_piece_listing_price",
      {
        p_listing_id: change.id,
        p_reason: "manual_update",
      }
    );

    if (historyError) {
      console.warn(
        `price history skipped for ${change.id}: ${historyError.message}`
      );
    }
  }

  console.log(`Updated ${changes.length} active listings.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
