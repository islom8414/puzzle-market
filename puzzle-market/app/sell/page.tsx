"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api-client";
import {
  formatUsd,
  growthBpsForPriceCents,
  indexedPriceCents,
} from "@/lib/price-index";

type OwnedPiece = {
  pieceId: string;
  pieceIndex: number;
  puzzleSlug: string;
  title: string;
  image: string;
  rows: number;
  columns: number;
  listingId: string | null;
  listingPrice: number | null;
};

export default function SellPage() {
  const [pieces, setPieces] =
    useState<OwnedPiece[]>([]);

  const [prices, setPrices] =
    useState<Record<string, string>>(
      {}
    );

  const [loading, setLoading] =
    useState(true);

  const [savingId, setSavingId] =
    useState("");

  useEffect(() => {
    loadPieces();
  }, []);

  async function loadPieces() {
    const {
      data: {
        session,
      },
    } =
      await supabase.auth
        .getSession();

    if (!session) {
      location.href = "/login";
      return;
    }

    const response =
      await apiFetch(
        "/api/owned-pieces",
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

    const data =
      await response.json();

    setPieces(
      data.pieces || []
    );

    setLoading(false);
  }

  const activeListings =
    useMemo(
      () =>
        pieces.filter(
          (piece) =>
            piece.listingId
        ),
      [pieces]
    );

  const totalMarketValue =
    useMemo(
      () =>
        activeListings.reduce(
          (sum, piece) =>
            sum +
            (piece.listingPrice ||
              0),
          0
        ),
      [activeListings]
    );

  function piecePreviewStyle(
    piece: OwnedPiece
  ) {
    const col =
      piece.pieceIndex %
      piece.columns;

    const row =
      Math.floor(
        piece.pieceIndex /
          piece.columns
      );

    return {
      backgroundImage:
        `url(${piece.image})`,
      backgroundSize:
        `${piece.columns * 100}% ${piece.rows * 100}%`,
      backgroundPosition:
        `${(col / (piece.columns - 1)) * 100}% ${(row / (piece.rows - 1)) * 100}%`,
    };
  }

  function salePreview(
    pieceId: string
  ) {
    const price =
      Number(prices[pieceId]);

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return null;
    }

    const fee =
      Math.round(price * 10) / 100;
    const net =
      Math.max(0, price - fee);
    const priceCents =
      Math.round(price * 100);
    const growthBps =
      growthBpsForPriceCents(
        priceCents
      );
    const nextPrice =
      indexedPriceCents(
        priceCents,
        growthBps
      ) / 100;

    return {
      fee: fee.toFixed(2),
      net: net.toFixed(2),
      growthPercent:
        growthBps / 100,
      nextPrice,
    };
  }

  async function listPiece(
    piece: OwnedPiece
  ) {
    const price =
      Number(
        prices[piece.pieceId]
      );

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      alert(
        "Write a resale price first"
      );
      return;
    }

    setSavingId(
      piece.pieceId
    );

    const {
      data: {
        session,
      },
    } =
      await supabase.auth
        .getSession();

    if (!session) {
      location.href = "/login";
      return;
    }

    const response =
      await apiFetch(
        "/api/list-owned-piece",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            pieceId:
              piece.pieceId,
            price,
          }),
        }
      );

    const data =
      await response.json();

    setSavingId("");

    if (!response.ok) {
      alert(
        data.error ||
        "Listing failed"
      );
      return;
    }

    alert(
      "Piece listed for resale"
    );

    loadPieces();
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <section className="bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[36px] p-5 md:p-10 backdrop-blur-xl">
          <p className="text-cyan-400 uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs font-black">
            RESALE CENTER
          </p>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mt-4 md:mt-5 leading-[0.95]">
            Sell Your
            <br />
            Puzzle Pieces
          </h1>

          <p className="text-zinc-400 text-base md:text-lg mt-6 md:mt-8 max-w-2xl leading-relaxed">
            Only pieces you actually own can be listed here. Set your resale price and the next collector can buy it from you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mt-8 md:mt-10">
            <div className="bg-black/40 border border-white/10 rounded-[22px] md:rounded-[28px] p-5 md:p-6">
              <p className="text-zinc-500 text-sm">
                Owned Pieces
              </p>
              <h2 className="text-4xl md:text-5xl font-black mt-3">
                {pieces.length}
              </h2>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-[22px] md:rounded-[28px] p-5 md:p-6">
              <p className="text-zinc-500 text-sm">
                Active Listings
              </p>
              <h2 className="text-cyan-400 text-4xl md:text-5xl font-black mt-3">
                {activeListings.length}
              </h2>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-[22px] md:rounded-[28px] p-5 md:p-6">
              <p className="text-zinc-500 text-sm">
                Listed Value
              </p>
              <h2 className="text-green-400 text-4xl md:text-5xl font-black mt-3">
                {formatUsd(totalMarketValue)}
              </h2>
            </div>
          </div>
        </section>

        {loading && (
          <div className="mt-8 md:mt-10 bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[32px] p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-black">
              Loading owned pieces...
            </h2>
          </div>
        )}

        {!loading &&
          pieces.length === 0 && (
            <div className="mt-8 md:mt-10 bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[32px] p-8 md:p-16 text-center">
              <h2 className="text-3xl md:text-4xl font-black">
                No pieces to resell yet
              </h2>
              <p className="text-zinc-500 mt-4">
                Buy a missing puzzle piece first, then it will appear here.
              </p>
            </div>
          )}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-8 mt-10 md:mt-12">
          {pieces.map((piece) => (
            <div
              key={piece.pieceId}
              className="rounded-[24px] md:rounded-[32px] overflow-hidden border border-cyan-400/20 bg-white/[0.03] backdrop-blur-xl"
            >
              <div className="h-[240px] md:h-[300px] bg-black flex items-center justify-center">
                <div
                  className="w-[180px] h-[180px] md:w-[220px] md:h-[220px] border border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.18)]"
                  style={piecePreviewStyle(
                    piece
                  )}
                />
              </div>

              <div className="p-5 md:p-6">
                <p className="text-zinc-500 uppercase tracking-wider text-sm">
                  {piece.title}
                </p>

                <h2 className="text-3xl md:text-4xl font-black mt-2">
                  Piece #{piece.pieceIndex}
                </h2>

                {piece.listingId && (
                  <div className="mt-5 bg-green-400/10 border border-green-400/20 rounded-2xl p-4">
                    <p className="text-green-300 text-sm font-black">
                      Listed for ${piece.listingPrice}
                    </p>
                  </div>
                )}

                <input
                  type="number"
                  min="1"
                  step="1"
                  value={
                    prices[piece.pieceId] ||
                    ""
                  }
                  onChange={(event) =>
                    setPrices({
                      ...prices,
                      [piece.pieceId]:
                        event.target.value,
                    })
                  }
                  placeholder="Write price, example: 5"
                  className="w-full mt-6 bg-black/80 border border-cyan-400/40 rounded-2xl px-5 py-4 text-lg md:text-xl font-black text-cyan-300 placeholder:text-zinc-500 outline-none focus:border-cyan-300"
                />

                {salePreview(
                  piece.pieceId
                ) && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm">
                    <div className="flex items-center justify-between gap-3 text-zinc-400">
                      <span>
                        Platform fee 10%
                      </span>
                      <span className="font-black text-amber-300">
                        $
                        {
                          salePreview(
                            piece.pieceId
                          )?.fee
                        }
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-zinc-400">
                        You receive
                      </span>
                      <span className="font-black text-green-300">
                        $
                        {
                          salePreview(
                            piece.pieceId
                          )?.net
                        }
                      </span>
                    </div>
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between gap-3 text-cyan-300">
                        <span>
                          Next monthly index
                        </span>
                        <span className="font-black">
                          +
                          {
                            salePreview(
                              piece.pieceId
                            )?.growthPercent
                          }
                          %
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-zinc-400">
                        <span>
                          Projected listing
                        </span>
                        <span className="font-black text-white">
                          {formatUsd(
                            salePreview(
                              piece.pieceId
                            )?.nextPrice || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() =>
                    listPiece(piece)
                  }
                  disabled={
                    savingId ===
                    piece.pieceId ||
                    !prices[piece.pieceId]
                  }
                  className="w-full mt-5 bg-cyan-400 hover:bg-cyan-300 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-black py-4 rounded-2xl"
                >
                  {savingId ===
                  piece.pieceId
                    ? "Listing..."
                    : !prices[piece.pieceId]
                      ? "Enter Price First"
                      : piece.listingId
                      ? "Update Resale Price"
                      : "List For Resale"}
                </button>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
