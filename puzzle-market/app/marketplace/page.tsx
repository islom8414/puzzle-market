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

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* HERO */}

      <section className="relative border-b border-white/5">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.15),transparent_35%)]" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 pt-16 pb-14">

          <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-xs">
            LIVE CLOUD MARKETPLACE
          </p>

          <h1 className="text-5xl md:text-7xl font-black mt-5 leading-[0.95] max-w-5xl">
            Trade Rare
            <br />
            Puzzle Fragments
          </h1>

          <p className="text-zinc-400 text-lg mt-8 max-w-2xl leading-relaxed">
            Real-time collectible economy powered by live cloud ownership,
            instant marketplace sync and premium fragment trading.
          </p>

          {/* STATS */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Live Listings
              </p>

              <h3 className="text-4xl font-black mt-3">
                {
                  marketItems.length
                }
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Marketplace
              </p>

              <h3 className="text-cyan-400 text-4xl font-black mt-3">
                LIVE
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Cloud Sync
              </p>

              <h3 className="text-4xl font-black mt-3">
                24/7
              </h3>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Status
              </p>

              <h3 className="text-green-400 text-4xl font-black mt-3">
                ONLINE
              </h3>

            </div>

          </div>

        </div>

      </section>

      {/* CONTENT */}

      <section className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* FILTERS */}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-5 mb-12">

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search rare fragments..."
            className="bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          />

          <select
            value={rarityFilter}
            onChange={(e) =>
              setRarityFilter(
                e.target.value
              )
            }
            className="bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
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

          <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-20 text-center backdrop-blur-xl">

            <h2 className="text-5xl font-black">
              Loading Marketplace...
            </h2>

          </div>

        )}

        {/* GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

          {filteredFragments.map(
            (fragment) => (

              <div
                key={fragment.id}
                className={`group relative rounded-[32px] overflow-hidden border bg-white/[0.03] backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${rarityGlow(fragment.rarity)}`}
              >

                {/* IMAGE */}

                <div className="relative overflow-hidden">

                  <img
                    src={
                      fragment.image
                    }
                    alt={
                      fragment.title
                    }
                    className="w-full h-[340px] object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {/* BADGES */}

                  <div className="absolute top-5 left-5 flex gap-3">

                    <div className="bg-black/70 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-black text-cyan-400 border border-cyan-400/20">
                      {
                        fragment.rarity
                      }
                    </div>

                    <div className="bg-green-400 text-black px-4 py-2 rounded-full text-xs font-black">
                      LIVE
                    </div>

                  </div>

                  {/* PRICE FLOAT */}

                  <div className="absolute bottom-5 right-5 bg-black/70 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3">

                    <p className="text-zinc-500 text-xs">
                      PRICE
                    </p>

                    <h3 className="text-cyan-400 text-3xl font-black">
                      $
                      {
                        fragment.price
                      }
                    </h3>

                  </div>

                </div>

                {/* CONTENT */}

                <div className="p-6">

                  <p className="text-zinc-500 text-sm uppercase tracking-wider">
                    {
                      fragment.title
                    }
                  </p>

                  <h2 className="text-4xl font-black mt-2">
                    Piece #
                    {
                      fragment.piece
                    }
                  </h2>

                  {/* SELLER */}

                  <div className="mt-6 bg-black/40 border border-white/5 rounded-2xl p-4">

                    <p className="text-zinc-500 text-sm">
                      Seller
                    </p>

                    <h3 className="font-black mt-2 break-all">
                      {
                        fragment.seller_email
                      }
                    </h3>

                  </div>

                  {/* BUTTON */}

                  <Link
                    href={`/puzzle/${fragment.fragment_id}`}
                    className="mt-6 flex items-center justify-center w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition duration-300"
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

          <div className="mt-16 bg-white/[0.03] border border-white/10 rounded-[32px] p-20 text-center backdrop-blur-xl">

            <h2 className="text-5xl font-black">
              No Fragments Found
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              Try changing filters or search query.
            </p>

          </div>

        )}

      </section>

    </main>

  );
}