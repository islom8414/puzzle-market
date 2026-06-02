"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function AddFundsPage() {

  const [loading, setLoading] =
    useState(false);

  async function topup(
    amount: number
  ) {

    try {

      setLoading(true);

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

      const fallbackUsername =
        session.user.email
          ?.split("@")[0]
          ?.replace(
            /[^a-zA-Z0-9_-]/g,
            ""
          )
          ?.slice(0, 40) ||
        "PuzzleUser";

      const username =
        localStorage.getItem(
          "puzzle-username"
        ) ||
        fallbackUsername;

      localStorage.setItem(
        "puzzle-username",
        username
      );

      const response =
        await fetch(
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
              amount,
              username,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        alert(
          data.error ||
          "Stripe checkout failed"
        );

        return;

      }

      if (data.url) {

        window.location.href =
          data.url;

      } else {

        alert(
          "Stripe checkout failed"
        );

      }

    } catch (error) {

      console.log(error);

      alert(
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

        <div className="flex flex-col gap-4">

          <button
            onClick={() => topup(1)}
            disabled={loading}
            className="bg-zinc-900 hover:bg-cyan-500 transition-all rounded-2xl py-4 md:py-5 text-2xl md:text-3xl font-black"
          >
            $1
          </button>

          <button
            onClick={() => topup(10)}
            disabled={loading}
            className="bg-zinc-900 hover:bg-cyan-500 transition-all rounded-2xl py-4 md:py-5 text-2xl md:text-3xl font-black"
          >
            $10
          </button>

          <button
            onClick={() => topup(50)}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-400 text-black transition-all rounded-2xl py-4 md:py-5 text-2xl md:text-3xl font-black"
          >
            $50
          </button>

          <button
            onClick={() => topup(100)}
            disabled={loading}
            className="bg-zinc-900 hover:bg-cyan-500 transition-all rounded-2xl py-4 md:py-5 text-2xl md:text-3xl font-black"
          >
            $100
          </button>

        </div>

        {loading && (

          <p className="text-center text-cyan-400 mt-6 text-sm">
            Redirecting to Stripe...
          </p>

        )}

      </div>

    </main>

  );

}
