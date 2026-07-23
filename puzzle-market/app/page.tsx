import Link from "next/link";
import Image from "next/image";

import { HomePuzzleGrid } from "@/components/home-puzzle-grid";
import { HomeTrustStats } from "@/components/home-trust-stats";
import HomeHeroActions from "@/app/components/HomeHeroActions";
import HomeGiveawayModal from "@/app/components/HomeGiveawayModal";
import HomeTrialPrompt from "@/app/components/HomeTrialPrompt";
import LandingScrollReset from "@/app/components/LandingScrollReset";
import GiveawayCountdown from "@/app/components/GiveawayCountdown";
import { loadHomeCollections } from "@/lib/home-collections";

export const dynamic =
  "force-dynamic";

const flowSteps = [
  "Buy",
  "Own",
  "List",
  "Resell",
] as const;

const heroHighlights = [
  "Pick a puzzle you like",
  "Choose an available piece",
  "Keep or list it later",
] as const;

const howItWorks = [
  {
    step: "01",
    title: "Choose a Puzzle",
    body: "Start with artwork you actually like. Open a collection and see which pieces are available before you decide.",
  },
  {
    step: "02",
    title: "Pick a Piece",
    body: "Each listing shows the exact piece, price, rarity and seller, so you know what you are choosing.",
  },
  {
    step: "03",
    title: "Keep It in Your Profile",
    body: "After purchase, the piece is recorded in your account and stays connected to that puzzle collection.",
  },
  {
    step: "04",
    title: "Decide Later",
    body: "You can keep the piece as part of your collection, or list it later at your own asking price.",
  },
  {
    step: "05",
    title: "Build Your Collection",
    body: "Return anytime to browse more puzzles, complete collections, or manage the pieces you already own.",
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
    question: "Can the resale price change?",
    answer:
      "Yes. Resale depends on buyer demand, listing price, rarity and market activity.",
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
      <LandingScrollReset />
      <HomeGiveawayModal />
      <section className="relative px-4 pb-14 pt-10 md:px-6 md:pb-20 md:pt-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_34%)]" />

        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.82fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400 md:text-sm">
              THE COLLECTIBLE PUZZLE MARKETPLACE
            </p>

            <div className="mt-5 overflow-hidden rounded-[24px] border border-amber-200/35 bg-[linear-gradient(135deg,rgba(250,204,21,0.16),rgba(8,47,73,0.36)_52%,rgba(0,0,0,0.86))] shadow-[0_26px_90px_rgba(250,204,21,0.14)] md:rounded-[28px]">
              <Link
                href="/sweepstakes"
                className="group grid gap-0 md:grid-cols-[1.08fr_0.92fr]"
              >
                <div className="relative min-h-[250px] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.12),transparent_54%),#020202] sm:min-h-[300px] md:min-h-[300px]">
                  <Image
                    src="/giveaway/generated/new-year-giveaway-poster.png"
                    alt="Puzzle Market New Year Giveaway prizes"
                    fill
                    sizes="(min-width: 1024px) 44vw, 100vw"
                    className="object-contain object-center opacity-95 transition duration-500 group-hover:scale-[1.015]"
                    priority
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(250,204,21,0.26),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.18)_48%,rgba(0,0,0,0.88)_100%)] md:bg-[radial-gradient(circle_at_78%_18%,rgba(250,204,21,0.26),transparent_28%),linear-gradient(90deg,rgba(0,0,0,0.86)_0%,rgba(0,0,0,0.3)_62%,rgba(0,0,0,0.06)_100%)]" />
                  <div className="absolute left-3 top-3 rounded-2xl border border-amber-200/35 bg-black/70 px-3 py-2 backdrop-blur sm:left-4 sm:top-4 sm:px-4 sm:py-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-200 sm:text-[10px]">
                      1st draw
                    </p>
                    <p className="mt-1 text-base font-black text-white sm:text-xl">
                      Dec 25, 2026
                    </p>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 rounded-[22px] border border-white/10 bg-black/74 p-3 backdrop-blur sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-[24px] sm:p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200 sm:text-[11px]">
                      New Year Grand Giveaway
                    </p>
                    <h2 className="mt-1.5 text-2xl font-black leading-none text-white sm:mt-2 sm:text-4xl">
                      Join the prize draw
                    </h2>
                    <p className="mt-1.5 text-xs font-bold text-amber-100 sm:mt-2 sm:text-sm">
                      7 x iPhone 17 Pro Max, 7 x AirPods Pro, 84 puzzle credit
                      prizes
                    </p>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
                  <div>
                    <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200 sm:py-2 sm:text-[11px]">
                      Wave 1 ends August 31
                    </div>
                    <h3 className="mt-3 text-xl font-black leading-tight sm:text-2xl md:mt-4 md:text-3xl">
                      New Year giveaway is open.
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300 md:mt-3">
                      Buy the $7 six-month Entry Pass before August 31 and get
                      3 base tickets, plus automatic entry into the 07.07.2027
                      BMW X-7 mega draw.
                    </p>
                  </div>

                  <div>
                    <GiveawayCountdown compact />
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-black sm:mt-4 sm:gap-2 sm:text-xs">
                      {[
                        "Real prize draw",
                        "Automatic tickets",
                        "Mega draw included",
                      ].map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2.5 py-1.5 text-amber-100 sm:px-3 sm:py-2"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 inline-flex rounded-2xl bg-amber-300 px-4 py-2.5 text-sm font-black text-black transition group-hover:bg-amber-200 sm:mt-4 sm:px-5 sm:py-3 sm:text-base">
                      Go to Giveaway
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            <h1 className="translate-safe-title mt-5 font-black">
              Choose Puzzle Pieces. Build a Collection You Can Manage.
            </h1>

            <p className="translate-safe-copy mt-6 max-w-3xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Open a real puzzle collection, choose an available piece, and keep
              it in your account. If you decide to sell later, you control your
              listing price.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-zinc-100"
                >
                  {item}
                </div>
              ))}
            </div>

            <HomeHeroActions />

            <HomeTrialPrompt />

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold">
              <Link
                href="/#faq"
                className="text-cyan-300 underline-offset-4 hover:text-cyan-200 hover:underline"
              >
                See fees and payouts
              </Link>
              <Link
                href="/terms"
                className="text-zinc-400 underline-offset-4 hover:text-white hover:underline"
              >
                Terms
              </Link>
            </div>

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
                    Missing piece path
                  </p>
                  <h2 className="mt-3 text-4xl font-black md:text-5xl">
                    Choose. Own. Manage.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    Start with one available piece from a puzzle you like. Your
                    account keeps the ownership record, and seller tools are
                    there when you are ready to use them.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Choose", "Puzzle"],
                    ["Save", "Account"],
                    ["Manage", "Pieces"],
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
                promises. You see the collection, the available piece, the
                price and the resale rules before making a decision.
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
              Know what happens before you buy.
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
    </main>
  );
}
