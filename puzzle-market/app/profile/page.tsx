"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

type InventoryItem = {
  id: number;
  fragment_id: string;
  title: string;
  image: string;
  piece: string;
  price: number;
};

type UploadedItem = {
  id: number;
  fragment_id: string;
  title: string;
  image: string;
  piece: string;
  price: number;
  rarity: string;
};

export default function ProfilePage() {

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [uploads, setUploads] =
    useState<UploadedItem[]>([]);

  const [balance, setBalance] =
    useState(0);

  const [username, setUsername] =
    useState("Guest");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadProfile();

  }, []);

  const loadProfile =
    async () => {

      const savedUser =
        localStorage.getItem(
          "puzzle-username"
        );

      if (!savedUser) {

        window.location.href =
          "/setup";

        return;

      }

      setUsername(savedUser);

      const {
        data: walletData,
      } =
        await supabase
          .from("wallets")
          .select("*")
          .eq(
            "username",
            savedUser
          )
          .single();

      if (walletData) {

        setBalance(
          walletData.balance
        );

      }

      const {
        data: inventoryData,
      } =
        await supabase
          .from("inventory")
          .select("*")
          .eq(
            "user_email",
            savedUser
          );

      if (inventoryData) {

        setInventory(
          inventoryData
        );

      }

      const {
        data: uploadData,
      } =
        await supabase
          .from("marketplace")
          .select("*")
          .eq(
            "seller_email",
            savedUser
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (uploadData) {

        setUploads(
          uploadData
        );

      }

      setLoading(false);

    };

  const totalValue =
    useMemo(() => {

      return inventory.reduce(
        (sum, item) =>
          sum + item.price,
        0
      );

    }, [inventory]);

  const rarityGlow = (
    rarity: string
  ) => {

    if (
      rarity ===
      "Legendary"
    ) {

      return "shadow-[0_0_40px_rgba(255,215,0,0.35)] border-yellow-400/30";

    }

    if (
      rarity === "Epic"
    ) {

      return "shadow-[0_0_40px_rgba(168,85,247,0.35)] border-purple-400/30";

    }

    return "shadow-[0_0_40px_rgba(34,211,238,0.25)] border-cyan-400/20";

  };

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[36px] p-8 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-10 relative">

            <div className="flex items-center gap-6">

              <div className="w-28 h-28 rounded-full bg-cyan-400 text-black flex items-center justify-center text-5xl font-black shadow-[0_0_50px_rgba(34,211,238,0.45)]">

                {username
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
                  Creator Dashboard
                </p>

                <h1 className="text-4xl md:text-6xl font-black mt-3 break-all">
                  {username}
                </h1>

                <p className="text-zinc-500 mt-4 max-w-xl">
                  Premium cloud fragment trader and live marketplace creator.
                </p>

                <div className="flex flex-wrap gap-3 mt-6">

                  <div className="bg-cyan-400 text-black px-4 py-2 rounded-full text-xs font-black">
                    VERIFIED CREATOR
                  </div>

                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-black">
                    LIVE MARKET MEMBER
                  </div>

                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-black">
                    REALTIME CLOUD SYNC
                  </div>

                </div>

              </div>

            </div>

            <Link
              href="/create"
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-8 py-5 rounded-3xl transition text-center text-lg shadow-[0_0_40px_rgba(34,211,238,0.35)]"
            >
              Upload New Fragment
            </Link>

          </div>

        </section>

        {/* STATS */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Owned Fragments
            </p>

            <h2 className="text-5xl font-black mt-4">
              {inventory.length}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Uploaded Fragments
            </p>

            <h2 className="text-5xl font-black mt-4">
              {uploads.length}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Wallet Balance
            </p>

            <h2 className="text-5xl font-black mt-4 text-cyan-400">
              ${balance}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Inventory Value
            </p>

            <h2 className="text-5xl font-black mt-4 text-green-400">
              ${totalValue}
            </h2>

          </div>

        </section>

      </div>

    </main>

  );

}