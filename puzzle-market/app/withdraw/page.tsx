"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

const methods = [
  {
    id: "stripe_instant",
    label: "Instant to Visa",
    hint: "Stripe sends to an eligible debit card or bank account.",
  },
  {
    id: "stripe_standard",
    label: "Standard Payout",
    hint: "Stripe sends to the connected payout account on normal timing.",
  },
] as const;

type WithdrawalMethod =
  (typeof methods)[number]["id"];

type ConnectStatus = {
  connected: boolean;
  ready: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  requirementsDue?: string[];
  error?: string;
};

type WithdrawalRequest = {
  id: string;
  amount_cents: number;
  method: WithdrawalMethod;
  destination_label: string;
  status: string;
  provider_reference?: string | null;
  provider_error?: string | null;
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
      "stripe_instant"
    );
  const [connectStatus, setConnectStatus] =
    useState<ConnectStatus>({
      connected: false,
      ready: false,
    });
  const [requests, setRequests] =
    useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [connecting, setConnecting] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    loadWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getSessionOrLogin() {
    const {
      data: {
        session,
      },
    } =
      await supabase.auth.getSession();

    if (!session) {
      window.location.href =
        "/login";
      return null;
    }

    return session;
  }

  async function loadWithdrawals() {
    const session =
      await getSessionOrLogin();

    if (!session) {
      return;
    }

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

    const [
      accountResult,
      withdrawalResult,
      statusResponse,
    ] =
      await Promise.all([
        supabase
          .from("wallet_accounts")
          .select("balance_cents")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from(
            "wallet_withdrawal_requests"
          )
          .select(
            "id, amount_cents, method, destination_label, status, provider_reference, provider_error, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          }),
        fetch(
          "/api/stripe/connect-status",
          {
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        ),
      ]);

    setBalance(
      (accountResult.data
        ?.balance_cents || 0) / 100
    );

    setRequests(
      (withdrawalResult.data ||
        []) as WithdrawalRequest[]
    );

    if (statusResponse.ok) {
      setConnectStatus(
        await statusResponse.json()
      );
    }

    setLoading(false);
  }

  async function connectStripe() {
    setConnecting(true);

    const session =
      await getSessionOrLogin();

    if (!session) {
      return;
    }

    const response =
      await fetch(
        "/api/stripe/connect-onboarding",
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

    const data =
      await response.json();

    setConnecting(false);

    if (!response.ok) {
      alert(
        data.error ||
          "Stripe connection failed"
      );
      return;
    }

    window.location.href =
      data.url;
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

    if (!connectStatus.ready) {
      alert(
        "Connect and finish Stripe payout setup first"
      );
      return;
    }

    setSubmitting(true);

    const session =
      await getSessionOrLogin();

    if (!session) {
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
      await loadWithdrawals();
      return;
    }

    alert(
      "Payout sent through Stripe"
    );
    await loadWithdrawals();
  }

  const readyLabel =
    connectStatus.ready
      ? "Ready for automatic payouts"
      : connectStatus.connected
        ? "Finish payout setup"
        : "Stripe payout account required";

  return (
    <main className="min-h-screen bg-black px-4 py-8 md:py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-[24px] md:rounded-[30px] border border-white/10 bg-white/[0.03] p-5 md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] md:tracking-[0.3em] text-cyan-400">
            Wallet Payout
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-6xl">
            Withdraw Funds
          </h1>

          <div className="mt-6 md:mt-8 rounded-2xl md:rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
            <p className="text-sm text-zinc-400">
              Available Balance
            </p>
            <h2 className="mt-2 text-4xl md:text-5xl font-black text-cyan-300">
              ${balance.toFixed(2)}
            </h2>
          </div>

          <div className="mt-6 rounded-2xl md:rounded-3xl border border-white/10 bg-zinc-950 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-cyan-300">
                  Stripe Connect
                </p>
                <h2 className="mt-2 text-xl md:text-2xl font-black">
                  {readyLabel}
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Add your Visa debit card or bank account inside Stripe. Puzzle Market never stores card numbers.
                </p>
              </div>

              <button
                onClick={connectStripe}
                disabled={connecting}
                className="rounded-2xl bg-white px-5 py-3 font-black text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {connecting
                  ? "Opening..."
                  : connectStatus.connected
                    ? "Update Stripe"
                    : "Connect Stripe"}
              </button>
            </div>
          </div>

          <div className="mt-6 md:mt-8 grid gap-4 sm:grid-cols-2">
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

          <label className="mt-6 md:mt-8 block">
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
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black px-4 py-4 text-xl md:text-2xl font-black outline-none focus:border-cyan-400"
            />
          </label>

          <button
            onClick={submitWithdrawal}
            disabled={
              submitting ||
              loading ||
              !connectStatus.ready
            }
            className="mt-6 w-full rounded-2xl bg-cyan-400 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {submitting
              ? "Sending Payout..."
              : "Send Automatic Payout"}
          </button>
        </section>

        <section className="rounded-[24px] md:rounded-[30px] border border-white/10 bg-zinc-950 p-5 md:p-8">
          <h2 className="text-2xl md:text-3xl font-black">
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
                    {item.provider_error && (
                      <p className="mt-2 text-sm text-red-300">
                        {item.provider_error}
                      </p>
                    )}
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
