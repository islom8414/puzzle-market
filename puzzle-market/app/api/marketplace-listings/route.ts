import { NextResponse } from "next/server";

import { publicOwnerName } from "@/lib/public-identity";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type ListingRow = {
  id: string;
  price_cents: number;
  created_at: string;
  seller_user_id: string;
  puzzle_pieces: {
    piece_index: number;
    puzzle_catalog: {
      slug: string;
      title: string;
      image_url: string;
      rows: number;
      columns: number;
      rarity: string | null;
      category: string | null;
      brand_name: string | null;
    } | {
      slug: string;
      title: string;
      image_url: string;
      rows: number;
      columns: number;
      rarity: string | null;
      category: string | null;
      brand_name: string | null;
    }[];
  } | {
    piece_index: number;
    puzzle_catalog: {
      slug: string;
      title: string;
      image_url: string;
      rows: number;
      columns: number;
      rarity: string | null;
      category: string | null;
      brand_name: string | null;
    };
  }[];
};

export async function GET() {
  try {
    const admin =
      createSupabaseAdmin();

    let { data, error } =
      await admin
        .from("piece_listings")
        .select(
          `
          id,
          price_cents,
          created_at,
          seller_user_id,
          puzzle_pieces!inner (
            piece_index,
            puzzle_catalog!inner (
              slug,
              title,
              image_url,
              rows,
              columns,
              rarity,
              category,
              brand_name
            )
          )
        `
        )
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        });

    if (error?.code === "42703") {
      const legacyResult = await admin
        .from("piece_listings")
        .select(
          `
          id,
          price_cents,
          created_at,
          seller_user_id,
          puzzle_pieces!inner (
            piece_index,
            puzzle_catalog!inner (
              slug,
              title,
              image_url,
              rows,
              columns,
              rarity
            )
          )
        `
        )
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        });

      data = legacyResult.data?.map(
        (row) => {
          const pieces = Array.isArray(
            row.puzzle_pieces
          )
            ? row.puzzle_pieces
            : [row.puzzle_pieces];

          return {
            ...row,
            puzzle_pieces: pieces.map(
              (piece) => {
                const catalogs = Array.isArray(
                  piece.puzzle_catalog
                )
                  ? piece.puzzle_catalog
                  : [piece.puzzle_catalog];

                return {
                  ...piece,
                  puzzle_catalog: catalogs.map(
                    (catalog) => ({
                      ...catalog,
                      category: null,
                      brand_name: null,
                    })
                  ),
                };
              }
            ),
          };
        }
      ) || null;
      error = legacyResult.error;
    }

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const rows =
      (data as unknown as ListingRow[]) ||
      [];

    const sellerIds = [
      ...new Set(
        rows.map(
          (row) =>
            row.seller_user_id
        )
      ),
    ];

    const { data: sellers } =
      await admin
        .from("market_profiles")
        .select(
          "id,email,username"
        )
        .in("id", sellerIds);

    const sellerMap = new Map(
      (sellers || []).map(
        (seller) => [
          seller.id,
          seller,
        ]
      )
    );

    const listings = rows.map(
      (row) => {
        const piece = Array.isArray(
          row.puzzle_pieces
        )
          ? row.puzzle_pieces[0]
          : row.puzzle_pieces;

        const catalog = Array.isArray(
          piece.puzzle_catalog
        )
          ? piece.puzzle_catalog[0]
          : piece.puzzle_catalog;

        const seller =
          sellerMap.get(
            row.seller_user_id
          );

        return {
          id: row.id,
          seller_user_id:
            row.seller_user_id,
          seller_email:
            publicOwnerName(seller),
          fragment_id:
            catalog.slug,
          title: catalog.title,
          image: catalog.image_url,
          piece: String(
            piece.piece_index
          ),
          price:
            row.price_cents / 100,
          rarity:
            catalog.rarity ||
            "Rare",
          category:
            catalog.category ||
            "Other",
          brand:
            catalog.brand_name ||
            null,
          created_at:
            row.created_at,
          exact_listing: true,
          puzzle_rows: catalog.rows,
          puzzle_columns:
            catalog.columns,
        };
      }
    );

    return NextResponse.json({
      listings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load marketplace",
      },
      { status: 500 }
    );
  }
}
