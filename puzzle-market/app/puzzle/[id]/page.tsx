"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

type MarketListing = {

  id: number;

  seller_email: string;

  fragment_id: string;

  title: string;

  image: string;

  piece: string;

  price: number;

  rarity: string;

};

export default function PuzzlePage() {

  const params = useParams();

  const slug =
    (params.id || params.slug) as string;

  const [listing, setListing] =
    useState<MarketListing | null>(
      null
    );

  const [balance, setBalance] =
    useState(8000);

  const [owned, setOwned] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [buying, setBuying] =
    useState(false);

  useEffect(() => {

    if (!slug) return;

    loadFragment();

  }, [slug]);

  const loadFragment =
    async () => {

      const savedBalance =
        localStorage.getItem(
          "puzzle-balance"
        );

      if (savedBalance) {

        setBalance(
          Number(savedBalance)
        );

      }

      const user =
        localStorage.getItem(
          "puzzle-user"
        );

      const {
        data,
      } =
        await supabase
          .from("marketplace")
          .select("*")
          .eq(
            "fragment_id",
            slug
          )
          .limit(1)
          .single();

      if (data) {

        setListing(data);

      }

      if (user) {

        const {
          data: ownedData,
        } =
          await supabase
            .from("inventory")
            .select("*")
            .eq(
              "user_email",
              user
            )
            .eq(
              "fragment_id",
              slug
            )
            .limit(1);

        if (
          ownedData &&
          ownedData.length > 0
        ) {

          setOwned(true);

        }

      }

      setLoading(false);

    };

  const handleBuy =
    async () => {

      if (!listing) return;

      if (owned) {

        alert(
          "You already own this fragment."
        );

        return;

      }

      const user =
        localStorage.getItem(
          "puzzle-user"
        );

      if (!user) {

        alert(
          "Login required"
        );

        window.location.href =
          "/login";

        return;

      }

      if (
        balance <
        listing.price
      ) {

        alert(
          "Not enough balance."
        );

        return;

      }

      setBuying(true);

      /* ADD TO INVENTORY */

      const inventoryItem = {

        user_email: user,

        fragment_id:
          listing.fragment_id,

        title:
          listing.title,

        image:
          listing.image,

        piece:
          listing.piece,

        price:
          listing.price,

      };

      const {
        error:
          inventoryError,
      } =
        await supabase
          .from("inventory")
          .insert([
            inventoryItem,
          ]);

      if (inventoryError) {

        console.log(
          inventoryError
        );

        alert(
          "Purchase failed."
        );

        setBuying(false);

        return;

      }

      /* SAVE TRANSACTION */

      await supabase
        .from(
          "transactions"
        )
        .insert([
          {

            buyer_email:
              user,

            seller_email:
              listing.seller_email,

            fragment_id:
              listing.fragment_id,

            title:
              listing.title,

            price:
              listing.price,

          },
        ]);

      /* DELETE LISTING */

      await supabase
        .from(
          "marketplace"
        )
        .delete()
        .eq(
          "id",
          listing.id
        );

      /* BALANCE */

      const updatedBalance =
        balance -
        listing.price;

      setBalance(
        updatedBalance
      );

      localStorage.setItem(
        "puzzle-balance",
        String(
          updatedBalance
        )
      );

      /* SELLER WALLET */

      const sellerWallet =
        `wallet-${listing.seller_email}`;

      const currentSeller =
        Number(
          localStorage.getItem(
            sellerWallet
          ) || "8000"
        );

      localStorage.setItem(
        sellerWallet,
        String(
          currentSeller +
            listing.price
        )
      );

      setOwned(true);

      alert(
        "Fragment purchased successfully."
      );

      window.location.href =
        "/profile";

    };

  if (loading) {

    return (

      <main className="min-h-screen flex items-center justify-center text-white">

        <h1 className="text-4xl font-black">
          Loading Fragment...
        </h1>

      </main>

    );

  }

  if (!listing) {

    return (

      <main className="min-h-screen flex items-center justify-center text-white">

        <h1 className="text-4xl font-black">
          Fragment Not Found
        </h1>

      </main>

    );

  }

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-7xl mx-auto">

        {/* TOP */}

        <div className="flex items-center justify-between mb-8">

          <a
            href="/marketplace"
            className="text-cyan-400 font-bold"
          >
            ← Marketplace
          </a>

          <div className="bg-zinc-950 border border-white/10 rounded-2xl px-4 py-2">

            <p className="text-zinc-500 text-xs">
              Wallet
            </p>

            <h3 className="text-cyan-400 font-black">
              ${balance}
            </h3>

          </div>

        </div>

        {/* MAIN */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          {/* IMAGE */}

          <div className="rounded-3xl overflow-hidden border border-white/10">

            <img
              src={listing.image}
              alt={listing.title}
              className="w-full h-[500px] object-cover"
            />

          </div>

          {/* INFO */}

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">

            <div className="flex items-center gap-3">

              <div className="bg-cyan-400 text-black px-3 py-1 rounded-full text-xs font-black">
                {listing.rarity}
              </div>

              <div className="bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">
                LIVE LISTING
              </div>

            </div>

            <h1 className="text-5xl font-black mt-5">
              Piece #{listing.piece}
            </h1>

            <p className="text-zinc-500 mt-3">
              {listing.title}
            </p>

            {/* STATS */}

            <div className="grid grid-cols-2 gap-4 mt-8">

              <div className="bg-black border border-white/10 rounded-2xl p-5">

                <p className="text-zinc-500 text-sm">
                  Seller
                </p>

                <h3 className="text-xl font-black mt-2 break-all">
                  {listing.seller_email}
                </h3>

              </div>

              <div className="bg-black border border-white/10 rounded-2xl p-5">

                <p className="text-zinc-500 text-sm">
                  Price
                </p>

                <h3 className="text-cyan-400 text-2xl font-black mt-2">
                  ${listing.price}
                </h3>

              </div>

            </div>

            {/* BUTTON */}

            {!owned ? (

              <button
                onClick={handleBuy}
                disabled={buying}
                className="w-full mt-8 bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
              >

                {buying
                  ? "Processing..."
                  : "Buy Fragment"}

              </button>

            ) : (

              <div className="w-full mt-8 bg-green-400 text-black font-black py-4 rounded-2xl text-center">
                YOU OWN THIS FRAGMENT
              </div>

            )}

            {/* DESCRIPTION */}

            <div className="mt-10">

              <h2 className="text-3xl font-black">
                Fragment Details
              </h2>

              <p className="text-zinc-500 leading-relaxed mt-4">
                This collectible fragment exists inside the live cloud economy.
                Ownership transfers are permanently synced through the marketplace database.
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>

  );
}