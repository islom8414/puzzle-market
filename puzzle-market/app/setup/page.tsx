"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

export default function SetupPage() {

  const [nickname, setNickname] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const router =
    useRouter();

  const saveProfile =
    async () => {

      if (
        nickname.trim().length < 3
      ) {

        alert(
          "Nickname too short"
        );

        return;

      }

      setLoading(true);

      localStorage.setItem(
        "puzzle-username",
        nickname
      );

      const {
        data: existingWallet,
      } =
        await supabase
          .from("wallets")
          .select("*")
          .eq(
            "username",
            nickname
          )
          .single();

      if (!existingWallet) {

        await supabase
          .from("wallets")
          .insert([
            {
              username:
                nickname,
              balance: 10000,
            },
          ]);

      }

      localStorage.setItem(
        "puzzle-balance",
        "10000"
      );

      router.push(
        "/profile"
      );

    };

  return (

    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 overflow-hidden">

      {/* BG */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)] pointer-events-none" />

      <div className="relative w-full max-w-xl bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12 backdrop-blur-xl">

        <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
          PROFILE SETUP
        </p>

        <h1 className="text-5xl md:text-6xl font-black mt-5 leading-none">
          Choose
          <br />
          Nickname
        </h1>

        <p className="text-zinc-500 mt-6 text-lg leading-relaxed">
          Your nickname will appear in marketplace, realtime chat and ownership system.
        </p>

        <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-3xl p-5 mt-8">

          <p className="text-cyan-400 text-sm font-black uppercase">
            Starter Wallet
          </p>

          <h2 className="text-5xl font-black mt-3">
            $10,000
          </h2>

        </div>

        <input
          value={nickname}
          onChange={(e) =>
            setNickname(
              e.target.value
            )
          }
          placeholder="ShadowUser"
          className="w-full mt-10 bg-black/40 border border-white/10 rounded-3xl px-6 py-5 text-lg outline-none focus:border-cyan-400"
        />

        <button
          onClick={saveProfile}
          disabled={loading}
          className="w-full mt-8 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-black py-5 rounded-3xl transition text-lg"
        >

          {loading
            ? "Creating Wallet..."
            : "Create Profile"}

        </button>

      </div>

    </main>

  );
}