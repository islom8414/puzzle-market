import { NextResponse } from "next/server";
import {
  revalidatePath,
  revalidateTag,
} from "next/cache";

import { sendOwnershipEmail } from "@/lib/ownership-email";
import { createOwnershipCode } from "@/lib/ownership-certificate";
import { getCanonicalSiteUrl } from "@/lib/site-url";
import { requireActivePaidSubscription } from "@/lib/subscription-access";
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
            "Starter subscription required to buy puzzle pieces",
        },
        {
          status: 402,
        }
      );
    }

    let rewardApplied = false;
    let {
      data: tradeId,
      error: purchaseError,
    } =
      await admin.rpc(
        "purchase_piece_listing_with_referral_reward",
        {
          p_buyer_id:
            userData.user.id,
          p_listing_id:
            body.listingId,
        }
      );

    if (!purchaseError) {
      rewardApplied = true;
    }

    if (purchaseError) {
      const canFallbackToWallet =
        purchaseError.message.includes(
          "no referral reward"
        ) ||
        purchaseError.message.includes(
          "function public.purchase_piece_listing_with_referral_reward"
        );

      if (canFallbackToWallet) {
        const fallback =
          await admin.rpc(
            "purchase_piece_listing",
            {
              p_buyer_id:
                userData.user.id,
              p_listing_id:
                body.listingId,
            }
          );

        tradeId = fallback.data;
        purchaseError =
          fallback.error;
      }
    }

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

    const {
      data: listing,
    } = await admin
      .from("piece_listings")
      .select(
        "piece_id, puzzle_pieces(piece_index, puzzle_catalog(slug, title))"
      )
      .eq("id", body.listingId)
      .maybeSingle();

    const piece = listing?.puzzle_pieces as
      | {
          piece_index: number;
          puzzle_catalog: {
            slug: string;
            title: string;
          };
        }
      | undefined;

    const catalog =
      piece?.puzzle_catalog;

    let emailSent = false;
    let emailReason: string | null = null;

    if (
      catalog &&
      userData.user.email &&
      listing?.piece_id &&
      tradeId
    ) {
      const origin =
        getCanonicalSiteUrl();
      const certificateCode =
        createOwnershipCode({
          tradeId: String(tradeId),
          pieceId: String(
            listing.piece_id
          ),
          ownerId:
            userData.user.id,
        });
      const certificateUrl =
        `${origin}/ownership/${encodeURIComponent(certificateCode)}`;

      const emailResult =
        await sendOwnershipEmail({
          to: userData.user.email,
          puzzleTitle: catalog.title,
          puzzleSlug: catalog.slug,
          tradeId: String(tradeId),
          pieceId: String(
            listing.piece_id
          ),
          pieceIndex: piece?.piece_index ?? 0,
          certificateCode,
          certificateUrl,
          origin,
        });

      emailSent = emailResult.sent;

      if (
        !emailResult.sent &&
        "reason" in emailResult
      ) {
        emailReason =
          emailResult.reason ||
          "Email provider error";
        console.error(
          "Ownership email failed:",
          emailReason
        );
      }
    }

    revalidatePath("/marketplace");
    revalidateTag(
      "marketplace-listings",
      "max"
    );

    return NextResponse.json({
      tradeId,
      emailSent,
      emailReason,
      rewardApplied,
      puzzleSlug: catalog?.slug || null,
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
