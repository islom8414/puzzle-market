import Link from "next/link";

export default function ActivityPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white">
      <section className="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-zinc-950 p-8">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
          Private Launch Mode
        </p>

        <h1 className="mt-4 text-4xl font-black md:text-6xl">
          Public activity is hidden
        </h1>

        <p className="mt-5 max-w-2xl text-zinc-400">
          Test trades and legacy activity were removed before launch. Purchases,
          wallet events and support messages stay private to the account owner
          and the platform admin.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
          >
            Open Marketplace
          </Link>

          <Link
            href="/profile"
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-black"
          >
            My Profile
          </Link>
        </div>
      </section>
    </main>
  );
}
