"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type LeaderboardUser = {

  email: string;

  wealth: number;

  fragments: number;

  legendary: number;

};

type Transaction = {

  buyer_email: string;

  seller_email: string;

  price: number;

};

type Inventory = {

  user_email: string;

  price: number;

};

type MarketplaceItem = {

  seller_email: string;

  rarity: string;

};

export default function LeaderboardPage() {

  const [leaders, setLeaders] =
    useState<LeaderboardUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadLeaderboard();

    const channel =
      supabase
        .channel(
          "leaderboard-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "transactions",
          },
          () => {

            loadLeaderboard();

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  const loadLeaderboard =
    async () => {

      const {
        data: transactions,
      } =
        await supabase
          .from("transactions")
          .select("*");

      const {
        data: inventory,
      } =
        await supabase
          .from("inventory")
          .select("*");

      const {
        data: marketplace,
      } =
        await supabase
          .from("marketplace")
          .select("*");

      const userMap =
        new Map<
          string,
          LeaderboardUser
        >();

      inventory?.forEach(
        (
          item: Inventory
        ) => {

          if (
            !userMap.has(
              item.user_email
            )
          ) {

            userMap.set(
              item.user_email,
              {

                email:
                  item.user_email,

                wealth: 0,

                fragments: 0,

                legendary: 0,

              }
            );

          }

          const user =
            userMap.get(
              item.user_email
            )!;

          user.fragments += 1;

          user.wealth +=
            item.price;

        }
      );

      marketplace?.forEach(
        (
          item: MarketplaceItem
        ) => {

          if (
            !userMap.has(
              item.seller_email
            )
          ) {

            userMap.set(
              item.seller_email,
              {

                email:
                  item.seller_email,

                wealth: 0,

                fragments: 0,

                legendary: 0,

              }
            );

          }

          const user =
            userMap.get(
              item.seller_email
            )!;

          if (
            item.rarity ===
            "Legendary"
          ) {

            user.legendary += 1;

          }

        }
      );

      transactions?.forEach(
        (
          tx: Transaction
        ) => {

          if (
            userMap.has(
              tx.seller_email
            )
          ) {

            const seller =
              userMap.get(
                tx.seller_email
              )!;

            seller.wealth +=
              tx.price;

          }

        }
      );

      const sorted =
        Array.from(
          userMap.values()
        ).sort(
          (a, b) =>
            b.wealth -
            a.wealth
        );

      setLeaders(sorted);

      setLoading(false);

    };

  const totalVolume =
    useMemo(() => {

      return leaders.reduce(
        (sum, user) =>
          sum + user.wealth,
        0
      );

    }, [leaders]);

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[36px] p-8 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="relative">

            <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
              LIVE MARKETPLACE RANKINGS
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-5 leading-[0.95]">
              Global
              <br />
              Leaderboard
            </h1>

            <p className="text-zinc-400 text-lg mt-8 max-w-2xl leading-relaxed">
              Real-time rankings of the richest fragment traders and marketplace creators.
            </p>

            {/* STATS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Ranked Users
                </p>

                <h2 className="text-5xl font-black mt-4">
                  {leaders.length}
                </h2>

              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Marketplace Wealth
                </p>

                <h2 className="text-cyan-400 text-5xl font-black mt-4">
                  ${totalVolume}
                </h2>

              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Cloud Status
                </p>

                <h2 className="text-green-400 text-5xl font-black mt-4">
                  LIVE
                </h2>

              </div>

            </div>

          </div>

        </section>

        {/* LOADING */}

        {loading && (

          <div className="mt-12 bg-white/[0.03] border border-white/10 rounded-[36px] p-20 text-center">

            <h2 className="text-5xl font-black">
              Loading Rankings...
            </h2>

          </div>

        )}

        {/* TOP USER */}

        {!loading &&
          leaders.length > 0 && (

          <section className="mt-12 bg-gradient-to-br from-cyan-400 to-cyan-300 text-black rounded-[36px] p-10 shadow-[0_0_80px_rgba(34,211,238,0.35)]">

            <p className="uppercase tracking-[0.3em] text-xs font-black">
              TOP MARKET LEADER
            </p>

            <h2 className="text-5xl md:text-7xl font-black mt-5 break-all">
              {leaders[0].email}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">

              <div>

                <p className="text-black/60 text-sm">
                  Total Wealth
                </p>

                <h3 className="text-5xl font-black mt-3">
                  ${leaders[0].wealth}
                </h3>

              </div>

              <div>

                <p className="text-black/60 text-sm">
                  Owned Fragments
                </p>

                <h3 className="text-5xl font-black mt-3">
                  {leaders[0].fragments}
                </h3>

              </div>

              <div>

                <p className="text-black/60 text-sm">
                  Legendary Listings
                </p>

                <h3 className="text-5xl font-black mt-3">
                  {leaders[0].legendary}
                </h3>

              </div>

            </div>

          </section>

        )}

        {/* RANKINGS */}

        <div className="space-y-6 mt-12">

          {leaders.map(
            (
              user,
              index
            ) => (

              <div
                key={index}
                className="group bg-white/[0.03] border border-white/10 hover:border-cyan-400/30 rounded-[32px] p-7 backdrop-blur-xl transition duration-500 hover:-translate-y-1"
              >

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

                  {/* LEFT */}

                  <div className="flex items-center gap-5">

                    <div className="w-20 h-20 rounded-3xl bg-cyan-400 text-black flex items-center justify-center text-3xl font-black shadow-[0_0_35px_rgba(34,211,238,0.35)]">

                      #{index + 1}

                    </div>

                    <div>

                      <p className="text-cyan-400 uppercase tracking-[0.25em] text-xs font-black">
                        MARKET TRADER
                      </p>

                      <h2 className="text-3xl md:text-4xl font-black mt-3 break-all">
                        {user.email}
                      </h2>

                      <p className="text-zinc-500 mt-3">
                        Premium realtime marketplace collector
                      </p>

                    </div>

                  </div>

                  {/* RIGHT */}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    <div>

                      <p className="text-zinc-500 text-sm">
                        Wealth
                      </p>

                      <h3 className="text-cyan-400 text-4xl font-black mt-3">
                        ${user.wealth}
                      </h3>

                    </div>

                    <div>

                      <p className="text-zinc-500 text-sm">
                        Fragments
                      </p>

                      <h3 className="text-4xl font-black mt-3">
                        {user.fragments}
                      </h3>

                    </div>

                    <div>

                      <p className="text-zinc-500 text-sm">
                        Legendary
                      </p>

                      <h3 className="text-yellow-400 text-4xl font-black mt-3">
                        {user.legendary}
                      </h3>

                    </div>

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </main>

  );
}