import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/market-access";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

async function deleteStoragePrefix(
  admin: ReturnType<
    typeof createSupabaseAdmin
  >,
  prefix: string
) {
  const { data: files, error } =
    await admin.storage
      .from("fragments")
      .list(prefix, {
        limit: 1000,
      });

  if (error) {
    throw new Error(
      `Storage list failed: ${error.message}`
    );
  }

  const paths =
    (files || [])
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

export async function POST(
  request: Request
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Login required" },
        { status: 401 }
      );
    }

    const admin =
      createSupabaseAdmin();

    const {
      data: userData,
      error: userError,
    } =
      await admin.auth.getUser(
        token
      );

    if (
      userError ||
      !userData.user ||
      !isAdminEmail(
        userData.user.email
      )
    ) {
      return NextResponse.json(
        { error: "Admin only" },
        { status: 403 }
      );
    }

    const deletedFiles =
      await deleteStoragePrefix(
        admin,
        "puzzles"
      );

    const tableDeletes: Array<{
      table: string;
      column?: string;
    }> = [
      { table: "piece_trades" },
      { table: "piece_listings" },
      {
        table: "piece_ownership",
        column: "piece_id",
      },
      { table: "puzzle_pieces" },
      { table: "puzzle_catalog" },
      {
        table: "wallet_ledger_entries",
      },
    ];

    for (const item of tableDeletes) {
      const { error } =
        await admin
          .from(item.table)
          .delete()
          .neq(
            item.column || "id",
            "00000000-0000-0000-0000-000000000000"
          );

      if (error) {
        return NextResponse.json(
          {
            error: `${item.table}: ${error.message}`,
          },
          { status: 500 }
        );
      }
    }

    await admin
      .from("wallet_accounts")
      .update({
        balance_cents: 0,
      })
      .gte("balance_cents", 0);

    for (const table of [
      "support_messages",
      "support_threads",
      "chat",
    ]) {
      await admin
        .from(table)
        .delete()
        .neq(
          "id",
          "00000000-0000-0000-0000-000000000000"
        );
    }

    return NextResponse.json({
      ok: true,
      deletedFiles,
      message:
        "Test puzzles and images removed. Users and profiles kept.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Cleanup failed",
      },
      { status: 500 }
    );
  }
}
