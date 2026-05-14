"use client";

import { useParams } from "next/navigation";

export default function FragmentPage() {

  const params = useParams();

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_30%)]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16">

        {/* HERO */}

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-xs">
            Premium Fragment
          </p>

          <h1 className="text-5xl md:text-7xl font-black mt-5">
            Fragment #{params.id}
          </h1>

          <p className="text-zinc-500 text-lg mt-6 max-w-2xl leading-relaxed">
            Exclusive realtime collectible fragment powered by premium cloud marketplace technology.
          </p>

        </div>

        {/* MAIN */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* IMAGE */}

          <div className="relative group rounded-[40px] overflow-hidden border border-white/10 bg-zinc-950">

            <img
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1400&auto=format&fit=crop"
              alt="Fragment"
              className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

            {/* BADGES */}

            <div className="absolute top-6 left-6 flex gap-3">

              <div className="bg-cyan-400 text-black px-5 py-2 rounded-full text-sm font-black">
                LIVE
              </div>

              <div className="bg-purple-500 text-white px-5 py-2 rounded-full text-sm font-black">
                EPIC
              </div>

            </div>

            {/* FLOAT PRICE */}

            <div className="absolute bottom-6 right-6 bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-4">

              <p className="text-zinc-500 text-xs">
                CURRENT PRICE
              </p>

              <h2 className="text-cyan-400 text-5xl font-black mt-2">
                $88
              </h2>

            </div>

          </div>

          {/* INFO */}

          <div className="space-y-6">

            {/* OWNER */}

            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm">
                Current Owner
              </p>

              <h2 className="text-3xl font-black mt-3">
                {
                  localStorage.getItem(
                    "puzzle-username"
                  ) || "ShadowUser"
                }
              </h2>

            </div>

            {/* STATS */}

            <div className="grid grid-cols-2 gap-5">

              <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7 backdrop-blur-xl">

                <p className="text-zinc-500 text-sm">
                  Rarity
                </p>

                <h2 className="text-purple-400 text-4xl font-black mt-3">
                  Epic
                </h2>

              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7 backdrop-blur-xl">

                <p className="text-zinc-500 text-sm">
                  Status
                </p>

                <h2 className="text-green-400 text-4xl font-black mt-3">
                  LIVE
                </h2>

              </div>

            </div>

            {/* DESCRIPTION */}

            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7 backdrop-blur-xl">

              <p className="text-zinc-500 text-sm uppercase tracking-wider">
                Fragment Description
              </p>

              <p className="text-lg text-zinc-300 leading-relaxed mt-5">
                Ultra premium collectible fragment with realtime cloud ownership synchronization,
                luxury rarity classification and advanced marketplace trading integration.
              </p>

            </div>

            {/* BUTTONS */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <button className="bg-cyan-400 hover:bg-cyan-300 text-black font-black py-5 rounded-[28px] text-lg transition duration-300">
                Buy Fragment
              </button>

              <button className="bg-white/[0.03] border border-white/10 hover:border-cyan-400 font-black py-5 rounded-[28px] text-lg transition duration-300">
                Add Wishlist
              </button>

            </div>

            {/* EXTRA */}

            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7 backdrop-blur-xl">

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-zinc-500 text-sm">
                    Marketplace Activity
                  </p>

                  <h2 className="text-3xl font-black mt-3">
                    24/7 Live
                  </h2>

                </div>

                <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>

  );
}