"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";

type InventoryItem = {

  id: number;

  fragment_id: string;

  title: string;

  image: string;

  piece: number;

  price: number;

};

export default function ProfilePage() {

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

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
        setBalance(Number(savedBalance));
      }

      if (!savedUser) {

        window.location.href =
          "/login";

        return;

      }

      setUsername(savedUser);

      const { data, error } =
        await supabase
          .from("inventory")
          .select("*")
          .eq(
            "user_email",
            savedUser
          );

      if (!error && data) {

        setInventory(data);

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
                  Premium Puzzle Collector
                </p>

                <div className="flex items-center gap-3 mt-4">

                  <div className="bg-cyan-400 text-black px-3 py-1 rounded-full text-xs font-black">
                    VIP MEMBER
                  </div>

                  <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-black">
                    Rank #12
                  </div>

                </div>

              </div>

            </div>

            <button className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-5 py-3 rounded-2xl transition">
              Edit Profile
            </button>

          </div>

        </div>

        {/* STATS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8">

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

        {/* TITLE */}

        <div className="mt-12">

          <h2 className="text-4xl font-black">
            Cloud Inventory
          </h2>

          <p className="text-zinc-500 mt-2">
            Synced collectible fragments from database
          </p>

        </div>

        {/* LOADING */}

        {loading && (

          <div className="mt-10 bg-zinc-950 border border-white/10 rounded-3xl p-14 text-center">

            <h3 className="text-3xl font-black">
              Loading Inventory...
            </h3>

          </div>

        )}

        {/* EMPTY */}

        {!loading &&
          inventory.length === 0 && (

          <div className="mt-10 bg-zinc-950 border border-dashed border-white/10 rounded-3xl p-14 text-center">

            <h3 className="text-3xl font-black">
              No Fragments Yet
            </h3>

            <p className="text-zinc-500 mt-3">
              Buy your first fragment from marketplace.
            </p>

            <Link
              href="/marketplace"
              className="inline-flex mt-7 bg-cyan-400 hover:bg-cyan-300 text-black font-black px-6 py-3 rounded-2xl transition"
            >
              Open Marketplace
            </Link>

          </div>

        )}

        {/* GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7 mt-10">

          {inventory.map((fragment) => (

            <div
              key={fragment.id}
              className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 hover:border-cyan-400 transition"
            >

              <div className="relative">

                <img
                  src={fragment.image}
                  alt={fragment.title}
                  className="w-full h-72 object-cover"
                />

                <div className="absolute top-4 right-4 bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">
                  OWNED
                </div>

              </div>

              <div className="p-5">

                <p className="text-zinc-500 text-sm">
                  {fragment.title}
                </p>

                <h3 className="text-3xl font-black mt-1">
                  #{fragment.piece}
                </h3>

                <div className="mt-5">

                  <p className="text-zinc-500 text-sm">
                    Cloud Synced
                  </p>

                  <h2 className="text-green-400 text-3xl font-black mt-1">
                    STORED
                  </h2>

                </div>

                <div className="mt-5">

                  <p className="text-zinc-500 text-sm">
                    Estimated Value
                  </p>

                  <h2 className="text-cyan-400 text-3xl font-black mt-1">
                    ${fragment.price}
                  </h2>

                </div>

                <Link
                  href={`/puzzle/${fragment.fragment_id}`}
                  className="mt-6 flex items-center justify-center w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-3 rounded-2xl transition"
                >
                  Open Fragment
                </Link>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );
}