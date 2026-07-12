import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { formatUsd } from "@/lib/price-index";
import { loadPuzzleDetail } from "@/lib/puzzle-detail";

import PuzzleClient from "./PuzzleClient";

export const dynamic =
  "force-dynamic";

function canonicalPuzzleUrl(
  slug: string
) {
  return `https://www.puzzle-market.com/puzzle/${encodeURIComponent(slug)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const puzzle =
    await loadPuzzleDetail(id);

  const title = puzzle
    ? `${puzzle.title} | Puzzle Market`
    : "Puzzle Collection | Puzzle Market";
  const description = puzzle
    ? `${puzzle.title} is a ${puzzle.rarity || "Rare"} digital collectible puzzle collection on Puzzle Market. View available fragments, ownership details and current listing prices.`
    : "View digital collectible puzzle fragments on Puzzle Market.";

  return {
    title,
    description,
    alternates: {
      canonical:
        canonicalPuzzleUrl(id),
    },
    openGraph: {
      title,
      description,
      url: canonicalPuzzleUrl(id),
      type: "website",
      images: puzzle?.image_url
        ? [
            {
              url: puzzle.image_url,
              alt: puzzle.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: puzzle?.image_url
        ? [puzzle.image_url]
        : undefined,
    },
  };
}

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialPuzzle =
    await loadPuzzleDetail(id);
  const displayPuzzle =
    initialPuzzle || {
      title: "Puzzle Collection",
      slug: id,
      image_url:
        "/puzzle-market-cube-logo.png",
      rows: 4,
      columns: 4,
      missing_piece_index: null,
      missing_piece_count: 0,
      rarity: "Rare",
      category: "Other",
      active_listing_count: 0,
      lowest_price: null,
      current_price: null,
      available_fragments: [],
    };
  const totalSupply =
    displayPuzzle.rows *
    displayPuzzle.columns;
  const availableCount =
    displayPuzzle
      ?.active_listing_count || 0;
  const lowestPrice =
    displayPuzzle.lowest_price ??
    displayPuzzle.current_price ??
    null;
  const category =
    displayPuzzle.category || "Other";
  const availableFragments =
    displayPuzzle
      ?.available_fragments || [];
  const structuredData =
    initialPuzzle && lowestPrice
      ? {
          "@context":
            "https://schema.org",
          "@type": "Product",
          name: initialPuzzle.title,
          image: initialPuzzle.image_url,
          description:
            `${initialPuzzle.title} digital collectible puzzle fragments on Puzzle Market.`,
          category,
          offers: {
            "@type": "AggregateOffer",
            lowPrice: lowestPrice,
            priceCurrency: "USD",
            offerCount:
              availableCount,
            availability:
              availableCount > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }
      : null;

  return (
    <>
      <main
        className="bg-black text-white notranslate"
        translate="no"
        data-no-translation="true"
        data-linguise-ignore="true"
      >
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 md:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:items-center">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950">
              <Image
                src={displayPuzzle.image_url}
                alt={displayPuzzle.title}
                width={1200}
                height={900}
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="aspect-[4/3] h-auto w-full object-cover"
              />
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-black text-black">
                  Digital Collectible
                </span>
                <span className="rounded-full border border-white/10 bg-black/70 px-3 py-2 text-xs font-black text-white">
                  {displayPuzzle.rarity || "Rare"}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
                Puzzle Collection
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                {displayPuzzle.title}
              </h1>
              <p className="mt-5 max-w-2xl leading-relaxed text-zinc-300">
                Own verified digital fragments from this collection. Purchased fragments appear in your account, can be tracked as ownership records and can be listed for resale when seller tools are available.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  [
                    "Category",
                    category,
                  ],
                  [
                    "Rarity",
                    displayPuzzle.rarity ||
                      "Rare",
                  ],
                  [
                    "Total fragments",
                    String(totalSupply),
                  ],
                  [
                    "Available now",
                    String(
                      availableCount
                    ),
                  ],
                  [
                    "Starting price",
                    lowestPrice
                      ? formatUsd(
                          lowestPrice
                        )
                      : "Not listed",
                  ],
                  [
                    "Current price",
                    lowestPrice
                      ? formatUsd(
                          lowestPrice
                        )
                      : "Not listed",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-2 text-xl font-black">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm leading-relaxed text-zinc-300">
                Ownership is recorded to your Puzzle Market account after a confirmed purchase. Public pages use collector usernames, not private emails.
              </div>

              {availableFragments.length >
                0 && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-zinc-950 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
                    Available fragments
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {availableFragments.map(
                      (fragment) => (
                        <Link
                          key={
                            fragment.listing_id
                          }
                          href={`/marketplace?puzzle=${encodeURIComponent(id)}&piece=${fragment.piece_index}`}
                          className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-cyan-400"
                        >
                          <p className="text-sm font-black">
                            Fragment #
                            {
                              fragment.piece_index
                            }
                          </p>
                          <p className="mt-2 text-sm text-zinc-400">
                            {
                              fragment.sale_type
                            }{" "}
                            /{" "}
                            {formatUsd(
                              fragment.price
                            )}
                          </p>
                        </Link>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/marketplace?puzzle=${encodeURIComponent(id)}`}
                  className="rounded-2xl bg-cyan-400 px-6 py-4 text-center font-black text-black transition hover:bg-cyan-300"
                >
                  Explore Available Pieces
                </Link>
                {availableFragments[0] && (
                  <Link
                    href={`/marketplace?puzzle=${encodeURIComponent(id)}&piece=${availableFragments[0].piece_index}`}
                    className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-black transition hover:border-cyan-400"
                  >
                    Buy Available Fragment
                  </Link>
                )}
              </div>
            </div>
          </section>
      </main>

      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              structuredData
            ),
          }}
        />
      )}

      <PuzzleClient
        initialSlug={id}
        initialCatalogPuzzle={initialPuzzle}
      />
    </>
  );
}
