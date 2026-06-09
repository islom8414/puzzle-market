import { NextResponse } from "next/server";

import {
  hasCreatorUploadAccess,
} from "@/lib/market-access";
import {
  normalizeBrandCategory,
  normalizeBrandCountry,
  normalizeBrandName,
} from "@/lib/brand-metadata";
import {
  normalizeRarity,
  pickMissingPieceIndex,
  validateRarityPrice,
} from "@/lib/rarity";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ROWS = 4;
const COLUMNS = 4;
const TOTAL_PIECES = ROWS * COLUMNS;

function makeSlug(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now()
  );
}

export async function POST(
  request: Request
) {
  try {
    if (
      !process.env
        .NEXT_PUBLIC_SUPABASE_URL ||
      !process.env
        .SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        {
          error:
            "Server missing SUPABASE_SERVICE_ROLE_KEY in Vercel env.",
        },
        { status: 500 }
      );
    }

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

    const user =
      userData.user;

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const {
      data: profile,
    } = await admin
      .from("market_profiles")
      .select(
        "username, subscription_tier, subscription_status"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.username) {
      return NextResponse.json(
        {
          error:
            "Complete profile setup before publishing a puzzle",
        },
        { status: 409 }
      );
    }

    if (
      !hasCreatorUploadAccess(
        user.email,
        profile
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Creator plan or admin access required",
        },
        { status: 403 }
      );
    }

    const formData =
      await request.formData();

    const title = String(
      formData.get("title") || ""
    ).trim();

    const image =
      formData.get("image");

    const branded =
      String(formData.get("branded") || "true") !==
      "false";

    const brandName =
      normalizeBrandName(
        String(formData.get("brandName") || "")
      );
    const brandCountry =
      normalizeBrandCountry(
        String(formData.get("brandCountry") || "")
      );
    const category =
      normalizeBrandCategory(
        String(formData.get("category") || "")
      );

    const rarity = normalizeRarity(
      String(formData.get("rarity") || "")
    );

    const priceValue = Number(
      formData.get("price")
    );

    if (!title) {
      return NextResponse.json(
        { error: "Puzzle title required" },
        { status: 400 }
      );
    }

    if (branded && !brandName) {
      return NextResponse.json(
        { error: "Brand name required" },
        { status: 400 }
      );
    }

    if (!brandCountry) {
      return NextResponse.json(
        { error: "Choose a valid brand country" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Choose a valid brand category" },
        { status: 400 }
      );
    }

    if (!rarity) {
      return NextResponse.json(
        { error: "Choose rarity: Rare, Epic, or Legendary" },
        { status: 400 }
      );
    }

    const priceError =
      validateRarityPrice(
        rarity,
        priceValue
      );

    if (priceError) {
      return NextResponse.json(
        { error: priceError },
        { status: 400 }
      );
    }

    const priceCents = Math.round(
      priceValue * 100
    );

    if (
      !(image instanceof File) ||
      image.size === 0
    ) {
      return NextResponse.json(
        { error: "Puzzle image required" },
        { status: 400 }
      );
    }

    const slug = makeSlug(title);
    const missingPieceIndex =
      pickMissingPieceIndex(
        slug,
        TOTAL_PIECES,
        ROWS,
        COLUMNS
      );

    const fileExt =
      image.name.split(".").pop() ||
      "png";
    const filePath = `puzzles/${slug}.${fileExt}`;
    const fileBytes =
      new Uint8Array(
        await image.arrayBuffer()
      );

    const upload =
      await admin.storage
        .from("fragments")
        .upload(filePath, fileBytes, {
          cacheControl: "3600",
          upsert: false,
          contentType:
            image.type ||
            "image/png",
        });

    if (upload.error) {
      return NextResponse.json(
        {
          error: upload.error.message,
        },
        { status: 500 }
      );
    }

    const {
      data: publicUrlData,
    } = admin.storage
      .from("fragments")
      .getPublicUrl(filePath);

    const imageUrl =
      publicUrlData.publicUrl;

    const {
      data: puzzle,
      error: puzzleError,
    } = await admin
      .from("puzzle_catalog")
      .insert({
        slug,
        title,
        image_url: imageUrl,
        rows: ROWS,
        columns: COLUMNS,
        missing_piece_count: 1,
        missing_piece_index:
          missingPieceIndex,
        rarity,
        brand_name:
          branded ? brandName : null,
        brand_country_code:
          branded ? brandCountry : null,
        category,
      })
      .select(
        "id, slug, missing_piece_index, rarity, brand_name, brand_country_code, category"
      )
      .single();

    if (puzzleError || !puzzle) {
      await admin.storage
        .from("fragments")
        .remove([filePath]);

      return NextResponse.json(
        {
          error:
            puzzleError?.message ||
            "Catalog insert failed",
        },
        { status: 500 }
      );
    }

    const pieces = Array.from({
      length: TOTAL_PIECES,
    }).map((_, index) => ({
      puzzle_id: puzzle.id,
      piece_index: index,
      shape_seed: Math.floor(
        Math.random() * 1000000
      ),
      is_market_piece:
        index === missingPieceIndex,
    }));

    const {
      data: insertedPieces,
      error: piecesError,
    } = await admin
      .from("puzzle_pieces")
      .insert(pieces)
      .select("id, piece_index, is_market_piece");

    if (piecesError || !insertedPieces) {
      await admin
        .from("puzzle_catalog")
        .delete()
        .eq("id", puzzle.id);

      await admin.storage
        .from("fragments")
        .remove([filePath]);

      return NextResponse.json(
        {
          error:
            piecesError?.message ||
            "Pieces insert failed",
        },
        { status: 500 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    const marketPiece =
      insertedPieces.find(
        (piece) => piece.is_market_piece
      );

    if (marketPiece) {
      await admin
        .from("piece_ownership")
        .upsert(
          {
            piece_id: marketPiece.id,
            owner_user_id: user.id,
          },
          { onConflict: "piece_id" }
        );

      const {
        data: existingListing,
      } = await admin
        .from("piece_listings")
        .select("id")
        .eq("piece_id", marketPiece.id)
        .eq("status", "active")
        .maybeSingle();

      if (!existingListing) {
        await admin
          .from("piece_listings")
          .insert({
            piece_id: marketPiece.id,
            seller_user_id: user.id,
            price_cents: priceCents,
            status: "active",
          });
      }
    }

    return NextResponse.json({
      ok: true,
      puzzle: {
        ...puzzle,
        missingPieceIndex,
      },
      imageUrl,
      priceCents,
      rarity,
      brandName:
        branded ? brandName : null,
      brandCountry:
        branded ? brandCountry : null,
      category,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload puzzle",
      },
      { status: 500 }
    );
  }
}
