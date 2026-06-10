"use client";

import { useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

export default function AddFundsPage() {

  const [loading, setLoading] =
    useState(false);

  const [amount, setAmount] =
    useState("");

  const [message, setMessage] =
    useState("");

  async function topup(
    requestedAmount?: number
  ) {

    const topupAmount =
      requestedAmount ??
      Number(amount);

    if (
      !Number.isFinite(topupAmount) ||
      topupAmount < 1 ||
      topupAmount > 10000 ||
      !Number.isInteger(
        topupAmount * 100
      )
    ) {
      setMessage(
        "Enter an amount from $1 to $10,000 with no more than 2 decimal places."
      );
      return;
    }

    try {

      setLoading(true);
      setMessage("");

      const {
        data: {
          session,
        },
      } =
        await supabase.auth
          .getSession();

      if (!session) {
        alert(
          "Login required"
        );

        window.location.href =
          "/login";

        return;
      }

      const response =
        await apiFetch(
          "/api/create-checkout-session",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              amount:
                topupAmount,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        setMessage(
          data.error ||
            "Stripe checkout failed"
        );

        return;

      }

      if (data.url) {

        window.location.href =
          data.url;

      } else {

        setMessage(
          "Stripe checkout failed"
        );

      }

    } catch (error) {

      console.log(error);

      setMessage(
        "Something went wrong"
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-zinc-950 border border-cyan-500/30 rounded-[24px] md:rounded-3xl p-5 md:p-8 shadow-2xl">

        <p className="text-cyan-400 text-xs tracking-[0.18em] md:tracking-[5px] mb-2 uppercase">
          Wallet Topup
        </p>

        <h1 className="text-4xl md:text-5xl font-black mb-3">
          Add Funds
        </h1>

        <p className="text-zinc-400 mb-8 text-sm">
          Securely top up your Puzzle Market wallet using Visa or Mastercard.
        </p>

        <label className="block">
          <span className="text-sm font-bold text-zinc-300">
            Amount in USD
          </span>

          <div className="mt-2 flex h-16 items-center rounded-lg border border-white/15 bg-black px-5 focus-within:border-cyan-400">
            <span className="text-2xl font-black text-cyan-400">
              $
            </span>

            <input
              type="number"
              min="1"
              max="10000"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(
                  event.target.value
                );
                setMessage("");
              }}
              placeholder="25.00"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-2xl font-black text-white outline-none"
            />
          </div>
        </label>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() =>
              setAmount("5")
            }
            disabled={loading}
            className="h-11 rounded-lg border border-white/10 bg-zinc-900 text-sm font-black hover:border-cyan-400"
          >
            $5
          </button>

          <button
            type="button"
            onClick={() =>
              setAmount("10")
            }
            disabled={loading}
            className="h-11 rounded-lg border border-white/10 bg-zinc-900 text-sm font-black hover:border-cyan-400"
          >
            $10
          </button>

          <button
            type="button"
            onClick={() =>
              setAmount("50")
            }
            disabled={loading}
            className="h-11 rounded-lg border border-white/10 bg-zinc-900 text-sm font-black hover:border-cyan-400"
          >
            $50
          </button>

          <button
            type="button"
            onClick={() =>
              setAmount("100")
            }
            disabled={loading}
            className="h-11 rounded-lg border border-white/10 bg-zinc-900 text-sm font-black hover:border-cyan-400"
          >
            $100
          </button>
        </div>

        <button
          type="button"
          onClick={() => topup()}
          disabled={loading}
          className="mt-5 h-14 w-full rounded-lg bg-cyan-400 text-lg font-black text-black transition hover:bg-cyan-300 disabled:opacity-60"
        >
          {loading
            ? "Redirecting to Stripe..."
            : amount &&
                Number(amount) >= 1
              ? `Add $${amount}`
              : "Continue To Payment"}
        </button>

        {message && (
          <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">
            {message}
          </p>
        )}

      </div>

    </main>

  );

}
