import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase-admin";
import type { CatalogPuzzle } from "@/lib/puzzle-catalog";

type CatalogRow = {
  id: string | number;
  slug: string;
  title: string;
  image_url: string;
  rarity: string | null;
  category: string | null;
  brand_name: string | null;
  rows: number | null;
  columns: number | null;
  missing_piece_count?: number | null;
  created_at?: string | null;
};

export async function loadHomeCollections(): Promise<CatalogPuzzle[]> {
  try {
    const admin =
      createSupabaseAdmin();

    const { data, error } =
      await admin
        .from("puzzle_catalog")
        .select(
          "id,slug,title,image_url,rarity,category,brand_name,rows,columns,missing_piece_count,created_at"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(6);

    if (error) {
      console.warn(
        "Home collections unavailable",
        error.message
      );
      return [];
    }

    return ((data || []) as CatalogRow[]).map(
      (item) =>
        ({
          id: String(item.id),
          slug: item.slug,
          title: item.title,
          image_url: item.image_url,
          rarity: item.rarity || "Rare",
          category: item.category || "Other",
          brand_name: item.brand_name,
          rows: item.rows || 4,
          columns: item.columns || 4,
          missing_piece_count:
            item.missing_piece_count || 1,
        }) as CatalogPuzzle
    );
  } catch (error) {
    console.warn(
      "Home collections unavailable",
      error
    );
    return [];
  }
}
