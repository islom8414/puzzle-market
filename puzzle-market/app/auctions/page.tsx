"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

type OwnedPiece = {
  pieceId: string;
  pieceIndex: number;
  title: string;
  image: string;
  rows: number;
  columns: number;
};

type AuctionOffer = {
  id: string;
  amount: number;
  bidderId: string;
  createdAt: string;
};

type AuctionLot = OwnedPiece & {
  id: string;
  puzzleSlug: string;
  sellerId: string;
  sellerName: string;
  startPrice: number;
  highestOffer: number | null;
  offerCount: number;
  endsAt: string;
  isSeller: boolean;
  ownOffer: number | null;
  offers: AuctionOffer[];
};

type AuctionData = {
  lots: AuctionLot[];
  ownedPieces: OwnedPiece[];
  authenticated: boolean;
  canCreateAuction: boolean;
  migrationRequired?: boolean;
  error?: string;
};

function pieceStyle(piece: OwnedPiece) {
  const column = piece.pieceIndex % piece.columns;
  const row = Math.floor(piece.pieceIndex / piece.columns);

  return {
    backgroundImage: `url(${piece.image})`,
    backgroundSize: `${piece.columns * 100}% ${piece.rows * 100}%`,
    backgroundPosition: `${
      piece.columns > 1 ? (column / (piece.columns - 1)) * 100 : 0
    }% ${piece.rows > 1 ? (row / (piece.rows - 1)) * 100 : 0}%`,
  };
}

function timeLeft(endsAt: string, now: number) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);

  if (remaining === 0) {
    return "Ended";
  }

  if (hours >= 24) {
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

export default function AuctionsPage() {
  const router = useRouter();
  const [data, setData] = useState<AuctionData | null>(null);
  const [selectedPieceId, setSelectedPieceId] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [durationHours, setDurationHours] = useState("72");
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [now, setNow] = useState(0);

  const loadAuctions = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await apiFetch(
      "/api/auctions",
      session
        ? {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        : undefined
    );
    const result = (await response.json()) as AuctionData;

    setData(result);
    setSelectedPieceId((current) => {
      if (
        current &&
        result.ownedPieces?.some((piece) => piece.pieceId === current)
      ) {
        return current;
      }

      return result.ownedPieces?.[0]?.pieceId || "";
    });
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      setNow(Date.now());
      void loadAuctions();
    }, 0);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadAuctions]);

  const selectedPiece = useMemo(
    () =>
      data?.ownedPieces.find((piece) => piece.pieceId === selectedPieceId) ||
      null,
    [data?.ownedPieces, selectedPieceId]
  );

  async function submitAction(
    action: string,
    payload: Record<string, unknown>,
    busyKey: string
  ) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return false;
    }

    setBusy(busyKey);
    setMessage("");

    const response = await apiFetch("/api/auctions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });
    const result = await response.json();

    setBusy("");

    if (!response.ok) {
      setMessage(result.error || "Auction action failed");
      return false;
    }

    await loadAuctions();
    return true;
  }

  async function createAuction() {
    const success = await submitAction(
      "create",
      {
        pieceId: selectedPieceId,
        startPrice: Number(startPrice),
        durationHours: Number(durationHours),
      },
      "create"
    );

    if (success) {
      setStartPrice("");
      setMessage("Auction published.");
    }
  }

  async function makeOffer(lot: AuctionLot) {
    const success = await submitAction(
      "offer",
      {
        lotId: lot.id,
        amount: Number(offers[lot.id]),
      },
      `offer-${lot.id}`
    );

    if (success) {
      setOffers((current) => ({ ...current, [lot.id]: "" }));
      setMessage("Your offer was sent to the seller.");
    }
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black px-4 py-16 text-white">
        <p className="mx-auto max-w-7xl text-zinc-400">Loading auctions...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-6 md:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-white/10 pb-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
            Live Puzzle Auctions
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-5xl md:text-7xl">
            Make an offer. Let the owner decide.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
            Premium and Creator members can auction owned puzzle pieces.
            Collectors with an active plan can submit wallet-backed offers.
          </p>
        </header>

        {data.migrationRequired && (
          <section className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-5">
            <h2 className="text-xl font-black text-amber-200">
              Auction database setup is required
            </h2>
            <p className="mt-2 text-sm text-zinc-300">
              Apply the latest Supabase migration before publishing the first
              lot.
            </p>
          </section>
        )}

        {message && (
          <p className="mt-6 rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 font-bold text-cyan-100">
            {message}
          </p>
        )}

        {data.canCreateAuction && !data.migrationRequired && (
          <section className="mt-8 border-y border-white/10 py-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                  Create A Lot
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Choose an owned piece
                </h2>

                {data.ownedPieces.length ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {data.ownedPieces.map((piece) => (
                      <button
                        key={piece.pieceId}
                        type="button"
                        onClick={() => setSelectedPieceId(piece.pieceId)}
                        className={`flex min-w-0 items-center gap-4 rounded-lg border p-3 text-left transition ${
                          selectedPieceId === piece.pieceId
                            ? "border-cyan-400 bg-cyan-400/10"
                            : "border-white/10 bg-white/[0.03] hover:border-white/25"
                        }`}
                      >
                        <span
                          className="h-16 w-16 shrink-0 bg-zinc-900"
                          style={pieceStyle(piece)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-black">
                            {piece.title}
                          </span>
                          <span className="mt-1 block text-sm text-zinc-500">
                            Piece #{piece.pieceIndex + 1}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-zinc-500">
                    You have no available pieces. Pieces already in an auction
                    are hidden here.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                {selectedPiece ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div
                        className="h-20 w-20 shrink-0 bg-zinc-900"
                        style={pieceStyle(selectedPiece)}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xl font-black">
                          {selectedPiece.title}
                        </p>
                        <p className="text-sm text-zinc-500">
                          Piece #{selectedPiece.pieceIndex + 1}
                        </p>
                      </div>
                    </div>

                    <label className="mt-5 block text-sm font-bold text-zinc-400">
                      Starting price
                    </label>
                    <div className="mt-2 flex h-12 items-center rounded-lg border border-white/15 bg-black px-4">
                      <span className="text-zinc-500">$</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={startPrice}
                        onChange={(event) => setStartPrice(event.target.value)}
                        className="h-full min-w-0 flex-1 bg-transparent px-2 font-black outline-none"
                        placeholder="10"
                      />
                    </div>

                    <label className="mt-4 block text-sm font-bold text-zinc-400">
                      Offer period
                    </label>
                    <select
                      value={durationHours}
                      onChange={(event) => setDurationHours(event.target.value)}
                      className="mt-2 h-12 w-full rounded-lg border border-white/15 bg-black px-4 font-bold outline-none"
                    >
                      <option value="24">24 hours</option>
                      <option value="72">3 days</option>
                      <option value="168">7 days</option>
                    </select>

                    <button
                      type="button"
                      disabled={busy === "create"}
                      onClick={createAuction}
                      className="mt-5 h-12 w-full rounded-lg bg-cyan-400 font-black text-black hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {busy === "create" ? "Publishing..." : "Publish Auction"}
                    </button>
                    <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                      Publishing removes any regular marketplace listing for
                      this piece. A 10% platform fee applies only after sale.
                    </p>
                  </>
                ) : (
                  <p className="text-zinc-500">
                    Select an available piece to create an auction.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="py-10">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                Open Lots
              </p>
              <h2 className="mt-2 text-3xl font-black md:text-4xl">
                {data.lots.length
                  ? `${data.lots.length} active auction${
                      data.lots.length === 1 ? "" : "s"
                    }`
                  : "No active auctions"}
              </h2>
            </div>
            {!data.authenticated && (
              <Link
                href="/login"
                className="mt-3 rounded-lg border border-white/15 px-5 py-3 text-center font-black hover:border-cyan-400 sm:mt-0"
              >
                Sign In To Make Offers
              </Link>
            )}
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {data.lots.map((lot) => (
              <article
                key={lot.id}
                className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]"
              >
                <div className="grid sm:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="flex min-h-52 items-center justify-center bg-zinc-950 p-6">
                    <div
                      className="aspect-square w-full max-w-44 border border-cyan-400/30 bg-black"
                      style={pieceStyle(lot)}
                    />
                  </div>

                  <div className="min-w-0 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xl font-black">{lot.title}</p>
                        <p className="mt-1 text-sm text-zinc-500">
                          Piece #{lot.pieceIndex + 1} · {lot.sellerName}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-cyan-400/10 px-2 py-1 text-xs font-black text-cyan-300">
                        {timeLeft(lot.endsAt, now)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/10 py-4">
                      <div>
                        <p className="text-xs text-zinc-500">Start</p>
                        <p className="mt-1 font-black">${lot.startPrice}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Best offer</p>
                        <p className="mt-1 font-black text-cyan-300">
                          {lot.highestOffer ? `$${lot.highestOffer}` : "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Offers</p>
                        <p className="mt-1 font-black">{lot.offerCount}</p>
                      </div>
                    </div>

                    {lot.isSeller ? (
                      <div className="mt-4">
                        {lot.offers.length ? (
                          <div className="space-y-2">
                            {lot.offers.map((offer) => (
                              <div
                                key={offer.id}
                                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 p-3"
                              >
                                <div>
                                  <p className="font-black text-green-300">
                                    ${offer.amount}
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    You receive $
                                    {(offer.amount * 0.9).toFixed(2)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={busy === `accept-${offer.id}`}
                                  onClick={() =>
                                    submitAction(
                                      "accept",
                                      { offerId: offer.id },
                                      `accept-${offer.id}`
                                    ).then((success) => {
                                      if (success) {
                                        setMessage(
                                          "Offer accepted. Ownership and funds were transferred."
                                        );
                                      }
                                    })
                                  }
                                  className="h-10 rounded-lg bg-green-400 px-4 text-sm font-black text-black disabled:opacity-50"
                                >
                                  Accept
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500">
                            Waiting for the first offer.
                          </p>
                        )}

                        <button
                          type="button"
                          disabled={busy === `cancel-${lot.id}`}
                          onClick={() =>
                            submitAction(
                              "cancel",
                              { lotId: lot.id },
                              `cancel-${lot.id}`
                            ).then((success) => {
                              if (success) {
                                setMessage("Auction cancelled.");
                              }
                            })
                          }
                          className="mt-4 text-sm font-black text-red-300 hover:text-red-200"
                        >
                          Cancel Auction
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4">
                        {lot.ownOffer && (
                          <p className="mb-2 text-sm font-bold text-cyan-300">
                            Your current offer: ${lot.ownOffer}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <div className="flex h-11 min-w-0 flex-1 items-center rounded-lg border border-white/15 bg-black px-3">
                            <span className="text-zinc-500">$</span>
                            <input
                              type="number"
                              min={lot.startPrice}
                              step="0.01"
                              value={offers[lot.id] || ""}
                              onChange={(event) =>
                                setOffers((current) => ({
                                  ...current,
                                  [lot.id]: event.target.value,
                                }))
                              }
                              placeholder={String(
                                Math.max(
                                  lot.startPrice,
                                  (lot.highestOffer || 0) + 1
                                )
                              )}
                              className="h-full min-w-0 flex-1 bg-transparent px-2 font-black outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={busy === `offer-${lot.id}`}
                            onClick={() =>
                              data.authenticated
                                ? makeOffer(lot)
                                : router.push("/login")
                            }
                            className="h-11 shrink-0 rounded-lg bg-cyan-400 px-4 font-black text-black hover:bg-cyan-300 disabled:opacity-50"
                          >
                            Offer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {!data.lots.length && (
            <div className="mt-6 border-y border-white/10 py-16 text-center">
              <p className="text-xl font-black">The auction floor is open.</p>
              <p className="mt-2 text-zinc-500">
                The first eligible owner can publish a lot above.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
