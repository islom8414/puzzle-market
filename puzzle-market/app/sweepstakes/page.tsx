"use client";

import { useEffect, useState } from "react";
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
  },
  {
    title: "Referral boost",
    body: "Invite a collector. When they subscribe, you receive one extra ticket.",
  },
  {
    title: "Puzzle purchases",
    body: "Every $7 spent on puzzle pieces adds one extra ticket. $14 gives two, $21 gives three.",
  },
  {
    title: "$1 piece bonus",
    body: "Collect seven $1 pieces and receive one extra ticket on top of your purchase tickets.",
  },
];

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
    <main className="min-h-screen overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.20),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.18),transparent_36%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="overflow-hidden rounded-[32px] border border-amber-300/30 bg-white/[0.035] p-5 shadow-[0_0_70px_rgba(251,191,36,0.12)] md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
                New Year Grand Giveaway
              </p>

              <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] md:text-7xl">
                Join Puzzle Market. Collect tickets. Win real prizes.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Buy the $7 six-month Entry Pass before the deadline and become
                a participant in the New Year prize draw. The earlier you enter,
                the more base chances you receive.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/subscribe?plan=sweepstakes"
                  className="rounded-2xl bg-amber-300 px-6 py-4 text-center font-black text-black transition hover:bg-amber-200"
                >
                  Get Entry Pass
                </Link>

                <Link
                  href="/marketplace"
                  className="rounded-2xl border border-white/15 px-6 py-4 text-center font-black text-white transition hover:border-cyan-300 hover:text-cyan-200"
                >
                  Explore Marketplace
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-black/55 p-5 md:p-6">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                Your Chances
              </p>

              <div className="mt-4 flex items-end gap-3">
                <span className="text-7xl font-black text-amber-200">
                  {loading ? "..." : totalTickets}
                </span>
                <span className="pb-3 text-xl font-black text-zinc-300">
                  tickets
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {summary?.isEntered
                  ? `You are entered through ${summary.waveLabel || "the current wave"}.`
                  : authenticated
                    ? "Get the Entry Pass to activate your giveaway participation."
                    : "Sign in or create an account to see your live ticket count."}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Base", summary?.baseTickets || 0],
                  ["Referrals", summary?.referralTickets || 0],
                  ["Purchases", summary?.purchaseTickets || 0],
                  ["$1 Bonus", summary?.oneDollarBundleTickets || 0],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-zinc-500">{label}</p>
                    <p className="mt-2 text-2xl font-black">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {sweepstakesWaves.map((wave) => (
            <article
              key={wave.name}
              className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5"
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

        <section className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.035] p-5 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                Prize Pool
              </p>
              <h2 className="mt-3 text-4xl font-black md:text-5xl">
                New Year rewards
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
              The campaign is built as a real prize draw. Full official rules
              should be published before launch and linked from this page.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {sweepstakesPrizePool.map((prize) => (
              <div
                key={prize.name}
                className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4"
              >
                <p className="text-4xl font-black text-amber-200">
                  {prize.quantity}
                </p>
                <p className="mt-2 font-black">{prize.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-4">
          {ticketRules.map((rule) => (
            <article
              key={rule.title}
              className="rounded-[24px] border border-cyan-400/15 bg-cyan-400/[0.045] p-5"
            >
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
