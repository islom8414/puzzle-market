import { NextResponse } from "next/server";

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { fallbackPuzzles } from "@/lib/fallback-puzzles";

export const runtime = "nodejs";

export async function GET() {
  try {
    const admin =
      createSupabaseAdmin();

    let { data, error } =
      await admin
        .from("puzzle_catalog")
        .select(
          "id,slug,title,image_url,rows,columns,missing_piece_count,missing_piece_index,rarity,brand_name,brand_country_code,category,created_at"
        )
        .order("created_at", {
          ascending: false,
        });

    if (error?.code === "42703") {
      const legacyResult = await admin
        .from("puzzle_catalog")
        .select(
          "id,slug,title,image_url,rows,columns,missing_piece_count,missing_piece_index,rarity,created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      data = legacyResult.data?.map(
        (puzzle) => ({
          ...puzzle,
          brand_name: null,
          brand_country_code: null,
          category: null,
        })
      ) || null;
      error = legacyResult.error;
    }

    if (error) {
      return NextResponse.json(
        {
          puzzles: fallbackPuzzles,
          warning: error.message,
        }
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
        puzzles: fallbackPuzzles,
        warning:
          error instanceof Error
            ? error.message
            : "Failed to load puzzles",
      }
    );
  }
}
