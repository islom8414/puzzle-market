import { NextResponse } from "next/server";

import { sendOwnershipEmail } from "@/lib/ownership-email";
import { createOwnershipCode } from "@/lib/ownership-certificate";
import { hasAuctionListingAccess } from "@/lib/market-access";
import { getCanonicalSiteUrl } from "@/lib/site-url";
import { requireActivePaidSubscription } from "@/lib/subscription-access";
import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

type SessionUser = {
  id: string;
  email?: string | null;
  app_metadata?: unknown;
};

async function getUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const admin = createSupabaseAdmin();
  const {
    data: { user },
  } = await admin.auth.getUser(token);

  return user
    ? {
        admin,
        user: user as SessionUser,
      }
    : null;
}

function isMissingAuctionSchema(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export async function GET(request: Request) {
  try {
    const admin = createSupabaseAdmin();
    const session = await getUser(request);

    await admin
      .from("auction_lots")
      .update({
        status: "expired",
        closed_at: new Date().toISOString(),
      })
      .eq("status", "active")
      .lt("ends_at", new Date().toISOString());

    const { data: lots, error } = await admin
      .from("auction_lots")
      .select(
        "id,piece_id,seller_user_id,start_price_cents,status,ends_at,created_at"
      )
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (isMissingAuctionSchema(error)) {
      return NextResponse.json({
        lots: [],
        ownedPieces: [],
        authenticated: Boolean(session),
        canCreateAuction: false,
        migrationRequired: true,
      });
    }

    if (error) {
      throw error;
    }

    const pieceIds = [...new Set((lots || []).map((lot) => lot.piece_id))];
    const sellerIds = [
      ...new Set((lots || []).map((lot) => lot.seller_user_id)),
    ];

    const [pieceResult, sellerResult, offerResult] = await Promise.all([
      pieceIds.length
        ? admin
            .from("puzzle_pieces")
            .select(
              "id,piece_index,puzzle_catalog(slug,title,image_url,rows,columns)"
            )
            .in("id", pieceIds)
        : Promise.resolve({ data: [], error: null }),
      sellerIds.length
        ? admin
            .from("market_profiles")
            .select("id,username")
            .in("id", sellerIds)
        : Promise.resolve({ data: [], error: null }),
      lots?.length
        ? admin
            .from("auction_offers")
            .select("id,lot_id,bidder_user_id,amount_cents,status,created_at")
            .in(
              "lot_id",
              lots.map((lot) => lot.id)
            )
            .eq("status", "pending")
            .order("amount_cents", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (pieceResult.error || sellerResult.error || offerResult.error) {
      throw pieceResult.error || sellerResult.error || offerResult.error;
    }

    const pieces = new Map(
      (pieceResult.data || []).map((piece) => [piece.id, piece])
    );
    const sellers = new Map(
      (sellerResult.data || []).map((seller) => [seller.id, seller.username])
    );
    const offersByLot = new Map<string, typeof offerResult.data>();

    for (const offer of offerResult.data || []) {
      offersByLot.set(offer.lot_id, [
        ...(offersByLot.get(offer.lot_id) || []),
        offer,
      ]);
    }

    const mappedLots = (lots || []).map((lot) => {
      const piece = pieces.get(lot.piece_id);
      const puzzle = Array.isArray(piece?.puzzle_catalog)
        ? piece?.puzzle_catalog[0]
        : piece?.puzzle_catalog;
      const offers = offersByLot.get(lot.id) || [];
      const ownOffer = session
        ? offers.find((offer) => offer.bidder_user_id === session.user.id)
        : null;

      return {
        id: lot.id,
        pieceId: lot.piece_id,
        pieceIndex: piece?.piece_index ?? 0,
        puzzleSlug: puzzle?.slug || "",
        title: puzzle?.title || "Puzzle piece",
        image: puzzle?.image_url || "",
        rows: puzzle?.rows || 4,
        columns: puzzle?.columns || 4,
        sellerId: lot.seller_user_id,
        sellerName: sellers.get(lot.seller_user_id) || "Collector",
        startPrice: lot.start_price_cents / 100,
        highestOffer: offers.length ? offers[0].amount_cents / 100 : null,
        offerCount: offers.length,
        endsAt: lot.ends_at,
        isSeller: session?.user.id === lot.seller_user_id,
        ownOffer: ownOffer ? ownOffer.amount_cents / 100 : null,
        offers:
          session?.user.id === lot.seller_user_id
            ? offers.map((offer) => ({
                id: offer.id,
                amount: offer.amount_cents / 100,
                bidderId: offer.bidder_user_id,
                createdAt: offer.created_at,
              }))
            : [],
      };
    });

    let canCreateAuction = false;
    let ownedPieces: Array<Record<string, unknown>> = [];

    if (session) {
      const { data: profile } = await admin
        .from("market_profiles")
        .select("subscription_tier,subscription_status")
        .eq("id", session.user.id)
        .maybeSingle();

      canCreateAuction = hasAuctionListingAccess(session.user, profile);

      if (canCreateAuction) {
        const { data: ownership } = await admin
          .from("piece_ownership")
          .select(
            "piece_id,puzzle_pieces(id,piece_index,puzzle_catalog(slug,title,image_url,rows,columns))"
          )
          .eq("owner_user_id", session.user.id);

        const activePieceIds = new Set(pieceIds);

        ownedPieces = (ownership || [])
          .filter((row) => !activePieceIds.has(row.piece_id))
          .map((row) => {
            const piece = Array.isArray(row.puzzle_pieces)
              ? row.puzzle_pieces[0]
              : row.puzzle_pieces;
            const puzzle = Array.isArray(piece?.puzzle_catalog)
              ? piece.puzzle_catalog[0]
              : piece?.puzzle_catalog;

            return {
              pieceId: row.piece_id,
              pieceIndex: piece?.piece_index ?? 0,
              title: puzzle?.title || "Puzzle piece",
              image: puzzle?.image_url || "",
              rows: puzzle?.rows || 4,
              columns: puzzle?.columns || 4,
            };
          });
      }
    }

    return NextResponse.json({
      lots: mappedLots,
      ownedPieces,
      authenticated: Boolean(session),
      canCreateAuction,
      migrationRequired: false,
    });
  } catch (error) {
    console.error("Auction load failed:", error);

    return NextResponse.json(
      { error: "Failed to load auctions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getUser(request);

    if (!session) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { admin, user } = session;
    const body = await request.json();
    const action = String(body.action || "");

    if (action === "create") {
      const pieceId = String(body.pieceId || "");
      const startPrice = Number(body.startPrice);
      const durationHours = Number(body.durationHours);
      const { data: profile } = await admin
        .from("market_profiles")
        .select("subscription_tier,subscription_status")
        .eq("id", user.id)
        .maybeSingle();

      if (!hasAuctionListingAccess(user, profile)) {
        return NextResponse.json(
          { error: "Premium or Creator subscription required" },
          { status: 403 }
        );
      }

      if (
        !pieceId ||
        !Number.isFinite(startPrice) ||
        startPrice < 1 ||
        ![24, 72, 168].includes(durationHours)
      ) {
        return NextResponse.json(
          { error: "Choose a piece, price of at least $1, and duration" },
          { status: 400 }
        );
      }

      const { data: ownership } = await admin
        .from("piece_ownership")
        .select("piece_id")
        .eq("piece_id", pieceId)
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (!ownership) {
        return NextResponse.json(
          { error: "You no longer own this piece" },
          { status: 403 }
        );
      }

      await admin
        .from("piece_listings")
        .update({ status: "cancelled" })
        .eq("piece_id", pieceId)
        .eq("status", "active");

      const { data: lot, error } = await admin
        .from("auction_lots")
        .insert({
          piece_id: pieceId,
          seller_user_id: user.id,
          start_price_cents: Math.round(startPrice * 100),
          ends_at: new Date(
            Date.now() + durationHours * 60 * 60 * 1000
          ).toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json({ lotId: lot.id });
    }

    if (action === "offer") {
      const lotId = String(body.lotId || "");
      const amount = Number(body.amount);
      const allowed = await requireActivePaidSubscription(admin, user);

      if (!allowed) {
        return NextResponse.json(
          { error: "Starter subscription required to make offers" },
          { status: 402 }
        );
      }

      const { data: lot } = await admin
        .from("auction_lots")
        .select("id,seller_user_id,start_price_cents,status,ends_at")
        .eq("id", lotId)
        .maybeSingle();

      if (
        !lot ||
        lot.status !== "active" ||
        new Date(lot.ends_at).getTime() <= Date.now()
      ) {
        return NextResponse.json(
          { error: "Auction is no longer active" },
          { status: 409 }
        );
      }

      if (lot.seller_user_id === user.id) {
        return NextResponse.json(
          { error: "You cannot bid on your own auction" },
          { status: 400 }
        );
      }

      const amountCents = Math.round(amount * 100);

      if (!Number.isFinite(amount) || amountCents < lot.start_price_cents) {
        return NextResponse.json(
          { error: `Minimum offer is $${lot.start_price_cents / 100}` },
          { status: 400 }
        );
      }

      const { data: wallet } = await admin
        .from("wallet_accounts")
        .select("balance_cents")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!wallet || wallet.balance_cents < amountCents) {
        return NextResponse.json(
          { error: "Insufficient wallet balance" },
          { status: 409 }
        );
      }

      await admin
        .from("auction_offers")
        .update({ status: "withdrawn" })
        .eq("lot_id", lotId)
        .eq("bidder_user_id", user.id)
        .eq("status", "pending");

      const { error } = await admin.from("auction_offers").insert({
        lot_id: lotId,
        bidder_user_id: user.id,
        amount_cents: amountCents,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === "accept") {
      const offerId = String(body.offerId || "");
      const { data: tradeId, error } = await admin.rpc(
        "accept_auction_offer",
        {
          p_seller_id: user.id,
          p_offer_id: offerId,
        }
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }

      const { data: trade } = await admin
        .from("piece_trades")
        .select(
          "piece_id,buyer_user_id,puzzle_pieces(piece_index,puzzle_catalog(slug,title))"
        )
        .eq("id", tradeId)
        .maybeSingle();
      const { data: buyer } = trade?.buyer_user_id
        ? await admin.auth.admin.getUserById(trade.buyer_user_id)
        : { data: { user: null } };
      const piece = Array.isArray(trade?.puzzle_pieces)
        ? trade?.puzzle_pieces[0]
        : trade?.puzzle_pieces;
      const puzzle = Array.isArray(piece?.puzzle_catalog)
        ? piece.puzzle_catalog[0]
        : piece?.puzzle_catalog;

      if (buyer.user?.email && trade?.piece_id && puzzle) {
        const origin = getCanonicalSiteUrl();
        const certificateCode = createOwnershipCode({
          tradeId: String(tradeId),
          pieceId: trade.piece_id,
          ownerId: trade.buyer_user_id,
        });

        await sendOwnershipEmail({
          to: buyer.user.email,
          puzzleTitle: puzzle.title,
          puzzleSlug: puzzle.slug,
          tradeId: String(tradeId),
          pieceId: trade.piece_id,
          pieceIndex: piece?.piece_index ?? 0,
          certificateCode,
          certificateUrl: `${origin}/ownership/${encodeURIComponent(
            certificateCode
          )}`,
          origin,
        });
      }

      return NextResponse.json({ tradeId });
    }

    if (action === "cancel") {
      const lotId = String(body.lotId || "");
      const { data: lot } = await admin
        .from("auction_lots")
        .select("id")
        .eq("id", lotId)
        .eq("seller_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!lot) {
        return NextResponse.json(
          { error: "Auction unavailable" },
          { status: 409 }
        );
      }

      await admin
        .from("auction_offers")
        .update({ status: "rejected" })
        .eq("lot_id", lotId)
        .eq("status", "pending");
      await admin
        .from("auction_lots")
        .update({
          status: "cancelled",
          closed_at: new Date().toISOString(),
        })
        .eq("id", lotId);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Auction action failed:", error);

    return NextResponse.json(
      { error: "Auction action failed" },
      { status: 500 }
    );
  }
}
