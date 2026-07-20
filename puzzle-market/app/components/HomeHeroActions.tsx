"use client";

import Link from "next/link";

import { useAccountAccess } from "@/lib/use-account-access";

export default function HomeHeroActions() {
  const {
    checking,
    authenticated,
  } = useAccountAccess();

  return (
    <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
      <Link
        href="/marketplace"
        className="translate-safe-action rounded-2xl bg-cyan-400 px-6 py-4 text-center text-base font-black text-black transition hover:bg-cyan-300 md:px-8"
      >
        Explore Live Fragments
      </Link>

      {!checking && (
        <Link
          href={
            authenticated
              ? "/profile"
              : "/register?next=%2Fmarketplace&intent=hero"
          }
          className="translate-safe-action rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-6 py-4 text-center text-base font-black text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-400/15 md:px-8"
        >
          {authenticated
            ? "My Account"
            : "Create Account"}
        </Link>
      )}

      <Link
        href="/#how-it-works"
        className="translate-safe-action rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-base font-black transition hover:border-cyan-400"
      >
        See How It Works
      </Link>
    </div>
  );
}
