"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { puzzles } from "@/data/puzzles";
import { fetchMyProfile } from "@/lib/client-profile";
import { CHOOSE_PUZZLE_HREF } from "@/lib/site-links";
import { supabase } from "@/lib/supabase";

type MarketItem = {

  id: number | string;

  seller_email: string;

  seller_user_id?: string;

  fragment_id: string;

  title: string;

  image: string;

  piece: string;

  price: number;

  rarity: string;

  created_at?: string;

  exact_listing?: boolean;

  puzzle_rows?: number;

  puzzle_columns?: number;

};

const puzzleColumns = 5;
const puzzleRows = 5;

export default function MarketplacePage() {

  const [marketItems, setMarketItems] =
    useState<MarketItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [rarityFilter, setRarityFilter] =
    useState("ALL");

  const [puzzleFilter, setPuzzleFilter] =
    useState("");

  const [pieceFilter, setPieceFilter] =
    useState("");

  const [currentUserId, setCurrentUserId] =
    useState("");

  useEffect(() => {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const searchParam =
      params.get("search");

    const puzzleParam =
      params.get("puzzle");

    const pieceParam =
      params.get("piece");

    if (searchParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch(searchParam);
    }

    if (puzzleParam) {
      setPuzzleFilter(puzzleParam);

      const selectedPuzzle =
        puzzles.find(
          (item) =>
            item.slug === puzzleParam
        );

      if (selectedPuzzle) {
        setSearch(
          selectedPuzzle.title
        );
      }
    }

    if (pieceParam) {
      setPieceFilter(pieceParam);
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        setCurrentUserId(
          data.user?.id || ""
        );
      });

    if (puzzleParam) {
      loadExactMarketplace(
        puzzleParam,
        pieceParam || ""
      );
    } else {
      loadMarketplace();
    }

  }, []);

  async function loadMarketplace() {
    setLoading(true);

    try {
      const response =
        await fetch(
          "/api/marketplace-listings"
        );

      const data =
        await response.json();

      setMarketItems(
        data.listings || []
      );
    } catch (error) {
      console.error(error);
      setMarketItems([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredFragments =
    useMemo(() => {

      return marketItems.filter(
        (fragment) => {

          if (puzzleFilter) {
            const fragmentPiece =
              Number(
                fragment.piece
              );

            const requestedPiece =
              Number(
                pieceFilter
              );

            const matchesPuzzle =
              fragment.fragment_id ===
              puzzleFilter;

            const matchesPiece =
              !pieceFilter ||
              fragment.piece ===
                pieceFilter ||
              fragmentPiece ===
                requestedPiece ||
              fragmentPiece ===
                requestedPiece + 1;

            return (
              matchesPuzzle &&
              matchesPiece
            );
          }

          const matchesSearch =
            fragment.title
              .toLowerCase()
              .includes(
                search.toLowerCase()
              );

          const matchesRarity =
            rarityFilter ===
            "ALL"
              ? true
              : fragment.rarity ===
                rarityFilter;

          return (
            matchesSearch &&
            matchesRarity
          );

        }
      );

    }, [
      marketItems,
      search,
      rarityFilter,
      puzzleFilter,
      pieceFilter,
    ]);

  const rarityGlow = (
    rarity: string
  ) => {

    if (
      rarity ===
      "Legendary"
    ) {

      return "shadow-[0_0_40px_rgba(255,215,0,0.35)] border-yellow-400/30";

    }

    if (
      rarity === "Epic"
    ) {

      return "shadow-[0_0_40px_rgba(168,85,247,0.35)] border-purple-400/30";

    }

    return "shadow-[0_0_40px_rgba(34,211,238,0.25)] border-cyan-400/20";

  };

  const getPuzzleForFragment = (
    fragment: MarketItem
  ) =>
    puzzles.find(
      (item) =>
        item.slug ===
        fragment.fragment_id
    );

  const piecePreviewStyle = (
    fragment: MarketItem
  ) => {
    const puzzle =
      getPuzzleForFragment(
        fragment
      );

    const image =
      fragment.image ||
      puzzle?.image;

    if (!image) {
      return null;
    }

    const columns =
      fragment.puzzle_columns ||
      puzzleColumns;

    const rows =
      fragment.puzzle_rows ||
      puzzleRows;

    const rawPiece =
      Number(fragment.piece);

    const piece =
      Number.isFinite(rawPiece)
        ? ((rawPiece %
            (rows * columns)) +
            (rows * columns)) %
          (rows * columns)
        : 0;

    const col = piece % columns;

    const row = Math.floor(
      piece / columns
    );

    const colDenominator =
      columns > 1 ? columns - 1 : 1;

    const rowDenominator =
      rows > 1 ? rows - 1 : 1;

    return {
      backgroundImage: `url(${image})`,
      backgroundSize:
        `${columns * 100}% ${rows * 100}%`,
      backgroundPosition:
        `${(col / colDenominator) * 100}% ${(row / rowDenominator) * 100}%`,
    };
  };

  const isOwnListing = (
    fragment: MarketItem
  ) =>
    !!fragment.seller_user_id &&
    !!currentUserId &&
    fragment.seller_user_id ===
      currentUserId;

  async function loadExactMarketplace(
    puzzleSlug: string,
    piece: string
  ) {
      setLoading(true);

      const params =
        new URLSearchParams({
          puzzle: puzzleSlug,
        });

      if (piece.trim()) {
        params.set("piece", piece);
      }

      const response =
        await fetch(
          `/api/puzzle-market-listings?${params.toString()}`
        );

      const data =
        await response.json();

      setMarketItems(
        data.listings || []
      );

      setLoading(false);
  }

  const purchaseFragment =
    async (
      fragment: MarketItem
    ) => {

      try {

        const {
          data: {
            session,
          },
        } =
          await supabase.auth
            .getSession();

        if (!session) {

          alert(
            "Login required"
          );

          location.href =
            "/login";

          return;

        }

        const profile =
          await fetchMyProfile();

        const username =
          profile?.username ||
          session.user.email
            ?.split("@")[0]
            ?.replace(
              /[^a-zA-Z0-9_-]/g,
              ""
            )
            ?.slice(0, 40) ||
          "PuzzleUser";

        if (
          !fragment.exact_listing ||
          typeof fragment.id !== "string"
        ) {
          alert(
            "This old listing is no longer available."
          );

          return;
        }

        const response =
          await fetch(
            "/api/purchase-listing",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                listingId:
                  fragment.id,
                username,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          alert(
            data.error ||
            "Purchase failed"
          );

          return;

        }

        alert(
          data.emailSent
            ? "Purchase completed. Your puzzle progress is saved. Returning to assembly."
            : "Purchase completed. Returning to your puzzle board with saved progress."
        );

        if (puzzleFilter) {
          location.href =
            `/puzzle/${encodeURIComponent(puzzleFilter)}`;
        } else {
          loadMarketplace();
        }

      } catch (error) {

        console.log(error);

        alert(
          "Purchase failed"
        );

      }

    };

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* HERO */}

      <section className="relative border-b border-white/5">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.15),transparent_35%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-16 pb-12 md:pb-14">

          <p className="text-cyan-400 font-black uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs">
            LIVE CLOUD MARKETPLACE
          </p>

          <h1 className="translate-safe-title font-black mt-4 md:mt-5 max-w-5xl">
            Trade Rare
            <br />
            Puzzle Fragments
          </h1>

          <p className="translate-safe-copy text-zinc-400 text-base md:text-lg mt-6 md:mt-8 leading-relaxed">
            {puzzleFilter
              ? "Only the exact missing piece for this puzzle is shown here. If it is not listed, the current owner has not put it back on sale yet."
              : "Real-time collectible economy powered by live cloud ownership, instant marketplace sync and premium fragment trading."}
          </p>

          <div className="flex flex-wrap gap-3 md:gap-4 mt-8 md:mt-10">
            <Link
              href={CHOOSE_PUZZLE_HREF}
              className="inline-flex w-full sm:w-auto justify-center rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
            >
              Choose A Puzzle
            </Link>
          </div>

          {/* STATS */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-10 md:mt-12">

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Live Listings
              </p>

              <h3 className="translate-safe-stat font-black mt-3">
                {
                  marketItems.length
                }
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Marketplace
              </p>

              <h3 className="translate-safe-stat text-cyan-400 font-black mt-3">
                LIVE
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Cloud Sync
              </p>

              <h3 className="translate-safe-stat font-black mt-3">
                24/7
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Status
              </p>

              <h3 className="translate-safe-stat text-green-400 font-black mt-3">
                ONLINE
              </h3>

            </div>

          </div>

        </div>

      </section>

      {/* CONTENT */}

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* FILTERS */}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 md:gap-5 mb-10 md:mb-12">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder={
              puzzleFilter
                ? "Exact puzzle filter is active"
                : "Search rare fragments..."
            }
            className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          />

          <select
            value={rarityFilter}
            onChange={(e) =>
              setRarityFilter(
                e.target.value
              )
            }
            className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          >

            <option value="ALL">
              All Rarity
            </option>

            <option value="Legendary">
              Legendary
            </option>

            <option value="Epic">
              Epic
            </option>

            <option value="Rare">
              Rare
            </option>

          </select>

        </div>

        {/* LOADING */}

        {loading && (

          <div className="bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              Loading Marketplace...
            </h2>

          </div>

        )}

        {/* GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-8">

          {filteredFragments.map(
            (fragment) => (

              <div
                key={fragment.id}
                className={`group relative rounded-[24px] md:rounded-[32px] overflow-hidden border bg-white/[0.03] backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${rarityGlow(fragment.rarity)}`}
              >

                {/* IMAGE */}

                <div className="relative overflow-hidden">

                  {piecePreviewStyle(
                    fragment
                  ) ? (
                    <div className="h-[260px] md:h-[340px] bg-black flex items-center justify-center">
                      <div
                        className="w-[200px] h-[200px] md:w-[260px] md:h-[260px] border border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.18)] transition duration-700 group-hover:scale-105"
                        style={
                          piecePreviewStyle(
                            fragment
                          ) || undefined
                        }
                      />
                    </div>
                  ) : (
                    <img
                      src={
                        fragment.image
                      }
                      alt={
                        fragment.title
                      }
                      className="w-full h-[260px] md:h-[340px] object-cover transition duration-700 group-hover:scale-110"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {/* BADGES */}

                  <div className="absolute top-5 left-5 flex gap-3">

                    <div className="bg-black/70 backdrop-blur-xl px-3 md:px-4 py-2 rounded-full text-[11px] md:text-xs font-black text-cyan-400 border border-cyan-400/20">
                      {
                        fragment.rarity
                      }
                    </div>

                    <div className="bg-green-400 text-black px-3 md:px-4 py-2 rounded-full text-[11px] md:text-xs font-black">
                      LIVE
                    </div>

                  </div>

                  {/* PRICE FLOAT */}

                  <div className="absolute bottom-4 md:bottom-5 right-4 md:right-5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-4 md:px-5 py-3">

                    <p className="text-zinc-500 text-xs">
                      PRICE
                    </p>

                    <h3 className="text-cyan-400 text-2xl md:text-3xl font-black">
                      $
                      {
                        fragment.price
                      }
                    </h3>

                  </div>

                </div>

                {/* CONTENT */}

                <div className="p-5 md:p-6">

                  <p className="text-zinc-500 text-sm uppercase tracking-wider">
                    {
                      fragment.title
                    }
                  </p>

                  <h2 className="text-3xl md:text-4xl font-black mt-2">
                    Piece #
                    {
                      fragment.piece
                    }
                  </h2>

                  {/* SELLER */}

                  <div className="mt-6 bg-black/40 border border-white/5 rounded-2xl p-4">

                    <p className="text-zinc-500 text-sm">
                      Current Owner
                    </p>

                    <h3 className="font-black mt-2">
                      {
                        fragment.seller_email ||
                        "Collector"
                      }
                    </h3>

                  </div>

                  {/* BUTTON */}

                  <button
                    disabled={
                      isOwnListing(
                        fragment
                      )
                    }
                    onClick={() =>
                      purchaseFragment(
                        fragment
                      )
                    }

className="
mt-6
flex
items-center
justify-center
w-full
disabled:bg-zinc-700
disabled:text-zinc-400
bg-green-400
hover:bg-green-300
text-black
font-black
py-4
rounded-2xl
transition
duration-300
"

>

{isOwnListing(fragment)
  ? "This Piece Is Yours"
  : `Buy Piece - $${fragment.price}`}

</button>

                </div>

              </div>

            )
          )}

        </div>

        {/* EMPTY */}

        {!loading &&
          filteredFragments.length ===
            0 && (

          <div className="mt-12 md:mt-16 bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              No Fragments Found
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              This exact missing piece is not listed right now. Browse all active fragments or check back later.
            </p>

            {(search ||
              puzzleFilter ||
              rarityFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setPuzzleFilter("");
                  setPieceFilter("");
                  setRarityFilter("ALL");
                  window.history.replaceState(
                    null,
                    "",
                    "/marketplace"
                  );
                }}
                className="mt-8 bg-cyan-400 text-black font-black px-6 py-4 rounded-2xl"
              >
                Show All Fragments
              </button>
            )}

          </div>

        )}

      </section>

    </main>

  );
}
