"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "puzzle-market-new-year-giveaway-modal-v1";

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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/78 px-4 py-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="giveaway-modal-title"
    >
      <div className="relative grid max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-amber-200/35 bg-black shadow-[0_30px_120px_rgba(250,204,21,0.22)] md:grid-cols-[0.95fr_1.05fr]">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/72 text-xl font-black text-white backdrop-blur transition hover:border-amber-200/60 hover:text-amber-100"
          aria-label="Close giveaway announcement"
        >
          x
        </button>

        <div className="relative min-h-[300px] overflow-hidden bg-zinc-950 md:min-h-[520px]">
          <Image
            src="/giveaway/generated/iphone-17-pro-max-prize.png"
            alt="New Year Giveaway prize showcase"
            fill
            sizes="(min-width: 768px) 48vw, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.84),rgba(0,0,0,0.08)_48%,rgba(0,0,0,0.42)),radial-gradient(circle_at_12%_85%,rgba(250,204,21,0.35),transparent_34%)]" />
          <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-amber-200/30 bg-black/72 p-4 backdrop-blur">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
              December 25, 2026
            </p>
            <p className="mt-2 text-2xl font-black leading-none text-white">
              New Year Grand Giveaway
            </p>
            <p className="mt-2 text-sm font-bold text-cyan-100">
              Wave 1 ends August 31. Enter early for 3 base tickets.
            </p>
          </div>
        </div>

        <div className="relative flex flex-col justify-between gap-6 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_34%),linear-gradient(135deg,rgba(250,204,21,0.16),rgba(0,0,0,0.88)_44%)] p-6 sm:p-8 md:p-10">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
              Real prize draw
            </p>
            <h2
              id="giveaway-modal-title"
              className="mt-5 text-4xl font-black leading-[0.95] text-white sm:text-5xl"
            >
              Win real prizes. Collect tickets. Join the mega draw.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-200">
              Buy the $7 six-month Entry Pass before August 31 to receive 3
              base tickets for the New Year draw and automatic entry into the
              BMW X-7 mega draw on 07.07.2027.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "7 x iPhone 17 Pro Max",
                "7 x AirPods Pro",
                "84 puzzle credit prizes",
                "BMW X-7 mega draw",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm font-black text-amber-50"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sweepstakes"
              onClick={closeModal}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-amber-300 px-5 text-center font-black text-black shadow-[0_0_34px_rgba(250,204,21,0.28)] transition hover:bg-amber-200"
            >
              View Giveaway
            </Link>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 px-5 text-center font-black text-white transition hover:border-cyan-300/60 hover:text-cyan-100"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
