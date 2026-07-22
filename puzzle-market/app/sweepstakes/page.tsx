"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { apiFetch } from "@/lib/api-client";
import { formatUsd } from "@/lib/price-index";
import { supabase } from "@/lib/supabase";
import {
  sweepstakesFirstDrawDate,
  sweepstakesMegaDrawDate,
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
  "BMW X-7 mega draw",
];

const animatedPrizes = [
  {
    title: "iPhone 17 Pro Max",
    quantity: "7",
    tag: "Grand prize",
    className: "phone-prize",
  },
  {
    title: "AirPods for iPhone",
    quantity: "7",
    tag: "Audio prize",
    className: "airpods-prize",
  },
  {
    title: "$100 puzzle credit",
    quantity: "7",
    tag: "Puzzle credit",
    className: "credit-prize high-credit",
  },
  {
    title: "$10 puzzle credit",
    quantity: "7",
    tag: "Puzzle credit",
    className: "credit-prize mid-credit",
  },
  {
    title: "$1 puzzle credit",
    quantity: "70",
    tag: "Bonus prizes",
    className: "credit-prize small-credit",
  },
];

const firstWave = sweepstakesWaves[0];
const firstWaveEnd = new Date(firstWave.endsAt);
const countdownUnits = [
  { key: "days", label: "Days" },
  { key: "hours", label: "Hours" },
  { key: "minutes", label: "Min" },
  { key: "seconds", label: "Sec" },
] as const;

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
const firstDrawLabel =
  sweepstakesFirstDrawDate === "2026-12-25"
    ? "December 25, 2026"
    : sweepstakesFirstDrawDate;
const megaDrawLabel =
  sweepstakesMegaDrawDate === "2027-07-07"
    ? "07.07.2027"
    : sweepstakesMegaDrawDate;

function getCountdownParts(targetDate: Date, currentDate: Date) {
  const distance = Math.max(
    0,
    targetDate.getTime() - currentDate.getTime()
  );
  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

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
      "The New Year prize draw is planned for December 25, 2026. Wave 1 participants also enter the BMW X-7 mega draw on 07.07.2027.",
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
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;
    const firstTick = window.setTimeout(() => {
      setNow(new Date());
    }, 0);
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

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
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  const totalTickets = summary?.totalTickets || 0;
  const countdown = now ? getCountdownParts(firstWaveEnd, now) : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-0 h-28 bg-black/90" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-5 md:px-6 md:pt-32">
        <section className="relative overflow-hidden rounded-[26px] border border-amber-300/30 bg-[radial-gradient(circle_at_78%_20%,rgba(251,191,36,0.18),transparent_34%),linear-gradient(135deg,#090705_0%,#050505_46%,#07191b_100%)] shadow-[0_24px_90px_rgba(0,0,0,0.55)] md:rounded-[32px]">
          <div className="giveaway-sparks absolute inset-0 opacity-70" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />

          <div className="relative grid gap-8 p-5 sm:p-7 md:p-9 lg:min-h-[670px] lg:grid-cols-[0.86fr_0.86fr] lg:p-10">
            <div className="flex max-w-2xl flex-col justify-between">
              <div>
                <div className="inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-amber-100">
                  New Year Grand Giveaway
                </div>

                <h1 className="mt-6 text-4xl font-black leading-[0.96] sm:text-5xl md:text-6xl lg:text-[64px]">
                  Animated prize draw. Real rewards. Live tickets.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 md:text-lg">
                  Buy the $7 six-month Entry Pass before August 31 to receive
                  3 base tickets for the first draw and automatic entry into
                  the BMW X-7 mega draw.
                </p>

                <div className="mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
                  {heroPrizeList.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-sm font-black text-zinc-100 backdrop-blur"
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

            <div className="flex flex-col gap-4">
              <div className="relative min-h-[430px] overflow-hidden rounded-[30px] border border-amber-200/25 bg-black/58 p-4 shadow-[inset_0_0_80px_rgba(251,191,36,0.08)] backdrop-blur md:min-h-[520px] md:p-5">
                <div className="absolute inset-x-6 top-6 flex items-center justify-between gap-3">
                  <div className="rounded-2xl border border-amber-200/25 bg-black/70 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
                      1st draw
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {firstDrawLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                      Mega draw
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {megaDrawLabel}
                    </p>
                  </div>
                </div>

                <div className="prize-orbit absolute inset-0">
                  {animatedPrizes.map((prize, index) => (
                    <div
                      key={prize.title}
                      className={`animated-prize ${prize.className}`}
                      style={{
                        animationDelay: `${index * 2.3}s`,
                      }}
                    >
                      <div className="rounded-full border border-amber-200/30 bg-black/75 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-100">
                        {prize.tag}
                      </div>
                      <div className="mt-3 flex items-end gap-3">
                        <p className="text-6xl font-black leading-none text-amber-200">
                          {prize.quantity}
                        </p>
                        <p className="pb-2 text-xl font-black leading-tight text-white">
                          {prize.title}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="mega-car">
                    <div className="car-body">
                      <div className="car-window" />
                      <div className="car-light left" />
                      <div className="car-light right" />
                      <div className="car-wheel left" />
                      <div className="car-wheel right" />
                    </div>
                    <div className="mt-4 rounded-3xl border border-amber-200/40 bg-black/80 px-5 py-4 text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                        2nd draw 07.07.2027
                      </p>
                      <p className="mt-1 text-3xl font-black">
                        BMW X-7
                      </p>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-x-5 bottom-5 rounded-[26px] border border-white/15 bg-black/78 p-4 backdrop-blur md:p-5">
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

              <div className="rounded-[26px] border border-amber-200/30 bg-black/75 p-4 backdrop-blur md:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-200">
                      Wave 1 deadline
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      August 31, 2026
                    </p>
                  </div>
                  <p className="text-sm font-bold text-zinc-400">
                    3 base tickets
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {countdownUnits.map((unit) => (
                    <div
                      key={unit.key}
                      className="rounded-2xl border border-amber-200/20 bg-amber-200/[0.08] p-3 text-center"
                    >
                      <p className="text-3xl font-black leading-none text-amber-200 md:text-4xl">
                        {countdown
                          ? String(countdown[unit.key]).padStart(2, "0")
                          : "--"}
                      </p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                        {unit.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {sweepstakesWaves.map((wave, index) => (
            <article
              key={wave.name}
              className={`rounded-[24px] border p-5 ${
                index === 0
                  ? "border-amber-300/35 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(0,0,0,0.75))] shadow-[0_18px_55px_rgba(251,191,36,0.12)]"
                  : "border-white/10 bg-[linear-gradient(135deg,rgba(251,191,36,0.08),rgba(255,255,255,0.035))]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  {wave.name}
                </p>
                {index === 0 ? (
                  <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
                    Current deadline
                  </span>
                ) : null}
              </div>
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

      <style jsx>{`
        .giveaway-sparks {
          background:
            radial-gradient(circle at 18% 24%, rgba(255, 225, 148, 0.45) 0 2px, transparent 3px),
            radial-gradient(circle at 66% 18%, rgba(34, 211, 238, 0.35) 0 2px, transparent 3px),
            radial-gradient(circle at 82% 54%, rgba(255, 225, 148, 0.34) 0 2px, transparent 3px),
            radial-gradient(circle at 42% 80%, rgba(34, 211, 238, 0.26) 0 2px, transparent 3px);
          animation: sparkDrift 9s linear infinite;
        }

        .prize-orbit::before {
          position: absolute;
          inset: 18% 10% 20%;
          content: "";
          border: 1px solid rgba(251, 191, 36, 0.22);
          border-radius: 999px;
          box-shadow:
            inset 0 0 70px rgba(34, 211, 238, 0.08),
            0 0 90px rgba(251, 191, 36, 0.12);
          transform: rotate(-10deg);
        }

        .animated-prize {
          position: absolute;
          left: 50%;
          top: 46%;
          width: min(78%, 380px);
          min-height: 245px;
          padding: 120px 22px 22px;
          opacity: 0;
          transform: translate(-50%, -44%) scale(0.86);
          border: 1px solid rgba(251, 191, 36, 0.32);
          border-radius: 28px;
          background:
            radial-gradient(circle at 72% 18%, rgba(251, 191, 36, 0.2), transparent 32%),
            linear-gradient(145deg, rgba(7, 19, 20, 0.98), rgba(0, 0, 0, 0.9));
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.5);
          animation: prizeCycle 13.8s infinite cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animated-prize::before {
          position: absolute;
          left: 50%;
          top: 22px;
          content: "";
          transform: translateX(-50%);
        }

        .phone-prize::before {
          width: 86px;
          height: 116px;
          border-radius: 22px;
          background:
            radial-gradient(circle at 25px 26px, #0b1220 0 9px, #b8c4d8 10px 14px, transparent 15px),
            radial-gradient(circle at 60px 26px, #0b1220 0 9px, #b8c4d8 10px 14px, transparent 15px),
            radial-gradient(circle at 43px 54px, #0b1220 0 9px, #b8c4d8 10px 14px, transparent 15px),
            linear-gradient(145deg, #d8dee9, #6d7788 48%, #1d2634);
          box-shadow: 0 18px 50px rgba(180, 197, 225, 0.25);
        }

        .airpods-prize::before {
          width: 130px;
          height: 82px;
          border-radius: 26px 26px 34px 34px;
          background:
            radial-gradient(ellipse at 35% 36%, #f9fafb 0 12px, #d7dce5 13px 21px, transparent 22px),
            radial-gradient(ellipse at 66% 36%, #f9fafb 0 12px, #d7dce5 13px 21px, transparent 22px),
            linear-gradient(180deg, #ffffff, #cfd6df);
          box-shadow: 0 18px 45px rgba(255, 255, 255, 0.22);
        }

        .credit-prize::before {
          width: 148px;
          height: 92px;
          border-radius: 20px;
          background:
            radial-gradient(circle at 24% 30%, rgba(34, 211, 238, 0.55), transparent 16%),
            linear-gradient(135deg, #0d282b, #1a1610 44%, #d3a52d);
          box-shadow:
            inset 0 0 0 1px rgba(255, 232, 168, 0.45),
            0 20px 60px rgba(251, 191, 36, 0.18);
        }

        .credit-prize::after {
          position: absolute;
          left: calc(50% - 24px);
          top: 44px;
          width: 48px;
          height: 48px;
          content: "";
          background:
            linear-gradient(90deg, transparent 35%, rgba(255, 244, 207, 0.9) 35% 65%, transparent 65%),
            linear-gradient(0deg, transparent 35%, rgba(255, 244, 207, 0.9) 35% 65%, transparent 65%);
          clip-path: polygon(8% 0, 92% 0, 92% 28%, 100% 28%, 100% 72%, 92% 72%, 92% 100%, 8% 100%, 8% 72%, 0 72%, 0 28%, 8% 28%);
          opacity: 0.8;
        }

        .mega-car {
          position: absolute;
          left: 50%;
          top: 45%;
          width: min(86%, 430px);
          opacity: 0;
          transform: translate(-40%, -38%) scale(0.82);
          animation: carReveal 13.8s infinite cubic-bezier(0.16, 1, 0.3, 1);
        }

        .car-body {
          position: relative;
          height: 132px;
          border-radius: 70px 92px 42px 42px;
          background:
            linear-gradient(0deg, #050505, #0b0b0b 44%, #30343a 45%, #0f1418 100%);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.18),
            0 34px 80px rgba(0, 0, 0, 0.65);
        }

        .car-window {
          position: absolute;
          left: 88px;
          top: 18px;
          width: 148px;
          height: 46px;
          border-radius: 36px 54px 12px 12px;
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.48), rgba(255, 255, 255, 0.12));
        }

        .car-light {
          position: absolute;
          bottom: 30px;
          width: 42px;
          height: 10px;
          border-radius: 999px;
          background: #eafcff;
          box-shadow: 0 0 28px rgba(34, 211, 238, 0.9);
        }

        .car-light.left {
          left: 36px;
        }

        .car-light.right {
          right: 36px;
        }

        .car-wheel {
          position: absolute;
          bottom: -20px;
          width: 54px;
          height: 54px;
          border: 10px solid #090909;
          border-radius: 999px;
          background: #737373;
          box-shadow: inset 0 0 0 5px #1f2937;
        }

        .car-wheel.left {
          left: 76px;
        }

        .car-wheel.right {
          right: 78px;
        }

        @keyframes prizeCycle {
          0%,
          9% {
            opacity: 0;
            transform: translate(-50%, -38%) scale(0.82);
          }
          13%,
          25% {
            opacity: 1;
            transform: translate(-50%, -44%) scale(1);
          }
          31%,
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.08);
          }
        }

        @keyframes carReveal {
          0%,
          77% {
            opacity: 0;
            transform: translate(-25%, -34%) scale(0.76);
          }
          83%,
          95% {
            opacity: 1;
            transform: translate(-50%, -38%) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-58%, -38%) scale(1.04);
          }
        }

        @keyframes sparkDrift {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-18px, 14px, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .giveaway-sparks,
          .animated-prize,
          .mega-car {
            animation: none;
          }

          .animated-prize:first-child,
          .mega-car {
            opacity: 1;
          }

          .mega-car {
            transform: translate(-50%, 34%) scale(0.74);
          }
        }
      `}</style>
    </main>
  );
}
