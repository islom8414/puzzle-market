import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const admin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function deleteStoragePrefix(
  prefix
) {
  const { data: files, error } =
    await admin.storage
      .from("fragments")
      .list(prefix, {
        limit: 1000,
      });

  if (error) {
    throw new Error(
      `Storage list failed (${prefix}): ${error.message}`
    );
  }

  if (!files?.length) {
    return 0;
  }

  const paths =
    files
      .filter(
        (file) =>
          file.name &&
          !file.name.startsWith(".")
      )
      .map(
        (file) =>
          `${prefix}/${file.name}`
      );

  if (!paths.length) {
    return 0;
  }

  const { error: removeError } =
    await admin.storage
      .from("fragments")
      .remove(paths);

  if (removeError) {
    throw new Error(
      `Storage delete failed: ${removeError.message}`
    );
  }

  return paths.length;
}

async function clearTable(
  table,
  column = "id"
) {
  const { error } =
    await admin
      .from(table)
      .delete()
      .neq(
        column,
        "00000000-0000-0000-0000-000000000000"
      );

  if (error) {
    throw new Error(
      `${table}: ${error.message}`
    );
  }

  console.log(`Cleared ${table}`);
}

async function main() {
  console.log(
    "Cleaning test puzzles, listings, and uploaded images..."
  );

  const deletedPuzzles =
    await deleteStoragePrefix(
      "puzzles"
    );

  console.log(
    `Removed ${deletedPuzzles} file(s) from fragments/puzzles/`
  );

  await clearTable("piece_trades");
  await clearTable("piece_listings");
  await clearTable(
    "piece_ownership",
    "piece_id"
  );
  await clearTable("puzzle_pieces");
  await clearTable("puzzle_catalog");
  await clearTable("wallet_ledger_entries");

  const { error: walletError } =
    await admin
      .from("wallet_accounts")
      .update({
        balance_cents: 0,
      })
      .gte("balance_cents", 0);

  if (walletError) {
    throw new Error(
      `wallet_accounts: ${walletError.message}`
    );
  }

  console.log(
    "Reset wallet balances to $0"
  );

  for (const table of [
    "support_messages",
    "support_threads",
    "chat",
  ]) {
    const { error } =
      await admin
        .from(table)
        .delete()
        .neq(
          "id",
          "00000000-0000-0000-0000-000000000000"
        );

    if (!error) {
      console.log(`Cleared ${table}`);
    }
  }

  console.log(
    "Done. Auth users and market_profiles were kept."
  );
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
