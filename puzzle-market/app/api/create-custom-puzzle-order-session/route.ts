import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  normalizeBrandCategory,
  normalizeBrandCountry,
  normalizeBrandName,
} from "@/lib/brand-metadata";
import { hasCustomPuzzleOrderAccess } from "@/lib/market-access";
import {
  normalizeMarketPieceCount,
  normalizeRarity,
  validateRarityPrice,
} from "@/lib/rarity";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";
import { getStripeConfig } from "@/lib/stripe-config";

export const runtime = "nodejs";

const ORDER_AMOUNT_CENTS = 5000;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

export async function POST(request: Request) {
  try {
    const stripeConfig = getStripeConfig();
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const {
      data: { user },
      error: userError,
    } = await admin.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await admin
      .from("market_profiles")
      .select(
        "id, username, stripe_customer_id, subscription_tier, subscription_status"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.username) {
      return NextResponse.json(
        { error: "Complete profile setup first" },
        { status: 409 }
      );
    }

    if (!hasCustomPuzzleOrderAccess(user, profile)) {
      return NextResponse.json(
        { error: "Active Starter, Premium, or Creator plan required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const title = cleanText(formData.get("title"), 120);
    const description = cleanText(formData.get("description"), 2000);
    const branded = String(formData.get("branded") || "false") === "true";
    const brandName = normalizeBrandName(String(formData.get("brandName") || ""));
    const brandCountry = normalizeBrandCountry(
      String(formData.get("brandCountry") || "GLOBAL")
    );
    const category = normalizeBrandCategory(String(formData.get("category") || "")) || "Other";
    const rarity = normalizeRarity(String(formData.get("rarity") || "")) || "Rare";
    const piecePriceValue = Number(formData.get("piecePrice"));
    const marketPieceCount = normalizeMarketPieceCount(
      formData.get("marketPieceCount")
    );
    const image = formData.get("image");

    if (!title) {
      return NextResponse.json({ error: "Puzzle title required" }, { status: 400 });
    }

    if (!description && (!(image instanceof File) || image.size === 0)) {
      return NextResponse.json(
        { error: "Upload an image/logo or describe the custom puzzle" },
        { status: 400 }
      );
    }

    if (branded && !brandName) {
      return NextResponse.json({ error: "Brand name required" }, { status: 400 });
    }

    if (branded && !brandCountry) {
      return NextResponse.json(
        { error: "Choose a valid brand country" },
        { status: 400 }
      );
    }

    const priceError = validateRarityPrice(rarity, piecePriceValue);

    if (priceError) {
      return NextResponse.json({ error: priceError }, { status: 400 });
    }

    let imagePath: string | null = null;
    let imageUrl: string | null = null;

    if (image instanceof File && image.size > 0) {
      if (!image.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Only image uploads are supported" },
          { status: 400 }
        );
      }

      if (image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json(
          { error: "Image must be 8MB or smaller" },
          { status: 400 }
        );
      }

      const fileExt = image.name.split(".").pop()?.toLowerCase() || "png";
      imagePath = `custom-orders/${user.id}/${Date.now()}.${fileExt}`;
      const fileBytes = new Uint8Array(await image.arrayBuffer());

      const upload = await admin.storage
        .from("fragments")
        .upload(imagePath, fileBytes, {
          cacheControl: "3600",
          upsert: false,
          contentType: image.type || "image/png",
        });

      if (upload.error) {
        return NextResponse.json(
          { error: upload.error.message },
          { status: 500 }
        );
      }

      const { data } = admin.storage.from("fragments").getPublicUrl(imagePath);
      imageUrl = data.publicUrl;
    }

    const piecePriceCents = Math.round(piecePriceValue * 100);

    const { data: order, error: orderError } = await admin
      .from("custom_puzzle_orders")
      .insert({
        user_id: user.id,
        status: "pending_payment",
        amount_cents: ORDER_AMOUNT_CENTS,
        title,
        description: description || null,
        image_url: imageUrl,
        image_path: imagePath,
        category,
        rarity,
        piece_price_cents: piecePriceCents,
        market_piece_count: marketPieceCount,
        brand_name: branded ? brandName : null,
        brand_country_code: branded ? brandCountry : null,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      if (imagePath) {
        await admin.storage.from("fragments").remove([imagePath]);
      }

      return NextResponse.json(
        { error: orderError?.message || "Order creation failed" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeConfig.secretKey);
    const origin = new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: profile.stripe_customer_id || undefined,
      customer_email: profile.stripe_customer_id ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Puzzle Market Custom Puzzle Order",
              description: "One custom puzzle setup request",
            },
            unit_amount: ORDER_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "custom_puzzle_order",
        order_id: order.id,
        user_id: user.id,
      },
      success_url: `${origin}/custom-order?order=success`,
      cancel_url: `${origin}/custom-order?order=cancelled`,
    });

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (error) {
    console.error("Custom puzzle order checkout failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Custom puzzle order checkout failed",
      },
      { status: 500 }
    );
  }
}
