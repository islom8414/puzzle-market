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
    <div className="mt-4 grid gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm text-zinc-300 sm:grid-cols-[1fr_auto] sm:items-center">
      <p className="font-semibold">
        Start with a 3-day trial. Add a card, pay no subscription charge
        today, and unlock buying, ownership and resale tools.
      </p>
      <Link
        href="/subscribe?source=hero"
        className="rounded-xl bg-white px-4 py-3 text-center font-black text-black transition hover:bg-cyan-100"
      >
        View Trial Plans
      </Link>
    </div>
  );
}
