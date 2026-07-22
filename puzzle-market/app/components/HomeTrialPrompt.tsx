"use client";

import Link from "next/link";

import { useAccountAccess } from "@/lib/use-account-access";

export default function HomeTrialPrompt() {
  const {
    checking,
    hasActivePlan,
  } = useAccountAccess();

  if (checking || hasActivePlan) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-3 rounded-2xl border border-amber-200/25 bg-[linear-gradient(135deg,rgba(250,204,21,0.12),rgba(34,211,238,0.08))] p-4 text-sm text-zinc-200 shadow-[0_18px_50px_rgba(250,204,21,0.08)] sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-200">
          New Year Entry Pass
        </p>
        <p className="mt-1 font-semibold">
          Join the December 25, 2026 prize draw with the $7 six-month Entry
          Pass. Wave 1 members receive 3 base tickets and automatic entry into
          the 07.07.2027 BMW X-7 mega draw.
        </p>
      </div>
      <Link
        href="/sweepstakes"
        className="rounded-xl bg-amber-300 px-4 py-3 text-center font-black text-black transition hover:bg-amber-200"
      >
        View Giveaway
      </Link>
    </div>
  );
}
