"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const params = useParams();

  const [fragment, setFragment] =
    useState<Fragment | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadFragment();
  }, []);

  async function loadFragment() {
    const { data } =
      await supabase
        .from("marketplace")
        .select("*")
        .eq(
          "fragment_id",
          params.id
        )
        .maybeSingle();

    if (data) {
      setFragment(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  if (!fragment) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Fragment Not Found
      </main>
    );
  }

  async function buyFragment() {

    const email =
      localStorage.getItem(
        "puzzle-username"
      ) ||
      "ismatchanov08@gmail.com";

    let {
      data: wallet
    } =
      await supabase
        .from("wallets")
        .select("*")
        .eq(
          "username",
          email
        )
        .maybeSingle();

    if (!wallet) {

      const {
        data
      } =
        await supabase
          .from("wallets")
          .insert([
            {
              username:
                email,
              balance:
                100
            }
          ])
          .select()
          .single();

      wallet = data;

    }

    if (
      wallet.balance <
      fragment.price
    ) {

      alert(
        "Not enough balance"
      );

      return;

    }

    const newBalance =
      wallet.balance -
      fragment.price;

    await supabase
      .from("wallets")
      .update({
        balance:
          newBalance
      })
      .eq(
        "username",
        email
      );

    localStorage.setItem(
      "puzzle-balance",
      String(
        newBalance
      )
    );

    await supabase
      .from("inventory")
      .insert([
        {
          user_email:
            email,
          fragment_id:
            fragment.fragment_id,
          title:
            fragment.title,
          image:
            fragment.image,
          piece:
            fragment.piece,
          price:
            fragment.price
        }
      ]);

    await supabase
      .from("activity")
      .insert([
        {
          username:
            email,
          action:
            "BUY",
          title:
            fragment.title
        }
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
  }

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto p-10">

        <img
          src={fragment.image}
          className="rounded-3xl"
        />

        <h1 className="text-6xl font-black mt-8">
          {fragment.title}
        </h1>

        <div className="mt-10">

          <div>
            Price:
            ${fragment.price}
          </div>

          <div>
            Piece:
            #{fragment.piece}
          </div>

          <div>
            Seller:
            {fragment.seller_email}
          </div>

        </div>

        <button
          onClick={
            buyFragment
          }
          className="mt-10 w-full bg-cyan-400 text-black p-5 rounded-3xl font-black"
        >
          Buy Fragment
        </button>

      </div>

    </main>
  );
}