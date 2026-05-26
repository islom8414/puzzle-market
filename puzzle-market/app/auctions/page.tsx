import Link from "next/link";

export default function AuctionsPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <section className="max-w-2xl rounded-[32px] border border-cyan-400/20 bg-white/[0.03] p-8 text-center">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Coming Later
        </p>

        <h1 className="mt-4 text-4xl md:text-6xl font-black">
          Auctions are disabled.
        </h1>

        <p className="mt-5 text-zinc-400">
          Direct piece ownership and resale are the launch flow. Auctions can be
          added later after the wallet and withdrawal system is fully audited.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
        >
          Choose Puzzle
        </Link>
      </section>
    </main>
  );
}
