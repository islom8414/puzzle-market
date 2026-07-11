import Link from "next/link";

import { HomePuzzleGrid } from "@/components/home-puzzle-grid";
import { HomeTrustStats } from "@/components/home-trust-stats";
import { loadHomeCollections } from "@/lib/home-collections";

export const dynamic =
  "force-dynamic";

const flowSteps = [
  "Buy",
  "Own",
  "List",
  "Resell",
] as const;

const howItWorks = [
  {
    step: "01",
    title: "Choose a Collection",
    body: "Browse available artwork and select a collection you understand and like.",
  },
  {
    step: "02",
    title: "Buy a Fragment",
    body: "Purchase an available fragment at the displayed price.",
  },
  {
    step: "03",
    title: "Own It",
    body: "The fragment and verified ownership record appear in your account.",
  },
  {
    step: "04",
    title: "List for Resale",
    body: "Choose your listing price and offer the fragment to other collectors.",
  },
  {
    step: "05",
    title: "Complete or Trade",
    body: "Complete collections, keep your fragment or sell it when another collector accepts the offer.",
  },
] as const;

const faq = [
  {
    question: "What exactly am I buying?",
    answer:
      "You buy a limited puzzle fragment connected to a specific collection. After purchase, it is shown in your account with its ownership record.",
  },
  {
    question: "Is the fragment digital or physical?",
    answer:
      "Puzzle Market currently presents fragments as digital collectible assets. Do not assume physical delivery unless a checkout page explicitly says delivery is included.",
  },
  {
    question: "How is ownership recorded?",
    answer:
      "Ownership is tied to your account and the fragment record in the marketplace database. Public ownership records display usernames only, while private details remain hidden.",
  },
  {
    question: "Can I resell my fragment?",
    answer:
      "Yes. If you own a supported fragment, you can list it for resale at your chosen price.",
  },
  {
    question: "Who sets the resale price?",
    answer:
      "The owner sets the listing price. Another collector must choose to buy it before a resale is completed.",
  },
  {
    question: "How does Puzzle Market earn money?",
    answer:
      "Puzzle Market takes a 10% marketplace fee from each completed resale. Any payment processor charges are shown separately where they apply.",
  },
  {
    question: "How and when do sellers receive payouts?",
    answer:
      "Seller payouts are supported through Stripe where available. In supported alternative regions, eligible card payouts can be arranged through Puzzle Market support after verification.",
  },
  {
    question: "Can a fragment lose value?",
    answer:
      "Yes. Collectible prices can rise or fall based on rarity, availability and buyer demand.",
  },
  {
    question: "Is profit guaranteed?",
    answer:
      "No. Resale depends on buyer demand, listing price, rarity and market activity.",
  },
  {
    question: "What happens if no one buys my listing?",
    answer:
      "Your listing remains unsold until a collector accepts it. Depending on the seller tools available, you may adjust or remove the listing.",
  },
  {
    question: "Can more copies be created?",
    answer:
      "Each collection displays its visible supply information before you choose a fragment. Always check the collection record before buying.",
  },
  {
    question: "Can I request a refund?",
    answer:
      "Refund rules depend on the purchase type, payment status and posted policy. Review the refund policy before checkout.",
  },
  {
    question: "How is my payment protected?",
    answer:
      "Ownership transfers after the payment is securely confirmed. If payment fails, the fragment remains available according to the marketplace record.",
  },
] as const;

const resaleScenarios = [
  {
    title: "Higher demand",
    body: "A collector accepts a higher listing price.",
  },
  {
    title: "Similar demand",
    body: "The fragment resells near the original purchase price.",
  },
  {
    title: "No buyer yet",
    body: "The listing remains active until another collector accepts it.",
  },
] as const;

export default async function HomePage() {
  const initialCollections =
    await loadHomeCollections();

  return (
    <main className="min-h-screen overflow-hidden text-white">
      <section className="relative px-4 pb-14 pt-10 md:px-6 md:pb-20 md:pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_34%)]" />

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.82fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 md:text-sm">
              THE COLLECTIBLE PUZZLE MARKETPLACE
            </p>

            <h1 className="translate-safe-title mt-5 font-black">
              Own Rare Puzzle Fragments. Trade Them With Collectors.
            </h1>

            <p className="translate-safe-copy mt-6 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Buy limited puzzle fragments, keep verified ownership in your
              account, complete exclusive collections and list your pieces for
              resale on the marketplace.
            </p>

            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] p-4 text-sm leading-relaxed text-zinc-300">
              Puzzle Market takes a 10% marketplace fee from each completed
              resale. Sellers can receive payouts through Stripe where
              available, with alternative card payout support in eligible
              regions after verification.
            </div>

            <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
              <Link
                href="/marketplace"
                className="translate-safe-action rounded-2xl bg-cyan-400 px-6 py-4 text-center text-base font-black text-black transition hover:bg-cyan-300 md:px-8"
              >
                Explore Live Fragments
              </Link>

              <Link
                href="/#how-it-works"
                className="translate-safe-action rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-base font-black transition hover:border-cyan-400"
              >
                See How It Works
              </Link>
            </div>

            <Link
              href="/#faq"
              className="mt-4 inline-flex text-sm font-bold text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline"
            >
              Learn about risks and fees
            </Link>

            <HomeTrustStats />
          </div>

          <div className="min-w-0 rounded-[28px] border border-white/10 bg-zinc-950/85 p-4 shadow-2xl shadow-cyan-950/20 md:p-5">
            <div className="rounded-3xl border border-cyan-400/20 bg-black p-5">
              <div className="flex flex-wrap gap-2">
                {flowSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.14em] ${
                      index === 0
                        ? "bg-cyan-400 text-black"
                        : "border border-white/10 bg-white/[0.04] text-zinc-300"
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                    Example market scenario
                  </p>
                  <h2 className="mt-3 text-4xl font-black md:text-5xl">
                    $1 to $25 listing
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    A collector buys a fragment, owns it in their account and
                    can choose a resale listing price. The marketplace fee is
                    10% on each completed resale.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Buy", "$1"],
                    ["Hold", "Owner"],
                    ["List", "$25"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">
                        {label}
                      </p>
                      <p className="mt-2 text-xl font-black text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 px-4 pb-20 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 md:text-sm">
                How Puzzle Market works
              </p>
              <h2 className="translate-safe-heading mt-4 font-black">
                Understand the full path before you buy.
              </h2>
              <p className="translate-safe-copy mt-5 leading-relaxed text-zinc-400">
                The site is built around ownership and resale, not mystery
                promises. You see the collection, the available fragment, the
                price and the resale rules before making a purchase.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {howItWorks.map((item) => (
                <article
                  key={item.step}
                  className="rounded-2xl border border-white/10 bg-zinc-950 p-5"
                >
                  <p className="text-sm font-black text-cyan-400">
                    {item.step}
                  </p>
                  <h3 className="mt-4 text-lg font-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-relaxed text-zinc-300 md:flex-row md:items-center md:justify-between">
            <p>
              Puzzle Market keeps resale rules clear: sellers choose the
              listing price, and the marketplace fee is 10% only when a resale
              is completed.
            </p>
            <Link
              href="/marketplace"
              className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center font-black text-white transition hover:border-cyan-400"
            >
              View a Real Example
            </Link>
          </div>
        </div>
      </section>

      <section
        id="choose-puzzle"
        className="scroll-mt-24 px-4 pb-20 md:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 md:text-sm">
                Start with a real collection
              </p>
              <h2 className="translate-safe-heading mt-3 font-black">
                Choose a puzzle and inspect its missing pieces.
              </h2>
            </div>

            <Link
              href="/marketplace"
              className="translate-safe-action shrink-0 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center font-black transition hover:border-cyan-400"
            >
              Open Marketplace
            </Link>
          </div>

          <HomePuzzleGrid
            initialPuzzles={initialCollections}
          />
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 px-4 pb-24 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-white/10 bg-zinc-950 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
              Resale example
            </p>
            <h2 className="mt-4 text-3xl font-black md:text-5xl">
              You control the listing price. Buyers control demand.
            </h2>
            <p className="mt-5 leading-relaxed text-zinc-400">
              You choose the asking price. Buyers decide whether and when it
              sells.
            </p>
            <p className="mt-4 text-sm font-bold text-amber-200">
              Resale and profit are not guaranteed.
            </p>
            <Link
              href="/sell"
              className="mt-7 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300"
            >
              See Seller Tools
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
            <div className="grid gap-3">
              {resaleScenarios.map((scenario) => (
                <div
                  key={scenario.title}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <p className="text-sm font-black text-cyan-300">
                    {scenario.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {scenario.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-zinc-500">
              Puzzle Market takes a 10% marketplace fee from completed resales,
              and payout options depend on seller verification and regional
              payment support.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-24 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 md:text-sm">
              Questions before buying
            </p>
            <h2 className="translate-safe-heading mt-3 font-black">
              Clear answers convert better than hype.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {faq.map((item) => (
              <article
                key={item.question}
                className="rounded-2xl border border-white/10 bg-zinc-950 p-5"
              >
                <h3 className="text-lg font-black">{item.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">
                  {item.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 p-3 backdrop-blur-xl md:hidden">
        <Link
          href="/marketplace"
          className="block rounded-2xl bg-cyan-400 px-5 py-4 text-center font-black text-black"
        >
          Explore Live Fragments
        </Link>
      </div>
    </main>
  );
}
