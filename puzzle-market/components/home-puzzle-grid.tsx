"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CategoryScroller } from "@/components/category-scroller";
import {
  normalizePuzzleCategory,
  PUZZLE_CATEGORIES,
} from "@/lib/brand-metadata";
import {
  catalogToCard,
  type CatalogPuzzle,
} from "@/lib/puzzle-catalog";
import { apiFetch } from "@/lib/api-client";

export function HomePuzzleGrid() {
  const [puzzles, setPuzzles] =
    useState<CatalogPuzzle[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [category, setCategory] =
    useState("ALL");

  const filteredPuzzles = useMemo(
    () =>
      category === "ALL"
        ? puzzles
        : puzzles.filter(
            (puzzle) =>
              normalizePuzzleCategory(puzzle.category) === category
          ),
    [category, puzzles]
  );

  useEffect(() => {
    async function load() {
      try {
        const response =
          await apiFetch("/api/puzzles");

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
    <div>
      <CategoryScroller
        items={PUZZLE_CATEGORIES}
        value={category}
        onChange={setCategory}
        className="mb-6"
      />

      {filteredPuzzles.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-10 text-center">
          <h3 className="text-3xl font-black">
            No puzzles in this category yet
          </h3>
          <p className="mt-3 text-zinc-500">
            Choose another category or check again after new releases.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {filteredPuzzles.map((puzzle) => {
        const card =
          catalogToCard(puzzle);
        const missingCount =
          Math.max(
            1,
            puzzle.missing_piece_count || 1
          );

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
                {puzzle.rarity || "Rare"} / {missingCount} missing{" "}
                {missingCount === 1 ? "piece" : "pieces"}
              </p>

              <p className="mt-3 text-sm font-bold text-zinc-500">
                {normalizePuzzleCategory(puzzle.category)}
                {puzzle.brand_name
                  ? ` / ${puzzle.brand_name}`
                  : ""}
              </p>

              <h3 className="mt-3 text-2xl font-black">
                {card.title}
              </h3>

              <div className="mt-6">
                <Link
                  href={`/puzzle/${card.slug}`}
                  className="inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-black text-black"
                >
                  View Puzzle
                </Link>
              </div>
            </div>
          </article>
        );
      })}
        </div>
      )}
    </div>
  );
}
