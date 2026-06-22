"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { puzzles } from "@/data/puzzles";
import { apiFetch } from "@/lib/api-client";
import {
  normalizePuzzleCategory,
  PUZZLE_CATEGORIES,
} from "@/lib/brand-metadata";
import { fetchMyProfile } from "@/lib/client-profile";
import {
  formatUsd,
  indexedPriceCents,
  type PriceHistoryPoint,
} from "@/lib/price-index";
import { CHOOSE_PUZZLE_HREF } from "@/lib/site-links";
import { supabase } from "@/lib/supabase";

type MarketItem = {

  id: number | string;

  seller_name: string;

  seller_user_id?: string;

  fragment_id: string;

  title: string;

  image: string;

  piece: string;

  price: number;

  rarity: string;

  category?: string;

  brand?: string | null;

  created_at?: string;

  exact_listing?: boolean;

  puzzle_rows?: number;

  puzzle_columns?: number;

  price_history?: PriceHistoryPoint[];

  monthly_growth_percent?: number;

};

const puzzleColumns = 5;
const puzzleRows = 5;

function PriceGrowthChart({
  fragment,
}: {
  fragment: MarketItem;
}) {
  const monthlyGrowth =
    fragment.monthly_growth_percent ||
    (fragment.price <= 10
      ? 5
      : fragment.price <= 100
        ? 7
        : 9);

  const currentCents = Math.round(
    fragment.price * 100
  );
  const nextPrice =
    indexedPriceCents(
      currentCents,
      Math.round(monthlyGrowth * 100)
    ) / 100;

  const seedSource =
    `${fragment.id}-${fragment.fragment_id}-${fragment.piece}-${fragment.price}`;

  let seed = 0;
  for (const char of seedSource) {
    seed =
      (seed * 31 + char.charCodeAt(0)) >>> 0;
  }

  const seeded = () => {
    seed =
      (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967295;
  };

  const historyPoints =
    fragment.price_history
      ?.map((point) => point.price)
      .filter((price) => Number.isFinite(price))
      .slice(-6) || [];

  const syntheticPoints =
    Array.from({ length: 6 }).map((_, index) => {
      const t = index / 5;
      const startingDiscount =
        0.16 + seeded() * 0.1;
      const curve =
        Math.pow(t, 1.18 + seeded() * 0.35);
      const wobble =
        (seeded() - 0.5) *
        fragment.price *
        0.035;

      if (index === 5) {
        return nextPrice;
      }

      if (index === 4) {
        return fragment.price;
      }

      return Math.max(
        0.01,
        fragment.price *
          (1 - startingDiscount) +
          fragment.price *
            startingDiscount *
            curve +
          wobble
      );
    });

  const points =
    historyPoints.length >= 4
      ? [
          ...historyPoints,
          nextPrice,
        ]
      : syntheticPoints;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = Math.max(0.01, max - min);

  const coords = points.map(
    (price, index) => {
      const x =
        points.length === 1
          ? 50
          : (index /
              (points.length - 1)) *
            100;
      const y =
        82 -
        ((price - min) / spread) * 64;

      return {
        x,
        y,
      };
    }
  );

  const linePath =
    coords.reduce(
      (path, point, index) => {
        if (index === 0) {
          return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        }

        const previous =
          coords[index - 1];
        const midX =
          (previous.x + point.x) / 2;

        return `${path} C ${midX.toFixed(2)} ${previous.y.toFixed(2)}, ${midX.toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      },
      ""
    );

  const areaPath =
    `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} 86 L ${coords[0].x.toFixed(2)} 86 Z`;

  const chartId =
    `price-chart-${String(fragment.id).replace(/[^a-zA-Z0-9_-]/g, "")}-${fragment.piece}`;

  const lastPoint =
    coords[coords.length - 1];

  const previousPoint =
    coords[coords.length - 2] ||
    coords[0];

  const arrowAngle =
    Math.atan2(
      lastPoint.y - previousPoint.y,
      lastPoint.x - previousPoint.x
    ) *
    (180 / Math.PI);

  return (
    <div className="mt-5 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
            Price Index
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Monthly growth +{monthlyGrowth}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">
            Next month
          </p>
          <p className="font-black text-white">
            {formatUsd(nextPrice)}
          </p>
        </div>
      </div>

      <svg
        viewBox="0 0 100 90"
        className="mt-4 h-24 w-full overflow-visible"
        role="img"
        aria-label="Monthly price growth chart"
      >
        <defs>
          <linearGradient
            id={`${chartId}-area`}
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="rgb(34,211,238)"
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor="rgb(34,211,238)"
              stopOpacity="0"
            />
          </linearGradient>
          <linearGradient
            id={`${chartId}-line`}
            x1="0"
            x2="1"
            y1="0"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="rgb(103,232,249)"
            />
            <stop
              offset="100%"
              stopColor="rgb(16,185,129)"
            />
          </linearGradient>
          <filter
            id={`${chartId}-glow`}
            x="-20%"
            y="-40%"
            width="140%"
            height="180%"
          >
            <feGaussianBlur
              stdDeviation="2.4"
              result="blur"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[24, 45, 66, 86].map((y) => (
          <line
            key={y}
            x1="0"
            x2="100"
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.8"
          />
        ))}

        <path
          d={areaPath}
          fill={`url(#${chartId}-area)`}
        />

        <path
          d={linePath}
          fill="none"
          stroke={`url(#${chartId}-line)`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${chartId}-glow)`}
        />

        {coords.map((point, index) => {
          return (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r={index === coords.length - 1 ? 4.5 : 2.4}
              fill={
                index === coords.length - 1
                  ? "rgb(16,185,129)"
                  : "white"
              }
              opacity={
                index === coords.length - 1
                  ? 1
                  : 0.82
              }
            />
          );
        })}

        <g
          transform={`translate(${lastPoint.x.toFixed(2)} ${lastPoint.y.toFixed(2)}) rotate(${arrowAngle.toFixed(2)})`}
        >
          <path
            d="M 0 0 L -7 -4 L -5 0 L -7 4 Z"
            fill="rgb(16,185,129)"
          />
        </g>
      </svg>

      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>Current {formatUsd(fragment.price)}</span>
        <span>Projected</span>
      </div>
    </div>
  );
}

export default function MarketplacePage() {

  const [marketItems, setMarketItems] =
    useState<MarketItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [rarityFilter, setRarityFilter] =
    useState("ALL");

  const [categoryFilter, setCategoryFilter] =
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
        await apiFetch(
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

          const matchesCategory =
            categoryFilter === "ALL"
              ? true
              : normalizePuzzleCategory(fragment.category) ===
                categoryFilter;

          return (
            matchesSearch &&
            matchesRarity &&
            matchesCategory
          );

        }
      );

    }, [
      marketItems,
      search,
      rarityFilter,
      categoryFilter,
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
        await apiFetch(
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

        if (!profile?.profileComplete) {
          location.href =
            "/setup";
          return;
        }

        if (!profile.hasActiveSubscription) {
          const upgrade =
            window.confirm(
              "A Starter plan is required only when you buy or resell a puzzle piece. Open plans now?"
            );

          if (upgrade) {
            location.href =
              "/subscribe";
          }

          return;
        }

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
          await apiFetch(
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
          data.rewardApplied
            ? data.emailSent
              ? "Referral reward applied. Purchase completed and your ownership certificate was emailed."
              : `Referral reward applied. Purchase completed, but certificate email was not sent automatically.${data.emailReason ? ` Reason: ${data.emailReason}` : ""}`
            : data.emailSent
              ? "Purchase completed. Your puzzle progress is saved. Returning to assembly."
              : `Purchase completed. Certificate email was not sent automatically.${data.emailReason ? ` Reason: ${data.emailReason}` : ""}`
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
              ? pieceFilter
                ? "Only the exact missing piece for this puzzle is shown here. If it is not listed, the current owner has not put it back on sale yet."
                : "All active missing pieces for this puzzle are shown here. Buy each missing fragment to complete the image."
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

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_220px] gap-4 md:gap-5 mb-10 md:mb-12">

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

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          >
            <option value="ALL">All Categories</option>
            {PUZZLE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
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

                  <p className="mt-2 text-sm font-bold text-cyan-400">
                    {normalizePuzzleCategory(fragment.category)}
                    {fragment.brand
                      ? ` / ${fragment.brand}`
                      : ""}
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
                        fragment.seller_name ||
                        "Collector"
                      }
                    </h3>

                  </div>

                  <PriceGrowthChart
                    fragment={fragment}
                  />

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
              rarityFilter !== "ALL" ||
              categoryFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setPuzzleFilter("");
                  setPieceFilter("");
                  setRarityFilter("ALL");
                  setCategoryFilter("ALL");
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
