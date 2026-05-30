import { NextResponse } from "next/server";

import {
  hasCreatorUploadAccess,
} from "@/lib/market-access";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

const ROWS = 4;
const COLUMNS = 4;
const PIECES = ROWS * COLUMNS;

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
        "subscription_tier, subscription_status"
      )
      .eq("id", user.id)
      .maybeSingle();

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

    const priceValue = Number(
      formData.get("price")
    );

    const priceCents =
      Number.isFinite(priceValue) &&
      priceValue > 0
        ? Math.round(
            priceValue * 100
          )
        : 10_000;

    if (!title) {
      return NextResponse.json(
        { error: "Puzzle title required" },
        { status: 400 }
      );
    }

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
        missing_piece_count: PIECES,
      })
      .select("id, slug")
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
      length: PIECES,
    }).map((_, index) => ({
      puzzle_id: puzzle.id,
      piece_index: index,
      shape_seed: Math.floor(
        Math.random() * 1000000
      ),
      is_market_piece: true,
    }));

    const {
      data: insertedPieces,
      error: piecesError,
    } = await admin
      .from("puzzle_pieces")
      .insert(pieces)
      .select("id, piece_index");

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

    const fallbackUsername =
      user.email
        ?.split("@")[0]
        ?.replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        )
        ?.slice(0, 40) ||
      "creator";

    if (!user.email) {
      return NextResponse.json(
        { error: "User email required" },
        { status: 400 }
      );
    }

    const {
      error: profileError,
    } = await admin
      .from("market_profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          username: fallbackUsername,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 500 }
      );
    }

    for (const piece of insertedPieces) {
      await admin
        .from("piece_ownership")
        .upsert(
          {
            piece_id: piece.id,
            owner_user_id: user.id,
          },
          {
            onConflict: "piece_id",
          }
        );

      const {
        data: existingListing,
      } = await admin
        .from("piece_listings")
        .select("id")
        .eq("piece_id", piece.id)
        .eq("status", "active")
        .maybeSingle();

      if (!existingListing) {
        await admin
          .from("piece_listings")
          .insert({
            piece_id: piece.id,
            seller_user_id: user.id,
            price_cents: priceCents,
            status: "active",
          });
      }
    }

    return NextResponse.json({
      ok: true,
      puzzle,
      imageUrl,
      listingsCreated:
        insertedPieces.length,
      priceCents,
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
