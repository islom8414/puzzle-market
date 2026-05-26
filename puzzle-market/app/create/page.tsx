import Link from "next/link";

export default function CreatePage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <section className="max-w-2xl rounded-[32px] border border-cyan-400/20 bg-white/[0.03] p-8 text-center">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Owner Uploads Only
        </p>

        <h1 className="mt-4 text-4xl md:text-6xl font-black">
          Public puzzle creation is closed.
        </h1>

        <p className="mt-5 text-zinc-400">
          New official puzzle collections will be added through a protected
          owner workflow. Collectors can buy, own, and resell pieces they
          already purchased.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/"
            className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
          >
            Choose Puzzle
          </Link>

          <Link
            href="/sell"
            className="rounded-2xl border border-white/15 px-6 py-4 font-black"
          >
            Resell My Pieces
          </Link>
        </div>
      </section>
    </main>
  );
}
