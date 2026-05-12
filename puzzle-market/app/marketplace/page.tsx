"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

type MarketItem = {

  id: number;

  seller_email: string;

  fragment_id: string;

  title: string;

  image: string;

  piece: string;

  price: number;

  rarity: string;

  created_at?: string;

};

export default function MarketplacePage() {

  const [marketItems, setMarketItems] =
    useState<MarketItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [rarityFilter, setRarityFilter] =
    useState("ALL");

  useEffect(() => {

  loadMarketplace();

  const channel =
    supabase
      .channel(
        "live-marketplace"
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "marketplace",
        },
        () => {

          loadMarketplace();

        }
      )
      .subscribe();

  return () => {

    supabase.removeChannel(
      channel
    );

  };

}, []);

  const loadMarketplace =
    async () => {

      const { data, error } =
        await supabase
          .from("marketplace")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (!error && data) {

        setMarketItems(data);

      }

      setLoading(false);

    };

  const filteredFragments =
    useMemo(() => {

      return marketItems.filter(
        (fragment) => {

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
    ]);

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-wider text-sm">
            Live Cloud Marketplace
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3 leading-tight">
            Trade Rare
            <br />
            Puzzle Pieces
          </h1>

          <p className="text-zinc-500 mt-4 text-base max-w-2xl">
            Real-time collectible economy powered by cloud marketplace listings.
          </p>

        </div>

        {/* FILTERS */}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4 mb-10">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search fragments..."
            className="bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400 transition"
          />

          <select
            value={rarityFilter}
            onChange={(e) =>
              setRarityFilter(
                e.target.value
              )
            }
            className="bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400 transition"
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

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-14 text-center">

            <h2 className="text-3xl font-black">
              Loading Marketplace...
            </h2>

          </div>

        )}

        {/* GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {filteredFragments.map(
            (fragment) => (

              <div
                key={fragment.id}
                className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 hover:border-cyan-400 transition"
              >

                {/* IMAGE */}

                <div className="relative">

                  <img
                    src={
                      fragment.image
                    }
                    alt={
                      fragment.title
                    }
                    className="w-full h-72 object-cover"
                  />

                  <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs font-black text-cyan-400">
                    {
                      fragment.rarity
                    }
                  </div>

                  <div className="absolute top-4 right-4 bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">
                    LIVE
                  </div>

                </div>

                {/* CONTENT */}

                <div className="p-5">

                  <p className="text-zinc-500 text-sm">
                    {
                      fragment.title
                    }
                  </p>

                  <h2 className="text-3xl font-black mt-1">
                    Piece #
                    {
                      fragment.piece
                    }
                  </h2>

                  <div className="mt-5 space-y-3 text-sm">

                    <div className="flex justify-between gap-3">

                      <span className="text-zinc-500">
                        Seller
                      </span>

                      <span className="font-black break-all text-right">
                        {
                          fragment.seller_email
                        }
                      </span>

                    </div>

                  </div>

                  {/* PRICE */}

                  <div className="mt-6">

                    <p className="text-zinc-500 text-sm">
                      Current Price
                    </p>

                    <h3 className="text-4xl font-black text-cyan-400 mt-2">
                      $
                      {
                        fragment.price
                      }
                    </h3>

                  </div>

                  {/* BUTTON */}

                  <Link
                    href={`/puzzle/${fragment.fragment_id}`}
                    className="mt-6 flex items-center justify-center w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-3 rounded-2xl transition"
                  >
                    Open Fragment
                  </Link>

                </div>

              </div>

            )
          )}

        </div>

        {/* EMPTY */}

        {!loading &&
          filteredFragments.length ===
            0 && (

          <div className="mt-14 bg-zinc-950 border border-white/10 rounded-3xl p-14 text-center">

            <h2 className="text-3xl font-black">
              No Fragments Found
            </h2>

            <p className="text-zinc-500 mt-3">
              Try changing filters or search query.
            </p>

          </div>

        )}

      </div>

    </main>

  );
}