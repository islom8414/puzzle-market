"use client";

import { useEffect, useState } from "react";

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
    useState(8420);

  const [username, setUsername] =
    useState("Guest");

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadProfile();

  }, []);

  const loadProfile =
    async () => {

      const savedBalance =
        localStorage.getItem(
          "puzzle-balance"
        );

      const savedUser =
        localStorage.getItem(
          "puzzle-user"
        );

      if (savedBalance) {

        setBalance(
          Number(savedBalance)
        );

      }

      if (!savedUser) {

        window.location.href =
          "/login";

        return;

      }

      setUsername(savedUser);

      /* INVENTORY */

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

      /* USER UPLOADS */

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

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-7xl mx-auto">

        {/* PROFILE */}

        <div className="bg-zinc-950/70 border border-white/10 rounded-3xl p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div className="flex items-center gap-5">

              <div className="w-20 h-20 rounded-full bg-cyan-400 flex items-center justify-center text-black text-4xl font-black">
                {username.charAt(0).toUpperCase()}
              </div>

              <div>

                <h1 className="text-3xl md:text-5xl font-black uppercase break-all">
                  {username}
                </h1>

                <p className="text-zinc-500 mt-2 text-sm">
                  Premium Puzzle Creator
                </p>

                <div className="flex items-center gap-3 mt-4">

                  <div className="bg-cyan-400 text-black px-3 py-1 rounded-full text-xs font-black">
                    VERIFIED CREATOR
                  </div>

                  <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-black">
                    CLOUD MEMBER
                  </div>

                </div>

              </div>

            </div>

            <Link
              href="/create"
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-5 py-3 rounded-2xl transition text-center"
            >
              Upload Fragment
            </Link>

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mt-8">

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Owned Fragments
            </p>

            <h2 className="text-4xl font-black mt-3">
              {inventory.length}
            </h2>

          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Uploaded Fragments
            </p>

            <h2 className="text-4xl font-black mt-3">
              {uploads.length}
            </h2>

          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Wallet Balance
            </p>

            <h2 className="text-4xl font-black mt-3 text-cyan-400">
              ${balance}
            </h2>

          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5">

            <p className="text-zinc-500 text-sm">
              Marketplace Rank
            </p>

            <h2 className="text-4xl font-black mt-3">
              #12
            </h2>

          </div>

        </div>

        {/* INVENTORY */}

        <div className="mt-14">

          <h2 className="text-4xl font-black">
            Owned Inventory
          </h2>

          <p className="text-zinc-500 mt-2">
            Purchased collectible fragments
          </p>

        </div>

        {loading && (

          <div className="mt-10 bg-zinc-950 border border-white/10 rounded-3xl p-14 text-center">

            <h3 className="text-3xl font-black">
              Loading Inventory...
            </h3>

          </div>

        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 mt-10">

          {inventory.map((fragment) => (

            <div
              key={fragment.id}
              className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 hover:border-cyan-400 transition"
            >

              <img
                src={fragment.image}
                alt={fragment.title}
                className="w-full h-72 object-cover"
              />

              <div className="p-5">

                <p className="text-zinc-500 text-sm">
                  {fragment.title}
                </p>

                <h3 className="text-3xl font-black mt-1">
                  #{fragment.piece}
                </h3>

                <div className="mt-5">

                  <p className="text-zinc-500 text-sm">
                    Estimated Value
                  </p>

                  <h2 className="text-cyan-400 text-3xl font-black mt-1">
                    ${fragment.price}
                  </h2>

                </div>

              </div>

            </div>

          ))}

        </div>

        {/* USER UPLOADS */}

        <div className="mt-20">

          <h2 className="text-4xl font-black">
            Uploaded Fragments
          </h2>

          <p className="text-zinc-500 mt-2">
            Your live marketplace creations
          </p>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 mt-10">

          {uploads.map((fragment) => (

            <div
              key={fragment.id}
              className="rounded-3xl overflow-hidden border border-cyan-400/30 bg-zinc-950 hover:border-cyan-400 transition"
            >

              <div className="relative">

                <img
                  src={fragment.image}
                  alt={fragment.title}
                  className="w-full h-72 object-cover"
                />

                <div className="absolute top-4 right-4 bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">
                  LIVE
                </div>

              </div>

              <div className="p-5">

                <p className="text-zinc-500 text-sm">
                  {fragment.title}
                </p>

                <h3 className="text-3xl font-black mt-1">
                  #{fragment.piece}
                </h3>

                <div className="mt-4 flex items-center justify-between">

                  <div className="bg-black border border-white/10 px-3 py-1 rounded-full text-xs font-black">
                    {fragment.rarity}
                  </div>

                  <div className="text-cyan-400 text-2xl font-black">
                    ${fragment.price}
                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );
}