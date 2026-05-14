"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "next/navigation";

import { supabase }
from "@/lib/supabase";

type Fragment = {
  id: number;
  fragment_id: string;
  title: string;
  image: string;
  piece: string;
  price: number;
  rarity: string;
  seller_email: string;
};

export default function FragmentPage() {

  const params =
    useParams();

  const [fragment,
    setFragment] =
    useState<Fragment | null>(
      null
    );

  const [loading,
    setLoading] =
    useState(true);

  useEffect(() => {

    loadFragment();

  }, []);

  const loadFragment =
    async () => {

      const { data } =
        await supabase
          .from(
            "marketplace"
          )
          .select("*")
          .eq(
            "fragment_id",
            params.id
          )
          .single();

      if (data) {

        setFragment(data);

      }

      setLoading(false);

    };

  if (loading) {

    return (

      <main className="min-h-screen bg-black text-white flex items-center justify-center">

        <h1 className="text-5xl font-black">
          Loading Fragment...
        </h1>

      </main>

    );

  }

  if (!fragment) {

    return (

      <main className="min-h-screen bg-black text-white flex items-center justify-center">

        <h1 className="text-5xl font-black">
          Fragment Not Found
        </h1>

      </main>

    );

  }

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_30%)]" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16">

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-[0.3em] text-xs">
            Premium Fragment
          </p>

          <h1 className="text-5xl md:text-7xl font-black mt-5">
            {fragment.title}
          </h1>

          <p className="text-zinc-500 text-lg mt-6 max-w-2xl leading-relaxed">
            Live marketplace fragment with realtime ownership and premium trading system.
          </p>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* IMAGE */}

          <div className="relative rounded-[40px] overflow-hidden border border-white/10 bg-zinc-950">

            <img
              src={fragment.image}
              alt={fragment.title}
              className="w-full h-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

            <div className="absolute top-6 left-6 flex gap-3">

              <div className="bg-cyan-400 text-black px-5 py-2 rounded-full text-sm font-black">
                LIVE
              </div>

              <div className="bg-purple-500 text-white px-5 py-2 rounded-full text-sm font-black">
                {fragment.rarity}
              </div>

            </div>

          </div>

          {/* INFO */}

          <div className="space-y-6">

            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7">

              <p className="text-zinc-500 text-sm">
                Current Owner
              </p>

              <h2 className="text-3xl font-black mt-3 break-all">
                {
                  localStorage.getItem(
                    "puzzle-username"
                  ) || "ShadowUser"
                }
              </h2>

            </div>

            <div className="grid grid-cols-2 gap-5">

              <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7">

                <p className="text-zinc-500 text-sm">
                  Price
                </p>

                <h2 className="text-cyan-400 text-4xl font-black mt-3">
                  ${fragment.price}
                </h2>

              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7">

                <p className="text-zinc-500 text-sm">
                  Piece
                </p>

                <h2 className="text-4xl font-black mt-3">
                  #{fragment.piece}
                </h2>

              </div>

            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-7">

              <p className="text-zinc-500 text-sm uppercase tracking-wider">
                Seller
              </p>

              <p className="text-2xl font-black mt-4 break-all">
                {fragment.seller_email}
              </p>

            </div>

            <button
  onClick={async () => {

    const username =
      localStorage.getItem(
        "puzzle-username"
      ) || "ShadowUser";

    const {
      data: walletData,
    } =
      await supabase
        .from("wallets")
        .select("*")
        .eq(
          "username",
          username
        )
        .single();

    if (!walletData) {

      alert(
        "Wallet not found"
      );

      return;

    }

    const currentBalance =
      walletData.balance;

    if (
      currentBalance <
      fragment.price
    ) {

      alert(
        "Not enough balance"
      );

      return;

    }

    const newBalance =
      currentBalance -
      fragment.price;

    await supabase
      .from("wallets")
      .update({
        balance:
          newBalance,
      })
      .eq(
        "username",
        username
      );

    localStorage.setItem(
      "puzzle-balance",
      String(newBalance)
    );

    await supabase
      .from("inventory")
      .insert([
        {
          user_email:
            username,
          fragment_id:
            fragment.fragment_id,
          title:
            fragment.title,
          image:
            fragment.image,
          piece:
            fragment.piece,
          price:
            fragment.price,
        },
      ]);

    await supabase
      .from("activity")
      .insert([
        {
          username,
          action: "BUY",
          title:
            fragment.title,
          price:
            fragment.price,
        },
      ]);

    await supabase
      .from("marketplace")
      .delete()
      .eq(
        "fragment_id",
        fragment.fragment_id
      );

    alert(
      "Fragment Purchased!"
    );

    window.location.href =
      "/profile";

  }}
  className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-5 rounded-[28px] text-lg transition"
>
  Buy Fragment
</button>

          </div>

        </div>

      </div>

    </main>

  );
}