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

  const [
    fragment,
    setFragment
  ] =
  useState<
    Fragment | null
  >(null);

  const [
    loading,
    setLoading
  ] =
  useState(true);

  useEffect(() => {

    loadFragment();

  }, []);

  async function loadFragment() {

    const {
      data
    } =
    await supabase
      .from(
        "marketplace"
      )
      .select("*")
      .eq(
        "fragment_id",
        params.id
      )
      .limit(1);

    setFragment(
      data?.[0] ||
      null
    );

    setLoading(
      false
    );

  }

  async function buyFragment() {

    const email =
      localStorage.getItem(
        "puzzle-username"
      ) ||
      "ismatchanov08@gmail.com";

    let {
      data: wallets
    } =
    await supabase
      .from(
        "wallets"
      )
      .select("*")
      .eq(
        "username",
        email
      )
      .limit(1);

    let wallet =
      wallets?.[0];

    if (
      !wallet
    ) {

      const {
        data
      } =
      await supabase
        .from(
          "wallets"
        )
        .insert([
          {
            username:
              email,
            balance:
              100
          }
        ])
        .select();

      wallet =
        data?.[0];

    }

    if (
      !wallet
    ) {

      alert(
        "Wallet create failed"
      );

      return;

    }

    if (
      wallet.balance <
      fragment!.price
    ) {

      alert(
        "Not enough balance"
      );

      return;

    }

    const newBalance =
      wallet.balance -
      fragment!.price;

    await supabase
      .from(
        "wallets"
      )
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
      .from(
        "inventory"
      )
      .insert([
        {
          user_email:
            email,
          fragment_id:
            fragment!.fragment_id,
          title:
            fragment!.title,
          image:
            fragment!.image,
          piece:
            fragment!.piece,
          price:
            fragment!.price
        }
      ]);

    await supabase
      .from(
        "activity"
      )
      .insert([
        {
          username:
            email,
          action:
            "BUY",
          title:
            fragment!.title
        }
      ]);

    await supabase
      .from(
        "marketplace"
      )
      .delete()
      .eq(
        "fragment_id",
        fragment!.fragment_id
      );

    alert(
      "Fragment Purchased!"
    );

    location.href =
      "/profile";

  }

  if (
    loading
  ) {

    return (
      <div>
        Loading...
      </div>
    );

  }

  if (
    !fragment
  ) {

    return (
      <div>
        Fragment not found
      </div>
    );

  }

  return (

    <main className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto p-10">

        <img
          src={
            fragment.image
          }
          className="rounded-3xl"
        />

        <h1 className="text-6xl font-black">

          {
            fragment.title
          }

        </h1>

        <div>

          Price:
          $
          {
            fragment.price
          }

        </div>

        <button
          onClick={
            buyFragment
          }
          className="w-full bg-cyan-400 text-black p-5 rounded-3xl"
        >

          Buy Fragment

        </button>

      </div>

    </main>

  );

}