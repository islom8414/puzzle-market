"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

type Fragment = {

  id: number;

  seller_email: string;

  fragment_id: string;

  title: string;

  image: string;

  piece: string;

  price: number;

  rarity: string;

};

export default function SearchPage() {

  const [fragments, setFragments] =
    useState<Fragment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [query, setQuery] =
    useState("");

  const [rarity, setRarity] =
    useState("ALL");

  const [sort, setSort] =
    useState("LATEST");

  useEffect(() => {

    loadFragments();

    const channel =
      supabase
        .channel(
          "search-live"
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

            loadFragments();

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  const loadFragments =
    async () => {

      const {
        data,
        error,
      } =
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

        setFragments(data);

      }

      setLoading(false);

    };

  const filtered =
    useMemo(() => {

      let items =
        fragments.filter(
          (fragment) => {

            const q =
              query.toLowerCase();

            const matchesSearch =
              fragment.title
                .toLowerCase()
                .includes(q) ||

              fragment.seller_email
                .toLowerCase()
                .includes(q) ||

              fragment.piece
                .toString()
                .includes(q);

            const matchesRarity =
              rarity === "ALL"
                ? true
                : fragment.rarity ===
                  rarity;

            return (
              matchesSearch &&
              matchesRarity
            );

          }
        );

      if (sort === "PRICE_HIGH") {

        items.sort(
          (a, b) =>
            b.price - a.price
        );

      }

      if (sort === "PRICE_LOW") {

        items.sort(
          (a, b) =>
            a.price - b.price
        );

      }

      return items;

    }, [
      fragments,
      query,
      rarity,
      sort,
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

      {/* BG */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[36px] p-8 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="relative">

            <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
              GLOBAL SEARCH ENGINE
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-5 leading-[0.95]">
              Discover
              <br />
              Fragments
            </h1>

            <p className="text-zinc-400 text-lg mt-8 max-w-2xl leading-relaxed">
              Search the live cloud marketplace by title, seller, rarity and realtime fragment listings.
            </p>

          </div>

        </section>

        {/* SEARCH BAR */}

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_220px_220px] gap-5 mt-10">

          <input
            value={query}
            onChange={(e) =>
              setQuery(
                e.target.value
              )
            }
            placeholder="Search fragments, sellers, pieces..."
            className="bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          />

          <select
            value={rarity}
            onChange={(e) =>
              setRarity(
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

          <select
            value={sort}
            onChange={(e) =>
              setSort(
                e.target.value
              )
            }
            className="bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-5 outline-none focus:border-cyan-400 transition backdrop-blur-xl"
          >

            <option value="LATEST">
              Latest
            </option>

            <option value="PRICE_HIGH">
              Price High
            </option>

            <option value="PRICE_LOW">
              Price Low
            </option>

          </select>

        </section>

        {/* LOADING */}

        {loading && (

          <div className="mt-12 bg-white/[0.03] border border-white/10 rounded-[36px] p-20 text-center">

            <h2 className="text-5xl font-black">
              Searching Marketplace...
            </h2>

          </div>

        )}

        {/* EMPTY */}

        {!loading &&
          filtered.length ===
            0 && (

          <div className="mt-12 bg-white/[0.03] border border-white/10 rounded-[36px] p-20 text-center">

            <h2 className="text-5xl font-black">
              No Fragments Found
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              Try another search query or filter.
            </p>

          </div>

        )}

        {/* GRID */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-12">

          {filtered.map(
            (fragment) => (

              <div
                key={fragment.id}
                className={`group rounded-[32px] overflow-hidden border bg-white/[0.03] backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${rarityGlow(fragment.rarity)}`}
              >

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

                  <div className="absolute top-5 left-5 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-black border border-white/10">

                    {fragment.rarity}

                  </div>

                  <div className="absolute top-5 right-5 bg-green-400 text-black px-4 py-2 rounded-full text-xs font-black">
                    LIVE
                  </div>

                </div>

                <div className="p-6">

                  <p className="text-zinc-500 text-sm uppercase tracking-wider">
                    {fragment.title}
                  </p>

                  <h2 className="text-4xl font-black mt-2">
                    Piece #{fragment.piece}
                  </h2>

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

                  <div className="mt-6 flex items-center justify-between">

                    <div>

                      <p className="text-zinc-500 text-sm">
                        Price
                      </p>

                      <h2 className="text-cyan-400 text-4xl font-black mt-2">
                        ${fragment.price}
                      </h2>

                    </div>

                  </div>

                  <Link
                    href={`/puzzle/${fragment.fragment_id}`}
                    className="mt-6 flex items-center justify-center w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
                  >
                    Open Fragment
                  </Link>

                </div>

              </div>

            )
          )}

        </section>

      </div>

    </main>

  );
}