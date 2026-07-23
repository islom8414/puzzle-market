"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "puzzle-market-new-year-giveaway-modal-v2";

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
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/66 px-3 py-3 backdrop-blur-md sm:items-center sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="giveaway-modal-title"
    >
      <div className="relative grid max-h-[78dvh] w-full max-w-[390px] overflow-hidden rounded-[22px] border border-amber-200/35 bg-black shadow-[0_24px_90px_rgba(250,204,21,0.22)] sm:max-h-[92vh] sm:max-w-5xl sm:rounded-[28px] md:grid-cols-[0.95fr_1.05fr]">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/72 text-lg font-black text-white backdrop-blur transition hover:border-amber-200/60 hover:text-amber-100 sm:right-4 sm:top-4 sm:h-11 sm:w-11 sm:text-xl"
          aria-label="Close giveaway announcement"
        >
          x
        </button>

        <div className="relative min-h-[185px] overflow-hidden bg-zinc-950 sm:min-h-[300px] md:min-h-[520px]">
          <Image
            src="/giveaway/generated/new-year-giveaway-poster.png"
            alt="New Year Giveaway prize showcase"
            fill
            sizes="(min-width: 768px) 48vw, 100vw"
            className="object-contain object-top"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.86),rgba(0,0,0,0.05)_42%,rgba(0,0,0,0.22)),radial-gradient(circle_at_12%_85%,rgba(250,204,21,0.34),transparent_34%)]" />
          <div className="absolute bottom-2 left-2 right-2 rounded-[18px] border border-amber-200/30 bg-black/76 p-2.5 backdrop-blur sm:bottom-5 sm:left-5 sm:right-5 sm:rounded-[24px] sm:p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200 sm:text-[11px]">
              December 25, 2026
            </p>
            <p className="mt-1 text-lg font-black leading-none text-white sm:mt-2 sm:text-2xl">
              New Year Grand Giveaway
            </p>
            <p className="mt-1 text-[11px] font-bold text-cyan-100 sm:mt-2 sm:text-sm">
              Wave 1 ends August 31. Enter early for 3 base tickets.
            </p>
          </div>
        </div>

        <div className="relative flex flex-col justify-between gap-3 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(250,204,21,0.16),rgba(0,0,0,0.88)_44%)] p-3 sm:gap-6 sm:p-8 md:p-10">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200 sm:py-2 sm:text-[11px]">
              Real prize draw
            </p>
            <h2
              id="giveaway-modal-title"
              className="mt-2.5 text-2xl font-black leading-[0.95] text-white sm:mt-5 sm:text-5xl"
            >
              Win real prizes. Collect tickets. Join the mega draw.
            </h2>
            <p className="mt-2.5 text-xs leading-relaxed text-zinc-200 sm:mt-5 sm:text-base">
              Buy the $7 six-month Entry Pass before August 31 to receive 3
              base tickets for the New Year draw and automatic entry into the
              BMW X-7 mega draw on 07.07.2027.
            </p>

            <div className="mt-3 grid gap-1.5 sm:mt-6 sm:grid-cols-2 sm:gap-3">
              {[
                "7 x iPhone 17 Pro Max",
                "7 x AirPods Pro",
                "84 puzzle credit prizes",
                "BMW X-7 mega draw",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-black/50 px-2.5 py-2 text-[11px] font-black text-amber-50 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:gap-3 md:flex-row">
            <Link
              href="/sweepstakes"
              onClick={closeModal}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-amber-300 px-3 text-center text-sm font-black text-black shadow-[0_0_34px_rgba(250,204,21,0.28)] transition hover:bg-amber-200 sm:min-h-12 sm:px-5 sm:text-base"
            >
              View Giveaway
            </Link>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border border-white/15 px-3 text-center text-sm font-black text-white transition hover:border-cyan-300/60 hover:text-cyan-100 sm:min-h-12 sm:px-5 sm:text-base"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
