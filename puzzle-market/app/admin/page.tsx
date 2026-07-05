"use client";

import { useEffect, useMemo, useState } from "react";

import { puzzles } from "@/data/puzzles";
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

type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount_cents: number;
  method: string;
  destination_label: string;
  status: string;
  provider_reference?: string | null;
  provider_transfer_reference?: string | null;
  provider_error?: string | null;
  created_at: string;
  market_profiles?: {
    email?: string | null;
    username?: string | null;
  } | null;
};

type CustomPuzzleOrder = {
  id: string;
  created_at: string;
  user_id: string;
  status: string;
  amount_cents: number;
  title: string;
  description?: string | null;
  image_url?: string | null;
  category: string;
  rarity: string;
  piece_price_cents: number;
  market_piece_count: number;
  brand_name?: string | null;
  brand_country_code?: string | null;
  stripe_session_id?: string | null;
  profile?: {
    email?: string | null;
    username?: string | null;
  } | null;
};

export default function AdminPage() {

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [marketplace, setMarketplace] =
    useState<MarketplaceItem[]>([]);

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [
    withdrawals,
    setWithdrawals,
  ] = useState<WithdrawalRequest[]>(
    []
  );

  const [
    customOrders,
    setCustomOrders,
  ] = useState<CustomPuzzleOrder[]>(
    []
  );

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
          session,
        },
      } =
        await supabase.auth
          .getSession();

      if (!session) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const statusResponse =
        await fetch(
          "/api/admin-status",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      const status =
        await statusResponse.json();

      const isAdmin =
        status.allowed === true;

      setAllowed(isAdmin);

      if (!isAdmin) {
        setLoading(false);
        return;
      }

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

      const withdrawalResponse =
        await fetch(
          "/api/admin/withdrawals",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      if (withdrawalResponse.ok) {
        const withdrawalJson =
          await withdrawalResponse.json();

        setWithdrawals(
          withdrawalJson.withdrawals ||
            []
        );
      }

      const orderResponse =
        await fetch(
          "/api/admin/custom-orders",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      if (orderResponse.ok) {
        const orderJson =
          await orderResponse.json();

        setCustomOrders(
          orderJson.orders || []
        );
      }

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

  const updateWithdrawal =
    async (
      withdrawalId: string,
      action:
        | "processing"
        | "paid"
        | "failed_refund"
    ) => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth
          .getSession();

      if (!session) {
        alert("Login first");
        return;
      }

      const reference =
        action === "paid"
          ? window.prompt(
              "Provider reference, for example Paysend transaction ID",
              "manual_paysend"
            ) || ""
          : "";
      const note =
        action !== "paid"
          ? window.prompt(
              "Admin note",
              action ===
                "failed_refund"
                ? "Manual payout failed and was refunded"
                : "Manual payout is being processed"
            ) || ""
          : window.prompt(
              "Optional transfer note",
              ""
            ) || "";

      const response =
        await fetch(
          "/api/admin/withdrawals",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              withdrawalId,
              action,
              reference,
              note,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Withdrawal update failed"
        );
        return;
      }

      await loadAdmin();
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

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[36px] p-5 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="relative">

            <p className="text-cyan-400 uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs font-black">
              MARKETPLACE ADMIN
            </p>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mt-4 md:mt-5 leading-[0.95]">
              Admin
              <br />
              Dashboard
            </h1>

            <p className="text-zinc-400 text-base md:text-lg mt-6 md:mt-8 max-w-2xl leading-relaxed">
              Realtime marketplace monitoring, transaction analytics and platform statistics.
            </p>

          </div>

        </section>

        {/* STATS */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-10">

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6">

            <p className="text-zinc-500 text-sm">
              Total Revenue
            </p>

            <h2 className="text-cyan-400 text-4xl md:text-5xl font-black mt-4">
              ${totalRevenue}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6">

            <p className="text-zinc-500 text-sm">
              Transactions
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              {transactions.length}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6">

            <p className="text-zinc-500 text-sm">
              Active Users
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              {uniqueUsers}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6">

            <p className="text-zinc-500 text-sm">
              Legendary Listings
            </p>

            <h2 className="text-yellow-400 text-4xl md:text-5xl font-black mt-4">
              {legendaryCount}
            </h2>

          </div>

        </section>

        {/* MISSING PIECE PRICE */}

        <section className="mt-12 md:mt-16 bg-white/[0.03] border border-cyan-400/20 rounded-[24px] md:rounded-[36px] p-5 md:p-10 backdrop-blur-xl">

          <p className="text-cyan-400 uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs font-black">
            OWNER CONTROLS
          </p>

          <h2 className="text-3xl md:text-5xl font-black mt-3">
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

        {/* CUSTOM PUZZLE ORDERS */}

        <section className="mt-12 md:mt-16 bg-white/[0.03] border border-cyan-400/20 rounded-[24px] md:rounded-[36px] p-5 md:p-10 backdrop-blur-xl">

          <p className="text-cyan-400 uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs font-black">
            CUSTOM ORDERS
          </p>

          <h2 className="text-3xl md:text-5xl font-black mt-3">
            Paid Puzzle Requests
          </h2>

          <p className="text-zinc-400 mt-5 max-w-3xl">
            Starter, Premium, and Creator members can pay $50 for a custom puzzle setup request. Review the image, description, requested title, piece count, and initial piece price before publishing.
          </p>

          <div className="mt-8 space-y-4">
            {customOrders.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
                No custom puzzle orders yet.
              </div>
            )}

            {customOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-3xl border border-white/10 bg-black/50 p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                    {order.image_url ? (
                      <img
                        src={order.image_url}
                        alt={order.title}
                        className="h-56 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-56 items-center justify-center px-5 text-center text-sm font-bold text-zinc-500">
                        Description only
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black">
                        {order.status}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-zinc-300">
                        ${(order.amount_cents / 100).toFixed(2)} setup
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-zinc-300">
                        {order.market_piece_count} pieces
                      </span>
                    </div>

                    <h3 className="mt-4 break-words text-2xl font-black md:text-3xl">
                      {order.title}
                    </h3>

                    <div className="mt-3 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
                      <div>
                        <span className="text-zinc-500">User:</span>{" "}
                        {order.profile?.email ||
                          order.profile?.username ||
                          order.user_id}
                      </div>
                      <div>
                        <span className="text-zinc-500">Category:</span>{" "}
                        {order.category}
                      </div>
                      <div>
                        <span className="text-zinc-500">Rarity:</span>{" "}
                        {order.rarity}
                      </div>
                      <div>
                        <span className="text-zinc-500">Piece price:</span>{" "}
                        ${(order.piece_price_cents / 100).toFixed(2)}
                      </div>
                      <div>
                        <span className="text-zinc-500">Brand:</span>{" "}
                        {order.brand_name || "Regular"}
                      </div>
                      <div>
                        <span className="text-zinc-500">Created:</span>{" "}
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>

                    {order.description && (
                      <p className="mt-4 whitespace-pre-wrap break-words rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-300">
                        {order.description}
                      </p>
                    )}

                    {order.stripe_session_id && (
                      <p className="mt-4 break-all text-xs text-zinc-500">
                        Stripe session: {order.stripe_session_id}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

        </section>

        {/* WITHDRAWALS */}

        <section className="mt-12 md:mt-16 bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[36px] p-5 md:p-10 backdrop-blur-xl">

          <p className="text-cyan-400 uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs font-black">
            PAYOUT OPERATIONS
          </p>

          <h2 className="text-3xl md:text-5xl font-black mt-3">
            Withdrawal Requests
          </h2>

          <p className="text-zinc-400 mt-5 max-w-3xl">
            Manual card payouts should be reviewed within 3 business days. The requested amount is already reserved from the user balance. Mark Paid only after sending the transfer; Fail + Refund automatically returns the full amount to the user balance.
          </p>

          <div className="mt-8 space-y-4">
            {withdrawals.length ===
              0 && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5 text-zinc-400">
                No withdrawal requests yet.
              </div>
            )}

            {withdrawals.map(
              (item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-black/50 p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-black">
                          {item.status}
                        </span>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-zinc-300">
                          {item.method}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-black md:text-3xl">
                        $
                        {(
                          item.amount_cents /
                          100
                        ).toFixed(2)}
                      </h3>

                      <p className="mt-3 break-words text-sm leading-6 text-zinc-300">
                        {
                          item.destination_label
                        }
                      </p>

                      <p className="mt-3 text-sm text-zinc-500">
                        User:{" "}
                        <span className="text-zinc-300">
                          {item.market_profiles
                            ?.email ||
                            item.market_profiles
                              ?.username ||
                            item.user_id}
                        </span>
                      </p>

                      {item.provider_error && (
                        <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">
                          {
                            item.provider_error
                          }
                        </p>
                      )}
                    </div>

                    <div className="grid shrink-0 gap-2 sm:grid-cols-3 xl:w-[420px]">
                      <button
                        onClick={() =>
                          updateWithdrawal(
                            item.id,
                            "processing"
                          )
                        }
                        disabled={
                          ![
                            "pending",
                            "processing",
                          ].includes(
                            item.status
                          )
                        }
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-black text-white disabled:opacity-40"
                      >
                        Processing
                      </button>

                      <button
                        onClick={() =>
                          updateWithdrawal(
                            item.id,
                            "paid"
                          )
                        }
                        disabled={
                          ![
                            "pending",
                            "processing",
                          ].includes(
                            item.status
                          )
                        }
                        className="rounded-2xl bg-cyan-400 px-4 py-3 font-black text-black disabled:opacity-40"
                      >
                        Paid
                      </button>

                      <button
                        onClick={() =>
                          updateWithdrawal(
                            item.id,
                            "failed_refund"
                          )
                        }
                        disabled={
                          ![
                            "pending",
                            "processing",
                          ].includes(
                            item.status
                          )
                        }
                        className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-black text-red-200 disabled:opacity-40"
                      >
                        Reject + Refund
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

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

                      <p className="text-zinc-500 mt-4">
                        Seller: Puzzle Market Vault
                      </p>

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
