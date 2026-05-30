"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  catalogToCard,
  type CatalogPuzzle,
} from "@/lib/puzzle-catalog";

export function HomePuzzleGrid() {
  const [puzzles, setPuzzles] =
    useState<CatalogPuzzle[]>([]);
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch("/api/puzzles");

        const data =
          await response.json();

        setPuzzles(
          data.puzzles || []
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-10 text-center text-zinc-400">
        Loading puzzle collections...
      </div>
    );
  }

  if (puzzles.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-10 text-center">
        <h3 className="text-3xl md:text-5xl font-black">
          New puzzles coming soon
        </h3>

        <p className="mx-auto mt-4 max-w-2xl text-zinc-500">
          Upload the first collection from Creator Studio.
        </p>

        <Link
          href="/create"
          className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-8 py-4 font-black text-black transition hover:bg-cyan-300"
        >
          Open Creator Studio
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {puzzles.map((puzzle) => {
        const card =
          catalogToCard(puzzle);

        return (
          <article
            key={puzzle.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80"
          >
            <div className="relative aspect-[4/3] bg-black">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                {puzzle.rarity || "Rare"} · 1 missing piece
              </p>

              <h3 className="mt-3 text-2xl font-black">
                {card.title}
              </h3>

              <div className="mt-6">
                <Link
                  href={`/puzzle/${card.slug}`}
                  className="inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-black text-black"
                >
                  Play — Assemble Puzzle
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
