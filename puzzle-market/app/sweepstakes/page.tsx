"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { apiFetch } from "@/lib/api-client";
import { formatUsd } from "@/lib/price-index";
import { supabase } from "@/lib/supabase";
import {
  sweepstakesOneDollarBundleSize,
  sweepstakesPrizePool,
  sweepstakesPurchaseUnitCents,
  sweepstakesWaves,
  type SweepstakesSummary,
} from "@/lib/sweepstakes";

type SweepstakesApiResponse = {
  authenticated: boolean;
  summary: SweepstakesSummary | null;
};

const ticketRules = [
  {
    title: "Entry plan",
    body: "Buy the $7 six-month New Year Entry Pass and your base tickets are added automatically.",
    meta: "$7 / 6 months",
  },
  {
    title: "Referral boost",
    body: "Invite a collector. When they subscribe, you receive one extra ticket.",
    meta: "+1 ticket",
  },
  {
    title: "Puzzle purchases",
    body: "Every $7 spent on puzzle pieces adds one extra ticket. $14 gives two, $21 gives three.",
    meta: "Every $7",
  },
  {
    title: "$1 piece bonus",
    body: "Collect seven $1 pieces and receive one extra ticket on top of your purchase tickets.",
    meta: "7 pieces",
  },
];

const campaignHighlights = [
  "Real prize draw",
  "Automatic tickets",
  "Referral bonuses",
  "Marketplace included",
];

const heroPrizeList = [
  "7 x iPhone 17 Pro Max",
  "7 x AirPods Pro",
  "84 puzzle credit prizes",
];

const prizeVisuals: Record<
  string,
  {
    imageClass: string;
    accent: string;
    subtitle: string;
  }
> = {
  "iPhone 17 Pro Max": {
    imageClass: "object-left",
    accent: "Grand prize",
    subtitle: "flagship smartphone prize for seven winners",
  },
  "AirPods Pro": {
    imageClass: "object-center",
    accent: "Audio prize",
    subtitle: "premium wireless earbuds for seven winners",
  },
  "$100 puzzle credit": {
    imageClass: "object-right",
    accent: "Puzzle credit",
    subtitle: "high-value marketplace credit",
  },
  "$10 puzzle credit": {
    imageClass: "object-right",
    accent: "Puzzle credit",
    subtitle: "extra credit for puzzle collectors",
  },
  "$1 puzzle credit": {
    imageClass: "object-right",
    accent: "Bonus prizes",
    subtitle: "many small wins for more collectors",
  },
};

const prizeImageSrc = "/giveaway/new-year-prize-showcase-v2.png";

const faqs = [
  {
    question: "How do I enter the New Year Giveaway?",
    answer:
      "Create or sign in to your account, then buy the New Year Entry Pass before the campaign deadline.",
  },
  {
    question: "How many chances do I get?",
    answer:
      "Wave 1 gives 3 base tickets, Wave 2 gives 2, and Wave 3 gives 1. Referrals and eligible purchases can add more.",
  },
  {
    question: "When is the draw?",
    answer:
      "The prize draw is planned for New Year's Eve. The final official draw details should be published before the event.",
  },
  {
    question: "Can I still use the marketplace?",
    answer:
      "Yes. The New Year Entry Pass includes marketplace access, resale tools, and auction participation for six months.",
  },
];

export default function SweepstakesPage() {
  const [summary, setSummary] =
    useState<SweepstakesSummary | null>(null);
  const [authenticated, setAuthenticated] =
    useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadGiveaway() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await apiFetch("/api/sweepstakes", {
        headers: session?.access_token
          ? {
              Authorization: `Bearer ${session.access_token}`,
            }
          : undefined,
      });

      if (!mounted) {
        return;
      }

      if (response.ok) {
        const data =
          (await response.json()) as SweepstakesApiResponse;
        setAuthenticated(data.authenticated);
        setSummary(data.summary);
      }

      setLoading(false);
    }

    loadGiveaway();

    return () => {
      mounted = false;
    };
  }, []);

  const totalTickets = summary?.totalTickets || 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-28 bg-black/90" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-5 md:px-6 md:pt-32">
        <section className="overflow-hidden rounded-[26px] border border-amber-300/30 bg-[linear-gradient(135deg,#0b0904_0%,#050505_48%,#031b1b_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.55)] md:rounded-[32px]">
          <div className="grid lg:min-h-[620px] lg:grid-cols-[0.84fr_1.16fr]">
            <div className="flex flex-col justify-between p-5 sm:p-7 md:p-9 lg:p-10">
              <div>
                <div className="inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-100">
                  New Year Grand Giveaway
                </div>

                <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[0.96] sm:text-5xl md:text-6xl">
                  Enter once. Collect tickets. Win premium prizes.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 md:text-lg">
                  Buy the $7 six-month Entry Pass before the deadline and join
                  the New Year prize draw. Earlier entry means more base
                  tickets, and marketplace activity can add more chances.
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {heroPrizeList.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-black text-zinc-100"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/subscribe?plan=sweepstakes"
                    className="rounded-2xl bg-amber-300 px-6 py-4 text-center font-black text-black shadow-[0_16px_40px_rgba(251,191,36,0.22)] transition hover:bg-amber-200"
                  >
                    Get Entry Pass
                  </Link>

                  <Link
                    href="/marketplace"
                    className="rounded-2xl border border-white/15 bg-black/35 px-6 py-4 text-center font-black text-white transition hover:border-cyan-300 hover:text-cyan-200"
                  >
                    Explore Marketplace
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {campaignHighlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-cyan-200"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative min-h-[470px] border-t border-amber-300/20 bg-black lg:border-l lg:border-t-0">
              <Image
                src={prizeImageSrc}
                alt="iPhone 17 Pro Max, AirPods Pro and Puzzle Market prize credits"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />

              <div className="absolute left-4 top-4 rounded-2xl border border-amber-200/30 bg-black/70 px-4 py-3 backdrop-blur md:left-6 md:top-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                  Entry deadline
                </p>
                <p className="mt-1 text-2xl font-black">
                  Nov 30, 2026
                </p>
              </div>

              <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-white/15 bg-black/78 p-4 backdrop-blur md:bottom-6 md:left-6 md:right-6 md:p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-300">
                      Your live tickets
                    </p>
                    <p className="mt-2 text-sm text-zinc-400">
                      {summary?.isEntered
                        ? `Entered through ${summary.waveLabel || "the current wave"}.`
                        : authenticated
                          ? "Get the Entry Pass to activate participation."
                          : "Sign in to see your live ticket count."}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-5xl font-black leading-none text-amber-200 md:text-6xl">
                      {loading ? "..." : totalTickets}
                    </p>
                    <p className="mt-1 text-sm font-black text-zinc-300">
                      tickets
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                  {[
                    ["Base", summary?.baseTickets || 0],
                    ["Referrals", summary?.referralTickets || 0],
                    ["Purchases", summary?.purchaseTickets || 0],
                    ["$1 Bonus", summary?.oneDollarBundleTickets || 0],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] p-3"
                    >
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="mt-1 text-xl font-black">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {sweepstakesWaves.map((wave) => (
            <article
              key={wave.name}
              className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(255,255,255,0.035))] p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                {wave.name}
              </p>
              <h2 className="mt-3 text-3xl font-black">
                {wave.tickets} tickets
              </h2>
              <p className="mt-3 text-zinc-400">
                {wave.label}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-[#090909] p-5 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Prize Pool
              </p>
              <h2 className="mt-3 text-4xl font-black leading-none md:text-5xl">
                Real New Year rewards
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              The prize pool is shown clearly before entry. Full official rules
              should be linked here before launch, including eligibility,
              winner selection, delivery, and tax responsibility.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {sweepstakesPrizePool.map((prize) => (
              <div
                key={prize.name}
                className="group overflow-hidden rounded-[24px] border border-amber-300/25 bg-black shadow-[0_18px_50px_rgba(0,0,0,0.28)]"
              >
                <div className="relative h-40 overflow-hidden bg-zinc-950">
                  <Image
                    src={prizeImageSrc}
                    alt={`${prize.name} prize`}
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className={`object-cover transition duration-500 group-hover:scale-105 ${
                      prizeVisuals[prize.name]?.imageClass || "object-center"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-amber-200/30 bg-black/70 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-amber-100">
                    {prizeVisuals[prize.name]?.accent || "Prize"}
                  </div>
                </div>

                <div className="p-4">
                  <p className="text-5xl font-black leading-none text-amber-200">
                    {prize.quantity}
                  </p>
                  <p className="mt-3 min-h-[56px] text-2xl font-black leading-tight">
                    {prize.name}
                  </p>
                  <p className="mt-2 text-sm leading-5 text-zinc-500">
                    {prizeVisuals[prize.name]?.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {ticketRules.map((rule) => (
            <article
              key={rule.title}
              className="rounded-[24px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(0,0,0,0.45))] p-5"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                {rule.meta}
              </p>
              <h3 className="text-xl font-black">{rule.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {rule.body}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
              Referral Block
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Invite collectors and increase your chances.
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Share your referral link from the profile page. When a referred
              collector activates a paid subscription, you receive one extra
              giveaway ticket.
            </p>
            <Link
              href="/profile"
              className="mt-5 inline-flex rounded-2xl bg-cyan-400 px-5 py-3 font-black text-black transition hover:bg-cyan-300"
            >
              Open Profile
            </Link>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
              Purchase Boost
            </p>
            <h2 className="mt-3 text-3xl font-black">
              Every collection move can add tickets.
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-black/50 p-4">
                <p className="text-sm text-zinc-400">
                  Ticket unit
                </p>
                <p className="mt-2 text-2xl font-black text-amber-200">
                  {formatUsd(sweepstakesPurchaseUnitCents / 100)}
                </p>
              </div>
              <div className="rounded-2xl bg-black/50 p-4">
                <p className="text-sm text-zinc-400">
                  $1 bundle
                </p>
                <p className="mt-2 text-2xl font-black text-cyan-300">
                  {sweepstakesOneDollarBundleSize} pieces
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.035] p-5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
            FAQ
          </p>
          <h2 className="mt-3 text-4xl font-black">
            Common questions
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-white/10 bg-black/45 p-5"
              >
                <h3 className="font-black">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
