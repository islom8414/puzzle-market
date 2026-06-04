import Link from "next/link";

import { HomeTrustStats } from "@/components/home-trust-stats";
import { HomePuzzleGrid } from "@/components/home-puzzle-grid";
import { CHOOSE_PUZZLE_HREF } from "@/lib/site-links";

export default function HomePage() {

  return (

    <main className="min-h-screen text-white overflow-hidden">

      {/* HERO */}

      <section className="relative px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-28">

        {/* BG */}

        <div className="absolute inset-0 overflow-hidden -z-10">

          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full"></div>

          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-3xl rounded-full"></div>

        </div>

        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] gap-12 2xl:gap-16 items-center">

            {/* LEFT */}

            <div className="min-w-0">

              <p className="text-cyan-400 font-black uppercase tracking-[0.18em] md:tracking-[0.25em] text-xs md:text-sm">
                PREMIUM FRAGMENT MARKETPLACE
              </p>

              <h1 className="translate-safe-title font-black mt-5 md:mt-6">
                Collect Missing Puzzle Pieces
              </h1>

              <p className="translate-safe-copy text-zinc-400 text-base md:text-lg leading-relaxed mt-6 md:mt-8">

                Trade rare hidden puzzle fragments, complete premium artwork collections,
                unlock legendary rewards and build your collector empire.

              </p>

              {/* BUTTONS */}

              <div className="grid gap-3 sm:flex sm:flex-wrap sm:gap-4 mt-8 md:mt-10">

                <Link
                  href="/marketplace"
                  className="translate-safe-action bg-cyan-400 hover:bg-cyan-300 text-black font-black px-6 md:px-8 py-4 rounded-2xl transition text-center text-base md:text-lg"
                >
                  Explore Marketplace
                </Link>

                <Link
                  href={CHOOSE_PUZZLE_HREF}
                  className="translate-safe-action bg-white/5 border border-white/10 hover:border-cyan-400 font-black px-6 md:px-8 py-4 rounded-2xl transition text-center text-base md:text-lg"
                >
                  Choose A Puzzle
                </Link>

              </div>

              <HomeTrustStats />

            </div>

            {/* RIGHT */}

            <div className="relative min-w-0 mt-4 2xl:mt-0">

              <div className="grid grid-cols-3 gap-3 sm:gap-4 rotate-3 sm:rotate-6 max-w-md mx-auto xl:max-w-none">

                {Array.from({ length: 9 }).map((_, index) => (

                  <div
                    key={index}
                    className={`
                      aspect-square rounded-2xl sm:rounded-3xl border

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

              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 md:p-6 w-[min(320px,calc(100vw-2rem))]">

                <p className="text-zinc-500 text-sm">
                  Verified Ownership
                </p>

                <h3 className="text-xl md:text-2xl font-black mt-3 leading-tight">
                  Launch Ready
                </h3>

                <div className="flex items-center justify-between mt-5">

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Piece
                    </p>

                    <h4 className="text-lg md:text-xl font-black leading-tight">
                      Hidden
                    </h4>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Status
                    </p>

                    <h4 className="text-cyan-400 text-lg md:text-xl font-black leading-tight">
                      Online
                    </h4>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section
        id="choose-puzzle"
        className="px-4 md:px-6 pb-24 scroll-mt-24"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div className="min-w-0">
              <p className="text-cyan-400 font-black uppercase tracking-[0.18em] text-xs md:text-sm">
                Start Collecting
              </p>

              <h2 className="translate-safe-heading font-black mt-3 md:mt-4">
                Choose A Puzzle
              </h2>
            </div>

            <Link
              href="/marketplace"
              className="translate-safe-action shrink-0 bg-white/5 border border-white/10 hover:border-cyan-400 font-black px-6 py-4 rounded-2xl transition text-center"
            >
              Missing Pieces Market
            </Link>
          </div>

          <HomePuzzleGrid />
        </div>
      </section>

      {/* FEATURES */}

      <section className="px-4 md:px-6 pb-24">

        <div className="max-w-7xl mx-auto">

          <div className="text-center mb-16">

            <p className="text-cyan-400 font-black uppercase tracking-[0.18em] text-xs md:text-sm">
              PLATFORM FEATURES
            </p>

            <h2 className="translate-safe-heading font-black mt-4 md:mt-5">
              Built For Collectors
            </h2>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* CARD */}

            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8">

              <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black">
                ⚡
              </div>

              <h3 className="text-2xl md:text-3xl font-black mt-7 md:mt-8">
                Live Marketplace
              </h3>

              <p className="text-zinc-500 leading-relaxed mt-5">
                Trade rare missing puzzle fragments in a live collector economy.
              </p>

            </div>

            {/* CARD */}

            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8">

              <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black">
                🧩
              </div>

              <h3 className="text-2xl md:text-3xl font-black mt-7 md:mt-8">
                Puzzle Progression
              </h3>

              <p className="text-zinc-500 leading-relaxed mt-5">
                Complete collections and unlock premium hidden artwork rewards.
              </p>

            </div>

            {/* CARD */}

            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8">

              <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black">
                👑
              </div>

              <h3 className="text-2xl md:text-3xl font-black mt-7 md:mt-8">
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
