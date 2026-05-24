import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-12">
      <section className="mx-auto max-w-7xl">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          About Puzzle Market
        </p>

        <h1 className="mt-5 max-w-5xl text-5xl md:text-7xl font-black leading-none">
          Hidden puzzle pieces with real ownership.
        </h1>

        <p className="mt-7 max-w-3xl text-lg text-zinc-400">
          Puzzle Market is a collector marketplace where players assemble hidden images, discover missing pieces, buy the exact missing piece from its current owner, and later resell that piece at their own price.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            [
              "Pick A Puzzle",
              "Start from a public puzzle board. The final image is hidden until you assemble the small pieces.",
            ],
            [
              "Buy The Missing Piece",
              "Only one or two pieces are missing. The marketplace opens the exact piece needed for that puzzle.",
            ],
            [
              "Own And Resell",
              "After purchase, the piece belongs to the buyer. They can keep it or list it for resale.",
            ],
          ].map(([title, body]) => (
            <div
              key={title}
              className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7"
            >
              <h2 className="text-3xl font-black">
                {title}
              </h2>

              <p className="mt-5 text-zinc-400">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[32px] border border-cyan-400/20 bg-cyan-400/[0.04] p-8">
          <h2 className="text-3xl font-black">
            Privacy First
          </h2>

          <p className="mt-4 max-w-3xl text-zinc-400">
            Public pages show usernames and collector identities only. Emails, payment details and the platform owner identity are not shown to other users.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-2xl bg-cyan-400 px-7 py-4 font-black text-black transition hover:bg-cyan-300"
          >
            Choose Puzzle
          </Link>

          <Link
            href="/marketplace"
            className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 font-black transition hover:border-cyan-400"
          >
            Open Marketplace
          </Link>
        </div>
      </section>
    </main>
  );
}
