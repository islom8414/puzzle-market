import { NextResponse } from "next/server";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

type MarketplaceListing = {
  id: number;
  seller_email: string;
  fragment_id: string;
  title: string;
  image: string;
  piece: string;
  price: number;
  rarity: string;
};

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

    const listingId =
      Number(body.listingId);

    if (
      !Number.isInteger(listingId)
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

    const buyerEmail =
      userData.user.email;

    if (!buyerEmail) {
      return NextResponse.json(
        {
          error: "Buyer email missing",
        },
        {
          status: 400,
        }
      );
    }

    const fallbackUsername =
      buyerEmail
        .split("@")[0]
        .replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        )
        .slice(0, 40) ||
      "PuzzleUser";

    const requestedUsername =
      typeof body.username ===
        "string"
        ? body.username.trim()
        : "";

    const buyerUsername =
      requestedUsername.length >= 3
        ? requestedUsername
        : fallbackUsername;

    const {
      error: profileError,
    } =
      await admin
        .from("market_profiles")
        .upsert({
          id: userData.user.id,
          email: buyerEmail,
          username: buyerUsername,
        });

    if (profileError) {
      console.error(profileError);

      return NextResponse.json(
        {
          error: "Profile setup failed",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: listing,
      error: listingError,
    } =
      await admin
        .from("marketplace")
        .select("*")
        .eq(
          "id",
          listingId
        )
        .maybeSingle<MarketplaceListing>();

    if (
      listingError ||
      !listing
    ) {
      return NextResponse.json(
        {
          error: "Listing unavailable",
        },
        {
          status: 409,
        }
      );
    }

    if (
      listing.seller_email ===
        buyerUsername ||
      listing.seller_email ===
        buyerEmail
    ) {
      return NextResponse.json(
        {
          error: "You cannot buy your own fragment",
        },
        {
          status: 409,
        }
      );
    }

    const priceCents =
      Math.round(
        Number(listing.price) * 100
      );

    if (
      !Number.isInteger(priceCents) ||
      priceCents <= 0
    ) {
      return NextResponse.json(
        {
          error: "Invalid listing price",
        },
        {
          status: 400,
        }
      );
    }

    await admin
      .from("wallet_accounts")
      .upsert({
        user_id: userData.user.id,
      });

    const {
      data: buyerWallet,
    } =
      await admin
        .from("wallet_accounts")
        .select("balance_cents")
        .eq(
          "user_id",
          userData.user.id
        )
        .maybeSingle();

    if (
      !buyerWallet ||
      buyerWallet.balance_cents <
        priceCents
    ) {
      return NextResponse.json(
        {
          error: "Not enough balance",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: sellerByUsername,
    } =
      await admin
        .from("market_profiles")
        .select("id")
        .eq(
          "username",
          listing.seller_email
        )
        .maybeSingle();

    const {
      data: sellerByEmail,
    } =
      sellerByUsername
        ? { data: null }
        : await admin
          .from("market_profiles")
          .select("id")
          .eq(
            "email",
            listing.seller_email
          )
          .maybeSingle();

    const sellerProfile =
      sellerByUsername ||
      sellerByEmail;

    await admin
      .from("wallet_accounts")
      .update({
        balance_cents:
          buyerWallet.balance_cents -
          priceCents,
      })
      .eq(
        "user_id",
        userData.user.id
      );

    if (sellerProfile) {
      const {
        data: sellerWallet,
      } =
        await admin
          .from("wallet_accounts")
          .select("balance_cents")
          .eq(
            "user_id",
            sellerProfile.id
          )
          .maybeSingle();

      await admin
        .from("wallet_accounts")
        .upsert({
          user_id: sellerProfile.id,
          balance_cents:
            (sellerWallet
              ?.balance_cents || 0) +
            priceCents,
        });
    }

    await admin
      .from("wallet_ledger_entries")
      .insert([
        {
          user_id: userData.user.id,
          amount_cents:
            -priceCents,
          entry_type:
            "piece_purchase",
        },
        ...(sellerProfile
          ? [
              {
                user_id:
                  sellerProfile.id,
                amount_cents:
                  priceCents,
                entry_type:
                  "piece_sale",
              },
            ]
          : []),
      ]);

    await admin
      .from("inventory")
      .insert({
        user_email: buyerUsername,
        fragment_id:
          listing.fragment_id,
        title: listing.title,
        image: listing.image,
        piece: listing.piece,
        price: listing.price,
      });

    await admin
      .from("transactions")
      .insert({
        buyer_email: buyerUsername,
        seller_email:
          listing.seller_email,
        fragment_id:
          listing.fragment_id,
        title: listing.title,
        price: listing.price,
      });

    await admin
      .from("activity")
      .insert({
        username: buyerUsername,
        action: "BUY",
        title: listing.title,
        price: listing.price,
      });

    await admin
      .from("marketplace")
      .delete()
      .eq(
        "id",
        listing.id
      );

    return NextResponse.json({
      ok: true,
      sellerCredited:
        Boolean(sellerProfile),
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
