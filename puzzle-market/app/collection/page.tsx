"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { fragments } from "@/data/fragments";

export default function CollectionPage() {

  const [owned, setOwned] =
    useState<string[]>([]);

  useEffect(() => {

    const saved = JSON.parse(
      localStorage.getItem(
        "puzzle-owned"
      ) || "[]"
    );

    setOwned(saved);

  }, []);

  const ownedFragments =
    fragments.filter((fragment) =>
      owned.includes(fragment.slug)
    );

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-wider text-sm">
            Collector Inventory
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3">
            My Collection
          </h1>

          <p className="text-zinc-500 mt-4">
            Manage owned fragments and track collection progress.
          </p>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-12">

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Owned
            </p>

            <h2 className="text-4xl font-black mt-3">
              {ownedFragments.length}
            </h2>

          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Legendary
            </p>

            <h2 className="text-4xl font-black mt-3 text-yellow-400">
              {
                ownedFragments.filter(
                  (item) =>
                    item.rarity === "Legendary"
                ).length
              }
            </h2>

          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Rare
            </p>

            <h2 className="text-4xl font-black mt-3 text-cyan-400">
              {
                ownedFragments.filter(
                  (item) =>
                    item.rarity === "Rare"
                ).length
              }
            </h2>

          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Epic
            </p>

            <h2 className="text-4xl font-black mt-3 text-purple-400">
              {
                ownedFragments.filter(
                  (item) =>
                    item.rarity === "Epic"
                ).length
              }
            </h2>

          </div>

        </div>

        {/* EMPTY */}

        {ownedFragments.length === 0 && (

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-14 text-center">

            <h2 className="text-3xl font-black">
              No Fragments Collected
            </h2>

            <p className="text-zinc-500 mt-3">
              Buy fragments from marketplace to build your collection.
            </p>

            <Link
              href="/marketplace"
              className="inline-flex mt-7 bg-cyan-400 hover:bg-cyan-300 text-black font-black px-6 py-3 rounded-2xl transition"
            >
              Open Marketplace
            </Link>

          </div>

        )}

        {/* GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {ownedFragments.map((fragment) => (

            <div
              key={fragment.id}
              className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 hover:border-cyan-400 transition"
            >

              {/* IMAGE */}

              <div className="relative">

                <img
                  src={fragment.image}
                  alt={fragment.title}
                  className="w-full h-72 object-cover"
                />

                <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs font-black text-cyan-400">
                  {fragment.rarity}
                </div>

                <div className="absolute top-4 right-4 bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">
                  OWNED
                </div>

              </div>

              {/* CONTENT */}

              <div className="p-5">

                <p className="text-zinc-500 text-sm">
                  {fragment.title}
                </p>

                <h2 className="text-3xl font-black mt-1">
                  Piece #{fragment.piece}
                </h2>

                <div className="mt-6">

                  <p className="text-zinc-500 text-sm">
                    Estimated Value
                  </p>

                  <h3 className="text-cyan-400 text-4xl font-black mt-2">
                    ${fragment.price}
                  </h3>

                </div>

                {/* BUTTONS */}

                <div className="grid grid-cols-2 gap-3 mt-6">

                  <Link
                    href={`/puzzle/${fragment.slug}`}
                    className="flex items-center justify-center bg-cyan-400 hover:bg-cyan-300 text-black font-black py-3 rounded-2xl transition"
                  >
                    Open
                  </Link>

                  <Link
                    href="/sell"
                    className="flex items-center justify-center bg-white/5 border border-white/10 hover:border-cyan-400 font-black py-3 rounded-2xl transition"
                  >
                    Sell
                  </Link>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );
}