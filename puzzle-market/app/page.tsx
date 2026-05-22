import Link from "next/link";

import { puzzles } from "@/data/puzzles";

export default function HomePage() {

  return (

    <main className="min-h-screen text-white overflow-hidden">

      {/* HERO */}

      <section className="relative px-4 md:px-6 pt-24 pb-28">

        {/* BG */}

        <div className="absolute inset-0 overflow-hidden -z-10">

          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full"></div>

          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-3xl rounded-full"></div>

        </div>

        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 items-center">

            {/* LEFT */}

            <div>

              <p className="text-cyan-400 font-black uppercase tracking-[0.25em] text-sm">
                PREMIUM FRAGMENT MARKETPLACE
              </p>

              <h1 className="text-5xl md:text-7xl font-black leading-[0.95] mt-6">

                Collect
                <br />

                Missing
                <br />

                Puzzle Pieces

              </h1>

              <p className="text-zinc-400 text-lg leading-relaxed mt-8 max-w-2xl">

                Trade rare hidden puzzle fragments, complete premium artwork collections,
                unlock legendary rewards and build your collector empire.

              </p>

              {/* BUTTONS */}

              <div className="flex flex-wrap gap-4 mt-10">

                <Link
                  href="/marketplace"
                  className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-8 py-4 rounded-2xl transition text-lg"
                >
                  Explore Marketplace
                </Link>

                <Link
                  href="/leaderboard"
                  className="bg-white/5 border border-white/10 hover:border-cyan-400 font-black px-8 py-4 rounded-2xl transition text-lg"
                >
                  Top Collectors
                </Link>

              </div>

              {/* STATS */}

              <div className="grid grid-cols-3 gap-5 mt-14">

                <div>

                  <h3 className="text-4xl font-black text-cyan-400">
                    8K+
                  </h3>

                  <p className="text-zinc-500 mt-2 text-sm">
                    Rare Fragments
                  </p>

                </div>

                <div>

                  <h3 className="text-4xl font-black">
                    2.4M
                  </h3>

                  <p className="text-zinc-500 mt-2 text-sm">
                    Market Volume
                  </p>

                </div>

                <div>

                  <h3 className="text-4xl font-black">
                    24K
                  </h3>

                  <p className="text-zinc-500 mt-2 text-sm">
                    Collectors
                  </p>

                </div>

              </div>

            </div>

            {/* RIGHT */}

            <div className="relative">

              <div className="grid grid-cols-3 gap-4 rotate-6">

                {Array.from({ length: 9 }).map((_, index) => (

                  <div
                    key={index}
                    className={`
                      aspect-square rounded-3xl border

                      ${
                        index === 1 ||
                        index === 4 ||
                        index === 7
                          ? "bg-cyan-400 border-cyan-300 shadow-lg shadow-cyan-400/20"
                          : "bg-zinc-950 border-white/10"
                      }
                    `}
                  />

                ))}

              </div>

              {/* FLOATING CARD */}

              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 w-[320px]">

                <p className="text-zinc-500 text-sm">
                  Latest Legendary Sale
                </p>

                <h3 className="text-3xl font-black mt-3">
                  Dragon Fantasy
                </h3>

                <div className="flex items-center justify-between mt-5">

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Piece
                    </p>

                    <h4 className="text-2xl font-black">
                      #218
                    </h4>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Sold
                    </p>

                    <h4 className="text-cyan-400 text-2xl font-black">
                      $250
                    </h4>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="px-4 md:px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <p className="text-cyan-400 font-black uppercase tracking-widest text-sm">
                Start Collecting
              </p>

              <h2 className="text-4xl md:text-6xl font-black mt-4">
                Choose A Puzzle
              </h2>
            </div>

            <Link
              href="/marketplace"
              className="bg-white/5 border border-white/10 hover:border-cyan-400 font-black px-6 py-4 rounded-2xl transition text-center"
            >
              Missing Pieces Market
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {puzzles.map((puzzle) => (
              <Link
                key={puzzle.id}
                href={`/puzzle/${puzzle.slug}`}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 transition hover:-translate-y-1 hover:border-cyan-400"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={puzzle.image}
                    alt={puzzle.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  <div className="absolute left-4 top-4 rounded-full bg-black/70 px-4 py-2 text-xs font-black text-cyan-400">
                    {puzzle.rarity}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-3xl font-black">
                    {puzzle.title}
                  </h3>

                  <p className="mt-3 text-sm text-zinc-500">
                    Open the hidden board, assemble pieces, then unlock the missing market piece.
                  </p>

                  <div className="mt-6 rounded-2xl bg-cyan-400 py-3 text-center font-black text-black">
                    Start Puzzle
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}

      <section className="px-4 md:px-6 pb-24">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <p className="text-cyan-400 font-black uppercase tracking-widest text-sm">
              PLATFORM FEATURES
            </p>

            <h2 className="text-4xl md:text-6xl font-black mt-5">
              Built For
              <br />
              Collectors
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* CARD */}

            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">

              <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black">
                ⚡
              </div>

              <h3 className="text-3xl font-black mt-8">
                Live Marketplace
              </h3>

              <p className="text-zinc-500 leading-relaxed mt-5">
                Trade rare missing puzzle fragments in a live collector economy.
              </p>

            </div>

            {/* CARD */}

            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">

              <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black">
                🧩
              </div>

              <h3 className="text-3xl font-black mt-8">
                Puzzle Progression
              </h3>

              <p className="text-zinc-500 leading-relaxed mt-5">
                Complete collections and unlock premium hidden artwork rewards.
              </p>

            </div>

            {/* CARD */}

            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">

              <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black">
                👑
              </div>

              <h3 className="text-3xl font-black mt-8">
                Collector Rankings
              </h3>

              <p className="text-zinc-500 leading-relaxed mt-5">
                Compete with top collectors and dominate the global marketplace.
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
