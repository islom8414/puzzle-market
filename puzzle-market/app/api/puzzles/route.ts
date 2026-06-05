import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { fallbackPuzzles } from "@/lib/fallback-puzzles";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin =
      createSupabaseAdmin();

    const { data, error } =
      await admin
        .from("puzzle_catalog")
        .select(
          "id,slug,title,image_url,rows,columns,missing_piece_count,missing_piece_index,rarity,created_at"
        )
        .order("created_at", {
          ascending: false,
        });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      puzzles:
        data && data.length > 0
          ? data
          : fallbackPuzzles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load puzzles",
      },
      { status: 500 }
    );
  }
}
