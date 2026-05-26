import Link from "next/link";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <section className="max-w-2xl rounded-[32px] border border-cyan-400/20 bg-white/[0.03] p-8 text-center">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Privacy First
        </p>

        <h1 className="mt-4 text-4xl md:text-6xl font-black">
          Leaderboard is paused for launch.
        </h1>

        <p className="mt-5 text-zinc-400">
          Rankings will return after they use public usernames only. Emails and
          account details will not be shown on public pages.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
        >
          Back Home
        </Link>
      </section>
    </main>
  );
}
