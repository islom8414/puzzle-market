"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import GiveawayPrizeShowcase from "@/app/components/GiveawayPrizeShowcase";

const STORAGE_KEY = "puzzle-market-new-year-giveaway-modal-v3";

export default function HomeGiveawayModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasSeenModal = window.localStorage.getItem(STORAGE_KEY);
    if (!hasSeenModal) {
      const timer = window.setTimeout(() => setIsOpen(true), 650);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function closeModal() {
    window.localStorage.setItem(STORAGE_KEY, "closed");
    setIsOpen(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="notranslate fixed inset-0 z-[120] flex items-end justify-center bg-black/66 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="giveaway-modal-title"
      lang="en"
      translate="no"
    >
      <div className="relative max-h-[92dvh] w-[calc(100vw-24px)] max-w-[420px] overflow-y-auto rounded-[22px] border border-amber-200/40 bg-[#050505] shadow-[0_28px_110px_rgba(250,204,21,0.25)] sm:w-full sm:max-w-4xl sm:rounded-[28px]">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/72 text-lg font-black text-white backdrop-blur transition hover:border-amber-200/60 hover:text-amber-100 sm:right-4 sm:top-4 sm:h-11 sm:w-11 sm:text-xl"
          aria-label="Close giveaway announcement"
        >
          x
        </button>

        <div className="relative h-[318px] w-full overflow-hidden bg-zinc-950 sm:aspect-[16/9] sm:h-auto">
          <GiveawayPrizeShowcase mode="modal" />
        </div>

        <div className="relative bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_34%),linear-gradient(135deg,rgba(250,204,21,0.14),rgba(0,0,0,0.94)_48%)] p-3.5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8">
            <div>
            <p className="inline-flex max-w-full rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-cyan-200 sm:px-3 sm:py-2 sm:text-[11px]">
              Real prize draw
            </p>
            <h2
              id="giveaway-modal-title"
              className="mt-2 text-[25px] font-black leading-[1.02] text-white sm:mt-3 sm:text-4xl"
            >
              One entry. Two prize draws.
            </h2>
            <p className="mt-2 text-[12px] leading-[1.45] text-zinc-200 sm:text-sm sm:leading-relaxed">
              Buy the $7 six-month Entry Pass before August 31 to receive 3
              base tickets for the New Year draw and automatic entry into the
              BMW X-7 mega draw on 07.07.2027.
            </p>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
              {[
                "7 x iPhone 17 Pro Max",
                "7 x AirPods Pro",
                "84 puzzle credit prizes",
                "BMW X-7 mega draw",
              ].map((item) => (
                <div
                  key={item}
                  className="min-w-0 rounded-xl border border-white/10 bg-black/50 px-2 py-1.5 text-[9.5px] font-black leading-tight text-amber-50 sm:px-3 sm:py-2 sm:text-xs"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:w-[300px]">
            <Link
              href="/sweepstakes"
              onClick={closeModal}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-amber-300 px-3 text-center text-sm font-black leading-tight text-black shadow-[0_0_34px_rgba(250,204,21,0.28)] transition hover:bg-amber-200 sm:min-h-12 sm:px-5 sm:text-base"
            >
              View Giveaway
            </Link>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-white/15 px-3 text-center text-sm font-black leading-tight text-white transition hover:border-cyan-300/60 hover:text-cyan-100 sm:min-h-12 sm:px-5 sm:text-base"
            >
              Maybe Later
            </button>
          </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes giveawaySheen {
            0%,
            22% {
              transform: translateX(0) rotate(12deg);
              opacity: 0;
            }
            34% {
              opacity: 0.8;
            }
            56%,
            100% {
              transform: translateX(610%) rotate(12deg);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
