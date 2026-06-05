import { NextResponse } from "next/server";

import { findFallbackPuzzle } from "@/lib/fallback-puzzles";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ slug: string }>;
  }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug required" },
        { status: 400 }
      );
    }

    const admin =
      createSupabaseAdmin();

    const { data, error } =
      await admin
        .from("puzzle_catalog")
        .select(
          "slug,title,image_url,rows,columns,missing_piece_index,rarity,missing_piece_count"
        )
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      const fallback =
        findFallbackPuzzle(slug);

      if (fallback) {
        return NextResponse.json({
          puzzle: fallback,
        });
      }

      return NextResponse.json(
        { error: "Puzzle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      puzzle: data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load puzzle",
      },
      { status: 500 }
    );
  }
}
