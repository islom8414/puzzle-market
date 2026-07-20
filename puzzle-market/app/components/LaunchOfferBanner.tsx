"use client";

import Link from "next/link";

import { useAccountAccess } from "@/lib/use-account-access";

const LAUNCH_DEADLINE = "July 31, 2026";

export default function LaunchOfferBanner() {
  const {
    checking,
    authenticated,
    hasActivePlan,
  } = useAccountAccess();

  if (checking || hasActivePlan) {
    return null;
  }

  return (
    <section className="relative z-40 border-b border-cyan-400/20 bg-black/95 px-3 py-3 text-white shadow-[0_12px_40px_rgba(0,229,255,0.08)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 sm:text-xs">
            Launch bonus ends {LAUNCH_DEADLINE}
          </p>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-snug text-zinc-100 sm:text-base">
            Start a 3-day trial today. After the first successful paid billing, we add bonus puzzle credit to your account.
          </p>
          <p className="mt-1 text-xs leading-snug text-zinc-400">
            Important: $5 / $20 / $100 are bonus credits, not subscription prices. Starter bonus: $5 credit. Premium: $20 credit. Creator: $100 credit. Card required; no subscription charge today.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href="/subscribe?source=launch_banner"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-cyan-400 px-4 text-sm font-black text-black shadow-[0_0_24px_rgba(34,211,238,0.35)] transition hover:bg-cyan-300"
          >
            Start 3-Day Trial
          </Link>
          {!authenticated && (
            <Link
              href="/register?next=%2Fmarketplace&intent=launch_banner"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 text-sm font-bold text-white transition hover:border-cyan-300/60 hover:text-cyan-200"
            >
              Create Account
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
