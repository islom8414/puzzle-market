import Link from "next/link";

import {
  PRIVACY_UPDATED,
  TERMS_SECTIONS,
  TERMS_SUMMARY,
  TERMS_TITLE,
  TERMS_VERSION,
} from "@/lib/legal";

export default function TermsPage() {
  return (
    <main className="legal-page min-h-screen bg-black px-4 py-10 text-white md:px-6 md:py-16">
      <section className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-zinc-950/90 p-6 backdrop-blur-xl md:rounded-[36px] md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
          Legal
        </p>

        <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
          {TERMS_TITLE}
        </h1>

        <p className="mt-5 text-sm text-zinc-500">
          Version {TERMS_VERSION}. Privacy Policy updated {PRIVACY_UPDATED}.
          This page is a practical marketplace disclosure, not personal legal,
          tax, financial, or investment advice.
        </p>

        <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
          <h2 className="text-xl font-black text-cyan-300">
            Key Points
          </h2>
          <ul className="mt-4 space-y-3 leading-relaxed text-zinc-300">
            {TERMS_SUMMARY.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 space-y-5">
          {TERMS_SECTIONS.map((section) => (
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

        <div className="mt-8 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
          <h2 className="text-xl font-black text-cyan-300">
            Short acceptance summary
          </h2>
          <p className="mt-3 leading-relaxed text-zinc-300">
            By creating an account, signing in, buying, selling, bidding,
            uploading, or withdrawing, you confirm that you understand the risks
            and accept these terms.
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
        >
          Back Home
        </Link>

        <Link
          href="/privacy"
          className="ml-3 mt-8 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4 font-black text-white transition hover:border-cyan-400"
        >
          Privacy Policy
        </Link>
      </section>
    </main>
  );
}
