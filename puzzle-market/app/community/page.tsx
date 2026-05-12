"use client";

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-x-hidden px-4 md:px-6 py-6">

      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full"></div>

      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <div>

            <span className="bg-cyan-400/15 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
              Live Community
            </span>

            <h1 className="text-4xl md:text-6xl font-black mt-4 leading-none">
              Puzzle Community
            </h1>

            <p className="text-zinc-400 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
              Trade discussions, rare puzzle alerts, collector rankings and live marketplace activity.
            </p>

          </div>

          <a
            href="/marketplace"
            className="bg-cyan-400 hover:bg-cyan-300 text-black px-5 py-3 rounded-2xl font-black text-sm transition w-fit"
          >
            Marketplace →
          </a>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5">

            <p className="text-zinc-500 text-xs">
              Online Users
            </p>

            <h2 className="text-3xl md:text-4xl font-black mt-3 text-cyan-400">
              4.8K
            </h2>

          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5">

            <p className="text-zinc-500 text-xs">
              Trades Today
            </p>

            <h2 className="text-3xl md:text-4xl font-black mt-3">
              982
            </h2>

          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5">

            <p className="text-zinc-500 text-xs">
              Rare Alerts
            </p>

            <h2 className="text-3xl md:text-4xl font-black mt-3">
              24
            </h2>

          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5">

            <p className="text-zinc-500 text-xs">
              Community Rank
            </p>

            <h2 className="text-3xl md:text-4xl font-black mt-3">
              #12
            </h2>

          </div>

        </div>

        {/* MAIN GRID */}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-10">

          {/* POSTS */}

          <div className="space-y-5">

            {[1, 2, 3, 4].map((post) => (

              <div
                key={post}
                className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5 md:p-6 hover:border-cyan-400 transition-all duration-300"
              >

                {/* USER */}

                <div className="flex items-center justify-between gap-4">

                  <div className="flex items-center gap-4">

                    <div className="w-12 h-12 rounded-full bg-cyan-400 flex items-center justify-center text-black font-black">
                      P
                    </div>

                    <div>

                      <h3 className="font-black text-sm md:text-base">
                        PuzzleHunter_{post}
                      </h3>

                      <p className="text-zinc-500 text-xs mt-1">
                        2 min ago
                      </p>

                    </div>

                  </div>

                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                    Online
                  </span>

                </div>

                {/* CONTENT */}

                <p className="text-zinc-300 mt-5 leading-relaxed text-sm md:text-base">
                  Looking for rare missing pieces from Dragon Fantasy collection. 
                  Willing to trade premium hidden fragments and exclusive marketplace collectibles.
                </p>

                {/* ACTIONS */}

                <div className="flex items-center gap-6 mt-6 text-sm text-zinc-500">

                  <button className="hover:text-cyan-400 transition">
                    ❤️ Like
                  </button>

                  <button className="hover:text-cyan-400 transition">
                    💬 Reply
                  </button>

                  <button className="hover:text-cyan-400 transition">
                    🔁 Share
                  </button>

                </div>

              </div>

            ))}

          </div>

          {/* SIDEBAR */}

          <div className="space-y-6">

            {/* TOP COLLECTORS */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5">

              <h2 className="text-xl font-black">
                Top Collectors
              </h2>

              <div className="space-y-4 mt-5">

                {[
                  "Player_245",
                  "PuzzleMaster",
                  "ShadowUser",
                  "RareCollector",
                ].map((user, index) => (

                  <div
                    key={user}
                    className="flex items-center justify-between"
                  >

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center text-black font-black text-sm">
                        {user.charAt(0)}
                      </div>

                      <div>

                        <h3 className="font-bold text-sm">
                          {user}
                        </h3>

                        <p className="text-zinc-500 text-[11px] mt-1">
                          Rank #{index + 1}
                        </p>

                      </div>

                    </div>

                    <span className="text-cyan-400 text-sm font-black">
                      VIP
                    </span>

                  </div>

                ))}

              </div>

            </div>

            {/* LIVE FEED */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5">

              <h2 className="text-xl font-black">
                Live Feed
              </h2>

              <div className="space-y-4 mt-5">

                {[1, 2, 3].map((item) => (

                  <div
                    key={item}
                    className="bg-white/5 rounded-2xl p-4"
                  >

                    <p className="text-sm leading-relaxed">
                      <span className="text-cyan-400 font-bold">
                        PuzzleHunter
                      </span>{" "}
                      purchased rare Dragon Fantasy piece.
                    </p>

                    <p className="text-zinc-500 text-[11px] mt-2">
                      1 min ago
                    </p>

                  </div>

                ))}

              </div>

            </div>

            {/* TRENDING */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5">

              <h2 className="text-xl font-black">
                Trending
              </h2>

              <div className="space-y-3 mt-5">

                {[
                  "Dragon Fantasy",
                  "Book Kingdom",
                  "Dark Desert",
                ].map((item) => (

                  <div
                    key={item}
                    className="bg-white/5 border border-white/5 rounded-2xl p-4 hover:border-cyan-400 transition"
                  >

                    <h3 className="font-bold">
                      {item}
                    </h3>

                    <p className="text-zinc-500 text-xs mt-1">
                      Marketplace collection
                    </p>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}