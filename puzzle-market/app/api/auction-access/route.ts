import { NextResponse } from "next/server";

import { hasAuctionListingAccess } from "@/lib/market-access";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        canCreateAuction: false,
      });
    }

    const admin = createSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        {
          authenticated: false,
          canCreateAuction: false,
        },
        { status: 401 }
      );
    }

    const { data: profile } = await admin
      .from("market_profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    return NextResponse.json({
      authenticated: true,
      canCreateAuction: hasAuctionListingAccess(
        user,
        profile
      ),
      subscriptionTier:
        profile?.subscription_tier || "free",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to check auction access",
      },
      { status: 500 }
    );
  }
}
