"use client";

import { useEffect, useMemo, useState } from "react";

import { puzzles } from "@/data/puzzles";
import { supabase } from "@/lib/supabase";

const adminEmails = [
  "islommatchanov888@gmail.com",
  "ismatchanov08@gmail.com",
];

type Transaction = {

  id?: number;

  buyer_email: string;

  seller_email: string;

  fragment_id: string;

  title: string;

  price: number;

  created_at?: string;

};

type MarketplaceItem = {

  id: number;

  seller_email: string;

  title: string;

  rarity: string;

  price: number;

};

type InventoryItem = {

  id: number;

  user_email: string;

  price: number;

};

export default function AdminPage() {

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [marketplace, setMarketplace] =
    useState<MarketplaceItem[]>([]);

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  const [selectedPuzzle, setSelectedPuzzle] =
    useState(
      puzzles[0]?.slug || ""
    );

  const [missingPrice, setMissingPrice] =
    useState("");

  const [savingPrice, setSavingPrice] =
    useState(false);

  const [resetBeforeSaving, setResetBeforeSaving] =
    useState(false);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/immutability
    loadAdmin();

    const channel =
      supabase
        .channel(
          "admin-live"
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

            loadAdmin();

          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "marketplace",
          },
          () => {

            loadAdmin();

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  const loadAdmin =
    async () => {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      const isAdmin =
        !!user?.email &&
        adminEmails.includes(
          user.email
        );

      setAllowed(isAdmin);

      const {
        data: txData,
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

      const {
        data: marketData,
      } =
        await supabase
          .from("marketplace")
          .select("*");

      const {
        data: inventoryData,
      } =
        await supabase
          .from("inventory")
          .select("*");

      if (txData) {

        setTransactions(
          txData
        );

      }

      if (marketData) {

        setMarketplace(
          marketData
        );

      }

      if (inventoryData) {

        setInventory(
          inventoryData
        );

      }

      setLoading(false);

    };

  const saveMissingPiecePrice =
    async () => {
      if (!allowed) {
        alert("Admin only");
        return;
      }

      if (
        !selectedPuzzle ||
        !missingPrice
      ) {
        alert(
          "Choose puzzle and price"
        );
        return;
      }

      setSavingPrice(true);

      const {
        data: {
          session,
        },
      } =
        await supabase.auth
          .getSession();

      if (!session) {
        alert("Login first");
        location.href = "/login";
        return;
      }

      const response =
        await fetch(
          "/api/admin-piece-price",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              puzzleSlug:
                selectedPuzzle,
              price: Number(
                missingPrice
              ),
              resetPuzzle:
                resetBeforeSaving,
            }),
          }
        );

      const data =
        await response.json();

      setSavingPrice(false);

      if (!response.ok) {
        alert(
          data.error ||
          "Price update failed"
        );
        return;
      }

      alert(
        `Missing piece price saved: $${data.price}`
      );
    };

  const totalRevenue =
    useMemo(() => {

      return transactions.reduce(
        (sum, tx) =>
          sum + tx.price,
        0
      );

    }, [transactions]);

  const uniqueUsers =
    useMemo(() => {

      const users =
        new Set<string>();

      inventory.forEach(
        (item) => {

          users.add(
            item.user_email
          );

        }
      );

      transactions.forEach(
        (tx) => {

          users.add(
            tx.buyer_email
          );

          users.add(
            tx.seller_email
          );

        }
      );

      return users.size;

    }, [
      inventory,
      transactions,
    ]);

  const legendaryCount =
    useMemo(() => {

      return marketplace.filter(
        (item) =>
          item.rarity ===
          "Legendary"
      ).length;

    }, [marketplace]);

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BG */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[36px] p-8 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="relative">

            <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
              MARKETPLACE ADMIN
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-5 leading-[0.95]">
              Admin
              <br />
              Dashboard
            </h1>

            <p className="text-zinc-400 text-lg mt-8 max-w-2xl leading-relaxed">
              Realtime marketplace monitoring, transaction analytics and platform statistics.
            </p>

          </div>

        </section>

        {/* STATS */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6">

            <p className="text-zinc-500 text-sm">
              Total Revenue
            </p>

            <h2 className="text-cyan-400 text-5xl font-black mt-4">
              ${totalRevenue}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6">

            <p className="text-zinc-500 text-sm">
              Transactions
            </p>

            <h2 className="text-5xl font-black mt-4">
              {transactions.length}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6">

            <p className="text-zinc-500 text-sm">
              Active Users
            </p>

            <h2 className="text-5xl font-black mt-4">
              {uniqueUsers}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6">

            <p className="text-zinc-500 text-sm">
              Legendary Listings
            </p>

            <h2 className="text-yellow-400 text-5xl font-black mt-4">
              {legendaryCount}
            </h2>

          </div>

        </section>

        {/* MISSING PIECE PRICE */}

        <section className="mt-16 bg-white/[0.03] border border-cyan-400/20 rounded-[36px] p-8 md:p-10 backdrop-blur-xl">

          <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
            OWNER CONTROLS
          </p>

          <h2 className="text-5xl font-black mt-3">
            Missing Piece Price
          </h2>

          <p className="text-zinc-400 mt-5 max-w-2xl">
            Set the first sale price for the exact missing piece. After a buyer owns it, only that owner can resell it at their own price.
          </p>

          {!allowed && (
            <div className="mt-8 bg-red-500/10 border border-red-400/20 rounded-2xl p-5 text-red-200 font-black">
              Login with the owner email to edit prices.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-4 mt-8">
            <select
              value={selectedPuzzle}
              onChange={(event) =>
                setSelectedPuzzle(
                  event.target.value
                )
              }
              disabled={!allowed}
              className="bg-black/50 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
            >
              {puzzles.map((puzzle) => (
                <option
                  key={puzzle.slug}
                  value={puzzle.slug}
                >
                  {puzzle.title}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={missingPrice}
              onChange={(event) =>
                setMissingPrice(
                  event.target.value
                )
              }
              disabled={!allowed}
              placeholder="$ price"
              className="bg-black/50 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
            />

            <button
              onClick={
                saveMissingPiecePrice
              }
              disabled={
                !allowed ||
                savingPrice
              }
              className="bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-black px-7 py-4 rounded-2xl"
            >
              {savingPrice
                ? "Saving..."
                : "Save Price"}
            </button>
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={
                resetBeforeSaving
              }
              onChange={(event) =>
                setResetBeforeSaving(
                  event.target.checked
                )
              }
              disabled={!allowed}
              className="h-5 w-5"
            />
            Reset this puzzle test ownership back to admin before saving price
          </label>

        </section>

        {/* LIVE MARKET */}

        <section className="mt-16">

          <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
            LIVE MARKETPLACE
          </p>

          <h2 className="text-5xl font-black mt-3">
            Active Listings
          </h2>

          <div className="space-y-5 mt-10">

            {marketplace.map(
              (item) => (

                <div
                  key={item.id}
                  className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6 backdrop-blur-xl"
                >

                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

                    <div>

                      <div className="flex flex-wrap gap-3">

                        <div className="bg-green-400 text-black px-4 py-2 rounded-full text-xs font-black">
                          LIVE
                        </div>

                        <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-full text-xs font-black">
                          {item.rarity}
                        </div>

                      </div>

                      <h2 className="text-4xl font-black mt-5">
                        {item.title}
                      </h2>

                      <p className="text-zinc-500 mt-4 break-all">
                        Seller: {localStorage.getItem("puzzle-username") || "ShadowUser"}                     </p>

                    </div>

                    <div>

                      <p className="text-zinc-500 text-sm">
                        Listing Price
                      </p>

                      <h2 className="text-cyan-400 text-5xl font-black mt-3">
                        ${item.price}
                      </h2>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

        {/* TRANSACTIONS */}

        <section className="mt-20">

          <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
            REALTIME ACTIVITY
          </p>

          <h2 className="text-5xl font-black mt-3">
            Latest Transactions
          </h2>

          {loading && (

            <div className="mt-10 bg-white/[0.03] border border-white/10 rounded-[36px] p-20 text-center">

              <h2 className="text-5xl font-black">
                Loading Dashboard...
              </h2>

            </div>

          )}

          <div className="space-y-5 mt-10">

            {transactions.map(
              (tx, index) => (

                <div
                  key={index}
                  className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6 backdrop-blur-xl"
                >

                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">

                    <div>

                      <div className="flex flex-wrap gap-3">

                        <div className="bg-cyan-400 text-black px-4 py-2 rounded-full text-xs font-black">
                          PURCHASE
                        </div>

                        <div className="bg-green-400 text-black px-4 py-2 rounded-full text-xs font-black">
                          COMPLETED
                        </div>

                      </div>

                      <h2 className="text-4xl font-black mt-5">
                        {tx.title}
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

                        <div>

                          <p className="text-zinc-500 text-sm">
                            Buyer
                          </p>

                          <h3 className="font-black mt-2 break-all">
                            {tx.buyer_email}
                          </h3>

                        </div>

                        <div>

                          <p className="text-zinc-500 text-sm">
                            Seller
                          </p>

                          <h3 className="font-black mt-2 break-all">
                            {tx.seller_email}
                          </h3>

                        </div>

                      </div>

                    </div>

                    <div>

                      <p className="text-zinc-500 text-sm">
                        Transaction Value
                      </p>

                      <h2 className="text-cyan-400 text-5xl font-black mt-3">
                        ${tx.price}
                      </h2>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      </div>

    </main>

  );
}
