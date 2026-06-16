import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(
  request: Request
) {
  try {
    const cronSecret =
      process.env.CRON_SECRET ||
      process.env.PRICE_INDEX_CRON_SECRET;

    if (cronSecret) {
      const expected =
        `Bearer ${cronSecret}`;
      const received =
        request.headers.get(
          "authorization"
        );

      if (received !== expected) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const admin =
      createSupabaseAdmin();

    const { data, error } =
      await admin.rpc(
        "index_piece_listing_prices"
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      indexedListings:
        Number(data || 0),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Price index failed",
      },
      { status: 500 }
    );
  }
}
