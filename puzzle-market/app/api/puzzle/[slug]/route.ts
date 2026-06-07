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

    let { data, error } =
      await admin
        .from("puzzle_catalog")
        .select(
          "slug,title,image_url,rows,columns,missing_piece_index,rarity,missing_piece_count,brand_name,brand_country_code,category"
        )
        .eq("slug", slug)
        .maybeSingle();

    if (error?.code === "42703") {
      const legacyResult = await admin
        .from("puzzle_catalog")
        .select(
          "slug,title,image_url,rows,columns,missing_piece_index,rarity,missing_piece_count"
        )
        .eq("slug", slug)
        .maybeSingle();

      data = legacyResult.data
        ? {
            ...legacyResult.data,
            brand_name: null,
            brand_country_code: null,
            category: null,
          }
        : null;
      error = legacyResult.error;
    }

    if (error) {
      const fallback =
        findFallbackPuzzle(slug);

      if (fallback) {
        return NextResponse.json({
          puzzle: fallback,
          warning: error.message,
        });
      }

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
    const fallback =
      findFallbackPuzzle(
        (await context.params).slug
      );

    if (fallback) {
      return NextResponse.json({
        puzzle: fallback,
        warning:
          error instanceof Error
            ? error.message
            : "Failed to load puzzle",
      });
    }

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
