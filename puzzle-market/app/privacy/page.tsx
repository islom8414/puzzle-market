import Link from "next/link";

import {
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
  PRIVACY_UPDATED,
} from "@/lib/legal";

export default function PrivacyPage() {
  return (
    <main className="legal-page min-h-screen bg-black px-4 py-10 text-white md:px-6 md:py-16">
      <section className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-zinc-950/90 p-6 backdrop-blur-xl md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
          Privacy
        </p>

        <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
          {PRIVACY_TITLE}
        </h1>

        <p className="mt-5 text-sm leading-6 text-zinc-500">
          Updated {PRIVACY_UPDATED}. This policy explains how Puzzle Market
          handles account, marketplace, wallet, support, payout, and security
          data for the digital collectible marketplace.
        </p>

        <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
          <h2 className="text-xl font-black text-cyan-300">
            Short Privacy Promise
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-300">
            Public marketplace pages should use usernames and marketplace
            activity. Private emails, payout details, support conversations, and
            internal account data should stay protected behind authenticated
            account access.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {PRIVACY_SECTIONS.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-white/10 bg-black/40 p-5"
            >
              <h2 className="text-xl font-black text-white">
                {section.title}
              </h2>
              <p className="mt-3 leading-relaxed text-zinc-400">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/terms"
            className="inline-flex justify-center rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
          >
            Terms
          </Link>

          <Link
            href="/"
            className="inline-flex justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 font-black text-white transition hover:border-cyan-400"
          >
            Back Home
          </Link>
        </div>
      </section>
    </main>
  );
}
