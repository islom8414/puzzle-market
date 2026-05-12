"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams } from "next/navigation";

import { fragments } from "@/data/fragments";

import { supabase } from "@/lib/supabase";

type MarketListing = {

  id: number;

  seller_email: string;

  fragment_id: string;

  title: string;

  image: string;

  piece: number;

  price: number;

  rarity: string;

};

export default function PuzzlePage() {

  const params = useParams();

  const slug =
    (params.id || params.slug) as string;

  const puzzle = useMemo(() => {

    return fragments.find(
      (item) => item.slug === slug
    );

  }, [slug]);

  const [listing, setListing] =
    useState<MarketListing | null>(
      null
    );

  const [balance, setBalance] =
    useState(8000);

  const [username, setUsername] =
    useState("Guest");

  const [owned, setOwned] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {

    if (!puzzle) return;

    loadData();

  }, [puzzle]);

  const loadData =
    async () => {

      if (!puzzle) return;

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

      if (savedUser) {

        setUsername(savedUser);

      }

      const inventory = JSON.parse(
        localStorage.getItem(
          "puzzle-owned"
        ) || "[]"
      );

      setOwned(
        inventory.includes(
          puzzle.slug
        )
      );

      const { data } =
        await supabase
          .from("marketplace")
          .select("*")
          .eq(
            "fragment_id",
            puzzle.slug
          )
          .limit(1)
          .single();

      if (data) {

        setListing(data);

      }

    };

  if (!puzzle) {

    return (

      <main className="min-h-screen flex items-center justify-center text-white">

        <h1 className="text-4xl font-black">
          Fragment Not Found
        </h1>

      </main>

    );

  }

  const currentPrice =
    listing?.price ||
    puzzle.price;

  const currentOwner =
    listing?.seller_email ||
    puzzle.owner;

  const handleBuy =
    async () => {

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
        balance < currentPrice
      ) {

        alert(
          "Not enough balance."
        );

        return;

      }

      setLoading(true);

      const inventoryData = {

        user_email: user,

        fragment_id:
          puzzle.slug,

        title: puzzle.title,

        image: puzzle.image,

        piece: puzzle.piece,

        price: currentPrice,

      };

      const { error } =
        await supabase
          .from("inventory")
          .insert(
            inventoryData
          );

      if (error) {

        console.log(error);

        alert(
          "Purchase failed."
        );

        setLoading(false);

        return;

      }

      /* TRANSACTION */

      if (listing) {

        await supabase
          .from(
            "transactions"
          )
          .insert({

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

          });

        /* DELETE MARKET LISTING */

        await supabase
          .from(
            "marketplace"
          )
          .delete()
          .eq(
            "id",
            listing.id
          );

      }

      /* BALANCE */

      /* BUYER BALANCE */

const newBalance =
  balance -
  currentPrice;

setBalance(
  newBalance
);

localStorage.setItem(
  "puzzle-balance",
  String(newBalance)
);

/* SELLER EARNINGS */

if (listing) {

  const sellerWalletKey =
    `wallet-${listing.seller_email}`;

  const sellerCurrent =
    Number(
      localStorage.getItem(
        sellerWalletKey
      ) || "8000"
    );

  const updatedSellerBalance =
    sellerCurrent +
    currentPrice;

  localStorage.setItem(
    sellerWalletKey,
    String(
      updatedSellerBalance
    )
  );

}
      /* LOCAL INVENTORY */

      const inventory = JSON.parse(
        localStorage.getItem(
          "puzzle-owned"
        ) || "[]"
      );

      inventory.push(
        puzzle.slug
      );

      localStorage.setItem(
        "puzzle-owned",
        JSON.stringify(
          inventory
        )
      );

      localStorage.setItem(
        `owner-${puzzle.slug}`,
        user
      );

      setOwned(true);

      alert(
        listing
          ? "Fragment purchased from live marketplace."
          : "Fragment added to inventory."
      );

      setLoading(false);

      window.location.href =
        "/profile";

    };

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
              src={puzzle.image}
              alt={puzzle.title}
              className="w-full h-[500px] object-cover"
            />

          </div>

          {/* INFO */}

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">

            <div className="flex items-center gap-3">

              <div className="bg-cyan-400 text-black px-3 py-1 rounded-full text-xs font-black">
                {puzzle.rarity}
              </div>

              {listing ? (

                <div className="bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">
                  LIVE LISTING
                </div>

              ) : (

                <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-black">
                  ORIGINAL MARKET
                </div>

              )}

            </div>

            <h1 className="text-5xl font-black mt-5">
              Piece #{puzzle.piece}
            </h1>

            <p className="text-zinc-500 mt-3">
              {puzzle.title}
            </p>

            {/* STATS */}

            <div className="grid grid-cols-2 gap-4 mt-8">

              <div className="bg-black border border-white/10 rounded-2xl p-5">

                <p className="text-zinc-500 text-sm">
                  Seller
                </p>

                <h3 className="text-xl font-black mt-2 break-all">
                  {currentOwner}
                </h3>

              </div>

              <div className="bg-black border border-white/10 rounded-2xl p-5">

                <p className="text-zinc-500 text-sm">
                  Price
                </p>

                <h3 className="text-cyan-400 text-2xl font-black mt-2">
                  ${currentPrice}
                </h3>

              </div>

            </div>

            {/* BUTTON */}

            {!owned ? (

              <button
                onClick={handleBuy}
                disabled={loading}
                className="w-full mt-8 bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
              >

                {loading
                  ? "Processing..."
                  : listing
                  ? "Buy From Seller"
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