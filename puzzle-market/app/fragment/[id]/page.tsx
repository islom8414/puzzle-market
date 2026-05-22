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

    // eslint-disable-next-line react-hooks/immutability
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

    if (!fragment) return;

    const {
      data: {
        session,
      },
    } =
      await supabase.auth
        .getSession();

    if (!session) {

      alert("Login required");

      location.href =
        "/login";

      return;

    }

    const username =
      localStorage.getItem(
        "puzzle-username"
      ) ||
      session.user.email
        ?.split("@")[0]
        ?.replace(
          /[^a-zA-Z0-9_-]/g,
          ""
        )
        ?.slice(0, 40) ||
      "PuzzleUser";

    localStorage.setItem(
      "puzzle-username",
      username
    );

    const response =
      await fetch(
        "/api/purchase-marketplace",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            listingId:
              fragment.id,
            username,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      alert(
        data.error ||
        "Purchase failed"
      );

      return;

    }

    alert("Fragment Purchased!");

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
