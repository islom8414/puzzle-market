"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

const methods = [
  {
    id: "visa_card",
    label: "Visa Card",
    hint: "Card number or masked card label",
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    hint: "Bank account or IBAN",
  },
  {
    id: "paypal",
    label: "PayPal",
    hint: "PayPal email",
  },
  {
    id: "usdt",
    label: "USDT",
    hint: "Wallet address and network",
  },
] as const;

type WithdrawalMethod =
  (typeof methods)[number]["id"];

type WithdrawalRequest = {
  id: string;
  amount_cents: number;
  method: WithdrawalMethod;
  destination_label: string;
  status: string;
  created_at: string;
};

function formatMoney(
  cents: number
) {
  return `$${(cents / 100).toFixed(2)}`;
}

function methodLabel(
  method: WithdrawalMethod
) {
  return (
    methods.find(
      (item) => item.id === method
    )?.label || method
  );
}

export default function WithdrawPage() {
  const [balance, setBalance] =
    useState(0);
  const [amount, setAmount] =
    useState("10");
  const [method, setMethod] =
    useState<WithdrawalMethod>(
      "visa_card"
    );
  const [destination, setDestination] =
    useState("");
  const [requests, setRequests] =
    useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  async function loadWithdrawals() {
    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      window.location.href =
        "/login";
      return;
    }

    const {
      data: account,
    } =
      await supabase
        .from("wallet_accounts")
        .select("balance_cents")
        .eq("user_id", user.id)
        .maybeSingle();

    setBalance(
      (account?.balance_cents || 0) /
        100
    );

    const {
      data: withdrawalData,
    } =
      await supabase
        .from(
          "wallet_withdrawal_requests"
        )
        .select(
          "id, amount_cents, method, destination_label, status, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

    setRequests(
      (withdrawalData ||
        []) as WithdrawalRequest[]
    );

    setLoading(false);
  }

  async function submitWithdrawal() {
    const value =
      Number(amount);

    if (
      !Number.isFinite(value) ||
      value < 1
    ) {
      alert(
        "Enter at least $1"
      );
      return;
    }

    if (value > balance) {
      alert(
        "Not enough wallet balance"
      );
      return;
    }

    const cleanDestination =
      destination.trim();

    if (
      cleanDestination.length < 4
    ) {
      alert(
        "Add payout details"
      );
      return;
    }

    setSubmitting(true);

    const {
      data: {
        session,
      },
    } =
      await supabase.auth.getSession();

    if (!session) {
      window.location.href =
        "/login";
      return;
    }

    const response =
      await fetch(
        "/api/request-withdrawal",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            amount: value,
            method,
            destination:
              cleanDestination,
          }),
        }
      );

    const data =
      await response.json();

    setSubmitting(false);

    if (!response.ok) {
      alert(
        data.error ||
          "Withdrawal failed"
      );
      return;
    }

    setDestination("");
    alert(
      "Withdrawal request created"
    );
    await loadWithdrawals();
  }

  const selectedMethod =
    methods.find(
      (item) => item.id === method
    ) || methods[0];

  return (
    <main className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
            Wallet Payout
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-6xl">
            Withdraw Funds
          </h1>

          <div className="mt-8 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
            <p className="text-sm text-zinc-400">
              Available Balance
            </p>
            <h2 className="mt-2 text-5xl font-black text-cyan-300">
              ${balance.toFixed(2)}
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {methods.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  setMethod(item.id)
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  method === item.id
                    ? "border-cyan-400 bg-cyan-400 text-black"
                    : "border-white/10 bg-white/[0.04] hover:border-cyan-400"
                }`}
              >
                <span className="block text-lg font-black">
                  {item.label}
                </span>
                <span
                  className={`mt-1 block text-sm ${
                    method === item.id
                      ? "text-black/70"
                      : "text-zinc-500"
                  }`}
                >
                  {item.hint}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[180px_1fr]">
            <label className="block">
              <span className="text-sm font-bold text-zinc-400">
                Amount
              </span>
              <input
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                inputMode="decimal"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-2xl font-black outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-zinc-400">
                {selectedMethod.hint}
              </span>
              <input
                value={destination}
                onChange={(event) =>
                  setDestination(
                    event.target.value
                  )
                }
                placeholder={
                  selectedMethod.hint
                }
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 outline-none focus:border-cyan-400"
              />
            </label>
          </div>

          <button
            onClick={submitWithdrawal}
            disabled={
              submitting || loading
            }
            className="mt-6 w-full rounded-2xl bg-cyan-400 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {submitting
              ? "Creating Request..."
              : "Request Withdrawal"}
          </button>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-zinc-950 p-6 md:p-8">
          <h2 className="text-3xl font-black">
            Withdrawal History
          </h2>

          <div className="mt-6 space-y-3">
            {requests.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-zinc-400">
                No withdrawal requests yet.
              </div>
            )}

            {requests.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black">
                      {methodLabel(
                        item.method
                      )}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {
                        item.destination_label
                      }
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-cyan-300">
                      {formatMoney(
                        item.amount_cents
                      )}
                    </p>
                    <p className="mt-1 text-xs font-black uppercase text-zinc-500">
                      {item.status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
