"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import Image from "next/image";

import { puzzles } from "@/data/puzzles";
import { apiFetch } from "@/lib/api-client";
import {
  normalizePuzzleCategory,
  PUZZLE_CATEGORIES,
} from "@/lib/brand-metadata";
import { fetchMyProfile } from "@/lib/client-profile";
import { CHOOSE_PUZZLE_HREF } from "@/lib/site-links";
import { supabase } from "@/lib/supabase";
import {
  trackAddToCart,
  trackPurchase,
  trackSearch,
} from "@/lib/analytics";

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
  sale_type?: "Primary Sale" | "Collector Resale";
  availability?: "Available";
  available_supply?: number;
  total_supply?: number;
};

type MarketplaceLoadStatus =
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "timeout";

const puzzleColumns = 5;
const puzzleRows = 5;

function categoryKey(value: string | null | undefined) {
  const raw = String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/\band\b/gi, "&")
    .trim();

  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function categoryMatches(
  itemCategory: string | null | undefined,
  selectedCategory: string
) {
  if (selectedCategory === "ALL") {
    return true;
  }

  const selectedKey = categoryKey(selectedCategory);
  const rawItemKey = categoryKey(itemCategory);
  const normalizedItemKey = categoryKey(
    normalizePuzzleCategory(itemCategory)
  );

  return (
    rawItemKey === selectedKey ||
    normalizedItemKey === selectedKey
  );
}

export default function MarketplaceClient({
  initialListings,
  initialActiveCount,
  initialNextOffset,
  initialStatus,
}: {
  initialListings: MarketItem[];
  initialActiveCount: number | null;
  initialNextOffset: number | null;
  initialStatus: "success" | "error";
}) {

  const [marketItems, setMarketItems] =
    useState<MarketItem[]>(
      initialListings
    );

  const [loadStatus, setLoadStatus] =
    useState<MarketplaceLoadStatus>(
      initialStatus === "error"
        ? "error"
        : initialListings.length === 0
          ? "empty"
          : "success"
    );

  const [activeCount, setActiveCount] =
    useState<number | null>(
      initialActiveCount
    );

  const [nextOffset, setNextOffset] =
    useState<number | null>(
      initialNextOffset
    );

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [rarityFilter, setRarityFilter] =
    useState("ALL");

  const [categoryFilter, setCategoryFilter] =
    useState("ALL");

  const [saleTypeFilter, setSaleTypeFilter] =
    useState("ALL");

  const [priceRangeFilter, setPriceRangeFilter] =
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
      // eslint-disable-next-line react-hooks/immutability
      loadExactMarketplace(
        puzzleParam,
        pieceParam || ""
      );
    }

  }, [initialStatus]);

  useEffect(() => {
    const searchTerm =
      search.trim();

    if (!searchTerm || puzzleFilter) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        trackSearch(searchTerm);
      }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search, puzzleFilter]);

  const availableCategories = useMemo(
    () =>
      PUZZLE_CATEGORIES.filter((category) =>
        marketItems.some((item) =>
          categoryMatches(
            item.category,
            category
          )
        )
      ),
    [marketItems]
  );

  const activeCategoryFilter =
    categoryFilter === "ALL" ||
    availableCategories.some(
      (category) => category === categoryFilter
    )
      ? categoryFilter
      : "ALL";

  async function loadMarketplace({
    append = false,
    silent = false,
    offset = 0,
  }: {
    append?: boolean;
    silent?: boolean;
    offset?: number;
  } = {}) {
    if (!silent) {
      setLoadStatus("loading");
    }

    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(() => {
        controller.abort();
      }, 10000);

    try {
      const response =
        await apiFetch(
          `/api/marketplace-listings?limit=12&offset=${offset}`,
          {
            signal:
              controller.signal,
          }
        );

      if (!response.ok) {
        throw new Error(
          "Marketplace listings could not be loaded."
        );
      }

      const data =
        await response.json();

      const listings =
        data.listings || [];

      setMarketItems((current) =>
        append
          ? [
              ...current,
              ...listings,
            ]
          : listings
      );
      setActiveCount(
        typeof data.activeCount === "number"
          ? data.activeCount
          : listings.length
      );
      setNextOffset(
        typeof data.nextOffset === "number"
          ? data.nextOffset
          : null
      );
      setLoadStatus(
        listings.length === 0 &&
        !append
          ? "empty"
          : "success"
      );
    } catch (error) {
      console.error(error);
      if (!silent) {
        setLoadStatus(
          error instanceof DOMException &&
            error.name === "AbortError"
            ? "timeout"
            : "error"
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function loadMoreListings() {
    if (nextOffset === null) {
      return;
    }

    setLoadingMore(true);
    try {
      await loadMarketplace({
        append: true,
        offset: nextOffset,
        silent: true,
      });
    } finally {
      setLoadingMore(false);
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
            categoryMatches(
              fragment.category,
              activeCategoryFilter
            );

          const matchesSaleType =
            saleTypeFilter === "ALL"
              ? true
              : fragment.sale_type ===
                saleTypeFilter;

          const matchesPriceRange =
            priceRangeFilter === "ALL"
              ? true
              : priceRangeFilter === "UNDER_25"
                ? fragment.price < 25
                : priceRangeFilter === "25_100"
                  ? fragment.price >= 25 &&
                    fragment.price <= 100
                  : fragment.price > 100;

          return (
            matchesSearch &&
            matchesRarity &&
            matchesCategory &&
            matchesSaleType &&
            matchesPriceRange
          );

        }
      );

    }, [
      marketItems,
      search,
      rarityFilter,
      activeCategoryFilter,
      saleTypeFilter,
      priceRangeFilter,
      puzzleFilter,
      pieceFilter,
    ]);

  const primarySaleCount = useMemo(
    () =>
      marketItems.filter(
        (item) =>
          item.sale_type === "Primary Sale"
      ).length,
    [marketItems]
  );

  const collectorResaleCount = useMemo(
    () =>
      marketItems.filter(
        (item) =>
          item.sale_type ===
          "Collector Resale"
      ).length,
    [marketItems]
  );

  const hasCollectorResales =
    collectorResaleCount > 0;

  const isLoading =
    loadStatus === "loading";

  const isRequestProblem =
    loadStatus === "error" ||
    loadStatus === "timeout";

  const isTrueEmpty =
    loadStatus === "empty" &&
    marketItems.length === 0;

  const isFilteredEmpty =
    loadStatus === "success" &&
    marketItems.length > 0 &&
    filteredFragments.length === 0;

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
      setLoadStatus("loading");

      const params =
        new URLSearchParams({
          puzzle: puzzleSlug,
        });

      if (piece.trim()) {
        params.set("piece", piece);
      }

      const controller =
        new AbortController();

      const timeoutId =
        window.setTimeout(() => {
          controller.abort();
        }, 10000);

      try {
        const response =
          await apiFetch(
            `/api/puzzle-market-listings?${params.toString()}`,
            {
              signal:
                controller.signal,
            }
          );

        if (!response.ok) {
          throw new Error(
            "Marketplace listings could not be loaded."
          );
        }

        const data =
          await response.json();

        const listings =
          data.listings || [];

        setMarketItems(listings);
        setActiveCount(listings.length);
        setNextOffset(null);
        setLoadStatus(
          listings.length === 0
            ? "empty"
            : "success"
        );
      } catch (error) {
        console.error(error);
        setLoadStatus(
          error instanceof DOMException &&
            error.name === "AbortError"
            ? "timeout"
            : "error"
        );
      } finally {
        window.clearTimeout(timeoutId);
      }
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

          window.location.assign(
            "/login"
          );

          return;

        }

        const profile =
          await fetchMyProfile();

        if (!profile?.profileComplete) {
          window.location.assign(
            "/setup"
          );
          return;
        }

        if (!profile.hasActiveSubscription) {
          const upgrade =
            window.confirm(
              "Start a 3-day free trial to buy and resell puzzle pieces. Add a card now, but the subscription is not charged today. Open plans?"
            );

          if (upgrade) {
            window.location.assign(
              "/subscribe"
            );
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

        const analyticsItem = {
          item_id: String(fragment.id),
          item_name: `${fragment.title} Piece #${fragment.piece}`,
          item_category:
            normalizePuzzleCategory(
              fragment.category
            ),
          item_brand:
            fragment.brand || undefined,
          price: fragment.price,
          quantity: 1,
        };

        trackAddToCart(analyticsItem);

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

        trackPurchase({
          transaction_id:
            data.tradeId ||
            data.purchaseId ||
            `listing_${fragment.id}`,
          value: fragment.price,
          items: [analyticsItem],
        });

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
          window.location.assign(
            `/puzzle/${encodeURIComponent(puzzleFilter)}`
          );
        } else {
          void loadMarketplace();
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
              : "Browse collectible puzzle fragments available from Puzzle Market and other collectors."}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-10 md:mt-12">

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Live Listings
              </p>

              <h3 className="translate-safe-stat font-black mt-3">
                {activeCount === null ||
                isLoading ||
                isRequestProblem ? (
                  <span className="block h-10 w-24 animate-pulse rounded-xl bg-white/10" />
                ) : (
                  activeCount
                )}
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Primary Sale
              </p>

              <h3 className="translate-safe-stat text-cyan-400 font-black mt-3">
                {isLoading ||
                isRequestProblem ? (
                  <span className="block h-10 w-20 animate-pulse rounded-xl bg-white/10" />
                ) : (
                  primarySaleCount
                )}
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Marketplace Access
              </p>

              <h3 className="translate-safe-stat font-black mt-3">
                {isLoading ||
                isRequestProblem ? (
                  <span className="block h-10 w-20 animate-pulse rounded-xl bg-white/10" />
                ) : (
                  "Open"
                )}
              </h3>

              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Buy now, list later
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* CONTENT */}

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* FILTERS */}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_210px_190px_170px] gap-4 md:gap-5 mb-10 md:mb-12">

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
            value={activeCategoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          >
            <option value="ALL">All Categories</option>
            {availableCategories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={saleTypeFilter}
            onChange={(event) =>
              setSaleTypeFilter(event.target.value)
            }
            className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          >
            <option value="ALL">All Sale Types</option>
            <option value="Primary Sale">Primary Sale</option>
            {hasCollectorResales && (
              <option value="Collector Resale">Collector Resale</option>
            )}
          </select>

          <select
            value={priceRangeFilter}
            onChange={(event) =>
              setPriceRangeFilter(event.target.value)
            }
            className="bg-white/[0.03] border border-white/10 rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          >
            <option value="ALL">All Prices</option>
            <option value="UNDER_25">Under $25</option>
            <option value="25_100">$25 - $100</option>
            <option value="OVER_100">Over $100</option>
          </select>

        </div>

        {/* LOADING */}

        {isLoading && (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[24px] md:rounded-[32px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
              >
                <div className="h-[260px] md:h-[340px] animate-pulse rounded-3xl bg-white/10" />
                <div className="mt-6 h-4 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="mt-4 h-9 w-1/2 animate-pulse rounded bg-white/10" />
                <div className="mt-6 h-14 animate-pulse rounded-2xl bg-white/10" />
              </div>
            ))}
          </div>

        )}

        {isRequestProblem && (

          <div className="bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              Marketplace listings could not be loaded.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-zinc-500 text-lg">
              {loadStatus === "timeout"
                ? "The request took too long. Try again on a better connection."
                : "The request failed before live listings could be confirmed."}
            </p>

            <button
              onClick={() => {
                void loadMarketplace();
              }}
              className="mt-8 rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
            >
              Try Again
            </button>

          </div>

        )}

        {/* GRID */}

        {!isLoading && !isRequestProblem && (
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
                    <Image
                      src={
                        fragment.image
                      }
                      alt={
                        fragment.title
                      }
                      width={720}
                      height={520}
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      loading="lazy"
                      className="w-full h-[260px] md:h-[340px] object-cover transition duration-700 group-hover:scale-110"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {/* BADGES */}

                  <div className="absolute top-5 left-5 flex flex-wrap gap-3">

                    <div className="bg-black/70 backdrop-blur-xl px-3 md:px-4 py-2 rounded-full text-[11px] md:text-xs font-black text-cyan-400 border border-cyan-400/20">
                      {
                        fragment.rarity
                      }
                    </div>

                    <div className="bg-green-400 text-black px-3 md:px-4 py-2 rounded-full text-[11px] md:text-xs font-black">
                      {fragment.availability || "Available"}
                    </div>

                    <div className="bg-black/70 backdrop-blur-xl px-3 md:px-4 py-2 rounded-full text-[11px] md:text-xs font-black text-white border border-white/10">
                      {fragment.sale_type ||
                        "Collector Resale"}
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
                      {fragment.sale_type ===
                      "Primary Sale"
                        ? "Listed by Puzzle Market"
                        : "Seller"}
                    </p>

                    <h3 className="font-black mt-2">
                      {fragment.sale_type ||
                        "Collector Resale"}
                    </h3>

                    {fragment.sale_type ===
                      "Collector Resale" && (
                      <p className="mt-2 text-xs text-zinc-500">
                        {fragment.seller_name ||
                          "Collector"}
                      </p>
                    )}

                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
                      <p className="text-xs text-zinc-500">
                        Available Supply
                      </p>
                      <p className="mt-1 font-black">
                        {fragment.available_supply ?? 1}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/30 p-3">
                      <p className="text-xs text-zinc-500">
                        Total Supply
                      </p>
                      <p className="mt-1 font-black">
                        {fragment.total_supply ??
                          (fragment.puzzle_rows || puzzleRows) *
                            (fragment.puzzle_columns || puzzleColumns)}
                      </p>
                    </div>
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
        )}

        {!isLoading &&
          !isRequestProblem &&
          !isTrueEmpty &&
          nextOffset !== null && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => {
                  void loadMoreListings();
                }}
                disabled={loadingMore}
                className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-7 py-4 font-black text-cyan-200 transition hover:border-cyan-300 disabled:cursor-wait disabled:opacity-60"
              >
                {loadingMore
                  ? "Loading..."
                  : "Load More Listings"}
              </button>
            </div>
          )}

        {/* EMPTY */}

        {isTrueEmpty && (

          <div className="mt-12 md:mt-16 bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              No active listings are available right now.
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              Browse collections, create a watchlist or become the first seller.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={CHOOSE_PUZZLE_HREF}
                className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
              >
                Browse Collections
              </Link>
              <Link
                href="/register"
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-black text-white"
              >
                Create Free Account
              </Link>
            </div>

          </div>

        )}

        {isFilteredEmpty && (

          <div className="mt-12 md:mt-16 bg-white/[0.03] border border-white/10 rounded-[28px] md:rounded-[32px] p-8 md:p-20 text-center backdrop-blur-xl">

            <h2 className="text-3xl md:text-5xl font-black">
              No matching fragments found
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              The marketplace has live listings, but none match the current filters.
            </p>

              <button
                onClick={() => {
                  setSearch("");
                  setPuzzleFilter("");
                  setPieceFilter("");
                  setRarityFilter("ALL");
                  setCategoryFilter("ALL");
                  setSaleTypeFilter("ALL");
                  setPriceRangeFilter("ALL");
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

          </div>

        )}

      </section>

    </main>

  );
}
