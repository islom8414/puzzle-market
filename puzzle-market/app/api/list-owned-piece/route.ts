import { NextResponse } from "next/server";
import {
  revalidatePath,
  revalidateTag,
} from "next/cache";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import { requireActivePaidSubscription } from "@/lib/subscription-access";
import { ensureUserProfile } from "@/lib/user-profile";

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

    const pieceId =
      String(body.pieceId || "");

    const price =
      Number(body.price);

    if (
      !pieceId ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Piece and price required",
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

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          error: "Invalid session",
        },
        {
          status: 401,
        }
      );
    }

    await ensureUserProfile(
      admin,
      userData.user
    );

    const allowed =
      await requireActivePaidSubscription(
        admin,
        {
          id: userData.user.id,
          email:
            userData.user.email,
          app_metadata:
            userData.user.app_metadata,
        }
      );

    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "Starter subscription required to resell puzzle pieces",
        },
        {
          status: 402,
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
          pieceId
        )
        .eq(
          "owner_user_id",
          userData.user.id
        )
        .maybeSingle();

    if (!ownership) {
      return NextResponse.json(
        {
          error:
            "You do not own this piece",
        },
        {
          status: 403,
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
        pieceId
      )
      .eq("status", "active");

    const {
      data: listing,
      error,
    } =
      await admin
        .from("piece_listings")
        .insert({
          piece_id: pieceId,
          seller_user_id:
            userData.user.id,
          price_cents:
            Math.round(price * 100),
          status: "active",
        })
        .select("*")
        .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    await admin.rpc(
      "record_piece_listing_price",
      {
        p_listing_id:
          listing.id,
        p_reason: "resale",
      }
    );

    revalidatePath("/marketplace");
    revalidateTag(
      "marketplace-listings",
      "max"
    );

    return NextResponse.json({
      listing,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Listing failed",
      },
      {
        status: 500,
      }
    );
  }
}
