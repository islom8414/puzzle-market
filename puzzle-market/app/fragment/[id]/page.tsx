import Link from "next/link";

export default function FragmentPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <section className="max-w-xl border border-cyan-400/20 rounded-[32px] bg-white/[0.03] p-8 text-center">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Legacy Listing Closed
        </p>

        <h1 className="mt-4 text-4xl font-black">
          This old fragment page is disabled.
        </h1>

        <p className="mt-4 text-zinc-400">
          Secure piece purchases now happen only through the verified
          marketplace listing flow.
        </p>

        <Link
          href="/marketplace"
          className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
        >
          Open Marketplace
        </Link>
      </section>
    </main>
  );
}
