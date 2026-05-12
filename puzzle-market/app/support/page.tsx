"use client";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-x-hidden px-4 md:px-6 py-8">

      {/* BACKGROUND */}

      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className="absolute top-0 left-0 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full"></div>

        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full"></div>

      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* HERO */}

        <section>

          <span className="bg-cyan-400/15 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
            24/7 Marketplace Support
          </span>

          <h1 className="text-4xl md:text-6xl font-black mt-5 leading-none">
            Support Center
          </h1>

          <p className="text-zinc-400 text-sm md:text-lg mt-5 max-w-2xl leading-relaxed">
            Need help with marketplace trading, wallet connection or puzzle collections?
            Our premium support team is always online.
          </p>

        </section>

        {/* TOP CARDS */}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6">

            <p className="text-zinc-500 text-sm">
              Support Tickets
            </p>

            <h2 className="text-4xl font-black mt-3 text-cyan-400">
              1.2K
            </h2>

          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6">

            <p className="text-zinc-500 text-sm">
              Active Moderators
            </p>

            <h2 className="text-4xl font-black mt-3">
              48
            </h2>

          </div>

          <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6">

            <p className="text-zinc-500 text-sm">
              Avg Response Time
            </p>

            <h2 className="text-4xl font-black mt-3">
              2m
            </h2>

          </div>

        </section>

        {/* MAIN GRID */}

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 mt-12">

          {/* LEFT */}

          <div className="space-y-6">

            {/* HELP CARDS */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6 hover:border-cyan-400 transition-all">

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-cyan-400 flex items-center justify-center text-black text-2xl">
                  🧩
                </div>

                <div>

                  <h2 className="text-2xl font-black">
                    Marketplace Help
                  </h2>

                  <p className="text-zinc-400 mt-3 leading-relaxed">
                    Learn how to buy, trade and collect rare puzzle pieces
                    inside the premium marketplace ecosystem.
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6 hover:border-cyan-400 transition-all">

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-cyan-400 flex items-center justify-center text-black text-2xl">
                  🔐
                </div>

                <div>

                  <h2 className="text-2xl font-black">
                    Account Support
                  </h2>

                  <p className="text-zinc-400 mt-3 leading-relaxed">
                    Recover accounts, fix wallet connection issues
                    and restore marketplace inventory access.
                  </p>

                </div>

              </div>

            </div>

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6 hover:border-cyan-400 transition-all">

              <div className="flex items-start gap-4">

                <div className="w-14 h-14 rounded-2xl bg-cyan-400 flex items-center justify-center text-black text-2xl">
                  🚨
                </div>

                <div>

                  <h2 className="text-2xl font-black">
                    Report Scam
                  </h2>

                  <p className="text-zinc-400 mt-3 leading-relaxed">
                    Report suspicious users, fake collections
                    or unauthorized marketplace activity.
                  </p>

                </div>

              </div>

            </div>

            {/* FAQ */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6">

              <h2 className="text-3xl font-black">
                FAQ
              </h2>

              <div className="space-y-5 mt-8">

                {[
                  "How do I buy puzzle pieces?",
                  "How do I connect wallet?",
                  "How can I sell collections?",
                  "How do I recover my inventory?",
                ].map((item) => (

                  <div
                    key={item}
                    className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-cyan-400 transition"
                  >

                    <div className="flex items-center justify-between">

                      <h3 className="font-bold text-sm md:text-base">
                        {item}
                      </h3>

                      <span className="text-cyan-400 text-xl">
                        +
                      </span>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* RIGHT SIDEBAR */}

          <div className="space-y-6">

            {/* LIVE SUPPORT */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6">

              <div className="flex items-center justify-between">

                <h2 className="text-2xl font-black">
                  Live Support
                </h2>

                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                  Online
                </span>

              </div>

              <p className="text-zinc-400 mt-4 text-sm leading-relaxed">
                Our marketplace moderators are currently available for live assistance.
              </p>

              <button className="w-full mt-6 bg-cyan-400 hover:bg-cyan-300 text-black font-black py-3 rounded-2xl transition">
                Open Live Chat
              </button>

            </div>

            {/* CONTACT */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6">

              <h2 className="text-2xl font-black">
                Contact Team
              </h2>

              <div className="space-y-4 mt-6">

                <div className="bg-white/5 rounded-2xl p-4">

                  <p className="text-zinc-500 text-xs">
                    Email
                  </p>

                  <h3 className="font-bold mt-2">
                    support@puzzlemarket.io
                  </h3>

                </div>

                <div className="bg-white/5 rounded-2xl p-4">

                  <p className="text-zinc-500 text-xs">
                    Discord
                  </p>

                  <h3 className="font-bold mt-2">
                    Puzzle Market Official
                  </h3>

                </div>

                <div className="bg-white/5 rounded-2xl p-4">

                  <p className="text-zinc-500 text-xs">
                    Telegram
                  </p>

                  <h3 className="font-bold mt-2">
                    @PuzzleMarketLive
                  </h3>

                </div>

              </div>

            </div>

            {/* STATUS */}

            <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-6">

              <h2 className="text-2xl font-black">
                System Status
              </h2>

              <div className="space-y-4 mt-6">

                <div className="flex items-center justify-between">

                  <span className="text-zinc-400">
                    Marketplace
                  </span>

                  <span className="text-green-400 font-bold">
                    Operational
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-zinc-400">
                    Wallet Service
                  </span>

                  <span className="text-green-400 font-bold">
                    Online
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-zinc-400">
                    Trading Engine
                  </span>

                  <span className="text-green-400 font-bold">
                    Stable
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}