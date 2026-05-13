"use client";

import { useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type Transaction = {

  id?: number;

  buyer_email: string;

  seller_email: string;

  fragment_id: string;

  title: string;

  price: number;

  created_at?: string;

};

export default function ActivityPage() {

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadTransactions();

    const channel =
      supabase
        .channel(
          "live-transactions"
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

            loadTransactions();

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  const loadTransactions =
    async () => {

      const {
        data,
        error,
      } =
        await supabase
          .from("transactions")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (!error && data) {

        setTransactions(data);

      }

      setLoading(false);

    };

  const totalVolume =
    useMemo(() => {

      return transactions.reduce(
        (sum, tx) =>
          sum + tx.price,
        0
      );

    }, [transactions]);

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
              REALTIME MARKETPLACE
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-5 leading-[0.95]">
              Transaction
              <br />
              Activity Feed
            </h1>

            <p className="text-zinc-400 text-lg mt-8 max-w-2xl leading-relaxed">
              Live cloud synced purchases, fragment trades and marketplace ownership transfers.
            </p>

            {/* STATS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Total Transactions
                </p>

                <h2 className="text-5xl font-black mt-4">
                  {
                    transactions.length
                  }
                </h2>

              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Marketplace Volume
                </p>

                <h2 className="text-cyan-400 text-5xl font-black mt-4">
                  $
                  {totalVolume}
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
              Loading Activity...
            </h2>

          </div>

        )}

        {/* EMPTY */}

        {!loading &&
          transactions.length ===
            0 && (

          <div className="mt-12 bg-white/[0.03] border border-white/10 rounded-[36px] p-20 text-center">

            <h2 className="text-5xl font-black">
              No Activity Yet
            </h2>

            <p className="text-zinc-500 mt-5 text-lg">
              Marketplace purchases will appear here live.
            </p>

          </div>

        )}

        {/* FEED */}

        <div className="space-y-6 mt-12">

          {transactions.map(
            (
              transaction,
              index
            ) => (

              <div
                key={index}
                className="group bg-white/[0.03] border border-white/10 hover:border-cyan-400/30 rounded-[32px] p-7 backdrop-blur-xl transition duration-500 hover:-translate-y-1"
              >

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

                  {/* LEFT */}

                  <div className="flex items-start gap-5">

                    <div className="w-16 h-16 rounded-3xl bg-cyan-400 text-black flex items-center justify-center text-2xl font-black shadow-[0_0_35px_rgba(34,211,238,0.35)]">

                      $
                    </div>

                    <div>

                      <div className="flex flex-wrap items-center gap-3">

                        <div className="bg-cyan-400 text-black px-4 py-2 rounded-full text-xs font-black">
                          PURCHASE
                        </div>

                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-black">
                          LIVE TRANSACTION
                        </div>

                      </div>

                      <h2 className="text-3xl md:text-4xl font-black mt-5">
                        {
                          transaction.title
                        }
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

                        <div>

                          <p className="text-zinc-500 text-sm">
                            Buyer
                          </p>

                          <h3 className="font-black mt-2 break-all">
                            {
                              transaction.buyer_email
                            }
                          </h3>

                        </div>

                        <div>

                          <p className="text-zinc-500 text-sm">
                            Seller
                          </p>

                          <h3 className="font-black mt-2 break-all">
                            {
                              transaction.seller_email
                            }
                          </h3>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* RIGHT */}

                  <div className="xl:text-right">

                    <p className="text-zinc-500 text-sm">
                      Transaction Value
                    </p>

                    <h3 className="text-cyan-400 text-5xl font-black mt-3">
                      $
                      {
                        transaction.price
                      }
                    </h3>

                    <p className="text-zinc-500 text-sm mt-4">
                      {
                        transaction.created_at
                          ? new Date(
                              transaction.created_at
                            ).toLocaleString()
                          : "LIVE"
                      }
                    </p>

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