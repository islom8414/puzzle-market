"use client";

const collectors = [

  {
    name: "ShadowUser",
    rank: 1,
    wealth: "$92,400",
    fragments: 182,
    rare: 12,
  },

  {
    name: "CryptoWolf",
    rank: 2,
    wealth: "$81,200",
    fragments: 160,
    rare: 9,
  },

  {
    name: "PuzzleMaster",
    rank: 3,
    wealth: "$73,800",
    fragments: 149,
    rare: 7,
  },

  {
    name: "NightCollector",
    rank: 4,
    wealth: "$61,500",
    fragments: 132,
    rare: 6,
  },

  {
    name: "PixelHunter",
    rank: 5,
    wealth: "$48,300",
    fragments: 108,
    rare: 5,
  },

];

export default function LeaderboardPage() {

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-6xl mx-auto">

        {/* HERO */}

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-wider text-sm">
            Marketplace Ranking
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3">
            Top Collectors
          </h1>

          <p className="text-zinc-500 mt-4">
            Richest and most active fragment collectors.
          </p>

        </div>

        {/* TOP CARD */}

        <div className="bg-gradient-to-br from-cyan-400 to-cyan-300 text-black rounded-3xl p-8 mb-10">

          <p className="font-black uppercase text-sm">
            #1 Collector
          </p>

          <h2 className="text-5xl font-black mt-3">
            {collectors[0].name}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

            <div>

              <p className="text-black/60 text-sm">
                Net Worth
              </p>

              <h3 className="text-3xl font-black mt-2">
                {collectors[0].wealth}
              </h3>

            </div>

            <div>

              <p className="text-black/60 text-sm">
                Owned Fragments
              </p>

              <h3 className="text-3xl font-black mt-2">
                {collectors[0].fragments}
              </h3>

            </div>

            <div>

              <p className="text-black/60 text-sm">
                Legendary Pieces
              </p>

              <h3 className="text-3xl font-black mt-2">
                {collectors[0].rare}
              </h3>

            </div>

          </div>

        </div>

        {/* TABLE */}

        <div className="space-y-5">

          {collectors.map((collector) => (

            <div
              key={collector.rank}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-5 hover:border-cyan-400 transition"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-center gap-5">

                  <div className="w-16 h-16 rounded-2xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black">
                    #{collector.rank}
                  </div>

                  <div>

                    <h2 className="text-3xl font-black">
                      {collector.name}
                    </h2>

                    <p className="text-zinc-500 mt-1">
                      Premium Marketplace Collector
                    </p>

                  </div>

                </div>

                <div className="grid grid-cols-3 gap-8">

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Wealth
                    </p>

                    <h3 className="text-cyan-400 text-2xl font-black mt-2">
                      {collector.wealth}
                    </h3>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Fragments
                    </p>

                    <h3 className="text-2xl font-black mt-2">
                      {collector.fragments}
                    </h3>

                  </div>

                  <div>

                    <p className="text-zinc-500 text-sm">
                      Legendary
                    </p>

                    <h3 className="text-2xl font-black mt-2">
                      {collector.rare}
                    </h3>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );
}