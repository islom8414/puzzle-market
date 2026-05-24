import { NextResponse } from "next/server";

import { puzzles } from "@/data/puzzles";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

const adminEmails = [
  "islommatchanov888@gmail.com",
  "ismatchanov08@gmail.com",
];

const rows = 5;
const columns = 5;

function getMissingIndex(
  puzzleId: number
) {
  return (puzzleId * 7) %
    (rows * columns);
}

export async function POST(
  request: Request
) {
  try {
    const token =
      getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: "Login required",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request.json();

    const puzzleSlug =
      String(body.puzzleSlug || "");

    const price =
      Number(body.price);

    const puzzle =
      puzzles.find(
        (item) =>
          item.slug === puzzleSlug
      );

    if (
      !puzzle ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Valid puzzle and price required",
        },
        {
          status: 400,
        }
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

    const email =
      userData.user?.email || "";

    if (
      userError ||
      !adminEmails.includes(email)
    ) {
      return NextResponse.json(
        {
          error: "Admin only",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data: ownerProfile,
      error: profileError,
    } =
      await admin
        .from("market_profiles")
        .upsert(
          {
            id: userData.user!.id,
            email,
            username:
              email
                .split("@")[0]
                .replace(
                  /[^a-zA-Z0-9_-]/g,
                  ""
                )
                .slice(0, 40) ||
              "admin",
          },
          {
            onConflict: "id",
          }
        )
        .select("*")
        .single();

    if (
      profileError ||
      !ownerProfile
    ) {
      return NextResponse.json(
        {
          error:
            profileError?.message ||
            "Profile failed",
        },
        {
          status: 500,
        }
      );
    }

    const missingIndex =
      getMissingIndex(
        Number(puzzle.id)
      );

    const {
      data: catalog,
      error: catalogError,
    } =
      await admin
        .from("puzzle_catalog")
        .upsert(
          {
            slug: puzzle.slug,
            title: puzzle.title,
            image_url: puzzle.image,
            rows,
            columns,
            missing_piece_count: 1,
          },
          {
            onConflict: "slug",
          }
        )
        .select("*")
        .single();

    if (
      catalogError ||
      !catalog
    ) {
      return NextResponse.json(
        {
          error:
            catalogError?.message ||
            "Catalog failed",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: piece,
      error: pieceError,
    } =
      await admin
        .from("puzzle_pieces")
        .upsert(
          {
            puzzle_id: catalog.id,
            piece_index: missingIndex,
            shape_seed:
              puzzle.id * 100 +
              missingIndex,
            is_market_piece: true,
          },
          {
            onConflict:
              "puzzle_id,piece_index",
          }
        )
        .select("*")
        .single();

    if (
      pieceError ||
      !piece
    ) {
      return NextResponse.json(
        {
          error:
            pieceError?.message ||
            "Piece failed",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: ownership,
    } =
      await admin
        .from("piece_ownership")
        .select("*")
        .eq(
          "piece_id",
          piece.id
        )
        .maybeSingle();

    if (!ownership) {
      await admin
        .from("piece_ownership")
        .insert({
          piece_id: piece.id,
          owner_user_id:
            ownerProfile.id,
        });
    } else if (
      ownership.owner_user_id !==
      ownerProfile.id
    ) {
      return NextResponse.json(
        {
          error:
            "This piece is already owned by a buyer. They must set their resale price.",
        },
        {
          status: 409,
        }
      );
    }

    await admin
      .from("piece_listings")
      .update({
        status: "cancelled",
      })
      .eq(
        "piece_id",
        piece.id
      )
      .eq("status", "active")
      .neq(
        "seller_user_id",
        ownerProfile.id
      );

    const {
      data: existingListing,
    } =
      await admin
        .from("piece_listings")
        .select("*")
        .eq(
          "piece_id",
          piece.id
        )
        .eq(
          "seller_user_id",
          ownerProfile.id
        )
        .eq("status", "active")
        .maybeSingle();

    if (existingListing) {
      await admin
        .from("piece_listings")
        .update({
          price_cents:
            Math.round(price * 100),
        })
        .eq(
          "id",
          existingListing.id
        );
    } else {
      await admin
        .from("piece_listings")
        .insert({
          piece_id: piece.id,
          seller_user_id:
            ownerProfile.id,
          price_cents:
            Math.round(price * 100),
          status: "active",
        });
    }

    return NextResponse.json({
      ok: true,
      puzzleSlug: puzzle.slug,
      pieceIndex: missingIndex,
      price,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Admin price update failed",
      },
      {
        status: 500,
      }
    );
  }
}
