"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

type AuctionAccess = {
  authenticated: boolean;
  canCreateAuction: boolean;
  subscriptionTier?: string;
};

export default function AuctionsPage() {
  const [access, setAccess] =
    useState<AuctionAccess | null>(null);

  useEffect(() => {
    async function loadAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await apiFetch(
        "/api/auction-access",
        session
          ? {
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            }
          : undefined
      );

      const data =
        (await response.json()) as AuctionAccess;

      setAccess(data);
    }

    loadAccess();
  }, []);

  const eligible =
    access?.canCreateAuction === true;

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white md:px-6">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
          Puzzle Auctions
        </p>

        <h1 className="mt-4 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
          Collectors set the price.
        </h1>

        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Everyone will be able to browse auctions and make offers. Publishing
          an owned puzzle for auction is reserved for administrators and active
          Premium or Creator members.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-black text-cyan-400">1</p>
            <h2 className="mt-3 text-2xl font-black">List an owned puzzle</h2>
            <p className="mt-3 text-zinc-500">
              Choose the starting price and offer period.
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-black text-cyan-400">2</p>
            <h2 className="mt-3 text-2xl font-black">Receive offers</h2>
            <p className="mt-3 text-zinc-500">
              Buyers can accept the price or submit their own offer.
            </p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-black text-cyan-400">3</p>
            <h2 className="mt-3 text-2xl font-black">Choose the winner</h2>
            <p className="mt-3 text-zinc-500">
              The seller accepts the best suitable offer and ownership moves
              securely.
            </p>
          </article>
        </div>

        <section className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
            Listing access
          </p>

          {!access ? (
            <p className="mt-4 font-bold text-zinc-400">
              Checking your auction access...
            </p>
          ) : eligible ? (
            <>
              <h2 className="mt-4 text-3xl font-black">
                Your account can publish auction lots.
              </h2>
              <p className="mt-3 text-zinc-400">
                Auction publishing will unlock here when live bidding is
                released. Your current plan already qualifies.
              </p>
              <button
                type="button"
                disabled
                className="mt-6 rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black opacity-60"
              >
                Create Auction - Coming Soon
              </button>
            </>
          ) : (
            <>
              <h2 className="mt-4 text-3xl font-black">
                Premium or Creator is required to publish.
              </h2>
              <p className="mt-3 text-zinc-400">
                You will still be able to browse auctions and buy or make
                offers without publishing your own lot.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={access.authenticated ? "/subscribe" : "/login"}
                  className="rounded-2xl bg-cyan-400 px-6 py-4 text-center font-black text-black"
                >
                  {access.authenticated
                    ? "View Premium Plans"
                    : "Sign In"}
                </Link>
                <Link
                  href="/marketplace"
                  className="rounded-2xl border border-white/15 px-6 py-4 text-center font-black"
                >
                  Browse Marketplace
                </Link>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}
