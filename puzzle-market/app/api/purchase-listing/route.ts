import { NextResponse } from "next/server";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

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

    if (
      typeof body.listingId !==
      "string"
    ) {
      return NextResponse.json(
        {
          error: "Listing id required",
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

    const {
      data: tradeId,
      error: purchaseError,
    } =
      await admin.rpc(
        "purchase_piece_listing",
        {
          p_buyer_id:
            userData.user.id,
          p_listing_id:
            body.listingId,
        }
      );

    if (purchaseError) {
      return NextResponse.json(
        {
          error:
            purchaseError.message,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      tradeId,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Purchase failed",
      },
      {
        status: 500,
      }
    );
  }
}
