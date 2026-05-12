"use client";

import { useEffect, useState } from "react";

import { fragments } from "@/data/fragments";

import { supabase } from "@/lib/supabase";

type InventoryItem = {

  id: number;

  fragment_id: string;

  title: string;

  image: string;

  piece: number;

  price: number;

};

export default function SellPage() {

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [prices, setPrices] =
    useState<{
      [key: string]: string;
    }>({});

  const [listed, setListed] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [userEmail, setUserEmail] =
    useState("");

  useEffect(() => {

    loadInventory();

  }, []);

  const loadInventory =
    async () => {

      const user =
        localStorage.getItem(
          "puzzle-user"
        );

      if (!user) {

        window.location.href =
          "/login";

        return;

      }

      setUserEmail(user);

      const { data, error } =
        await supabase
          .from("inventory")
          .select("*")
          .eq(
            "user_email",
            user
          );

      if (!error && data) {

        setInventory(data);

      }

      setLoading(false);

    };

  const handleList =
    async (
      fragment: InventoryItem
    ) => {

      const customPrice =
        prices[
          fragment.fragment_id
        ];

      if (!customPrice) {

        alert(
          "Set selling price first."
        );

        return;

      }

      if (
        listed.includes(
          fragment.fragment_id
        )
      ) {

        return;

      }

      let uploadedImage =
        fragment.image;

      try {

        if (
          fragment.image.startsWith(
            "blob:"
          )
        ) {

          const response =
            await fetch(
              fragment.image
            );

          const blob =
            await response.blob();

          const fileName =
            `${Date.now()}-${fragment.fragment_id}.jpg`;

          const {
            error: uploadError,
          } =
            await supabase.storage
              .from(
                "fragments"
              )
              .upload(
                fileName,
                blob,
                {
                  upsert: true,
                }
              );

          if (!uploadError) {

            const {
              data,
            } =
              supabase.storage
                .from(
                  "fragments"
                )
                .getPublicUrl(
                  fileName
                );

            uploadedImage =
              data.publicUrl;

          }

        }

      } catch (err) {

        console.log(err);

      }

      const original =
        fragments.find(
          (f) =>
            f.slug ===
            fragment.fragment_id
        );

      const marketplaceItem = {

        seller_email: userEmail,

        fragment_id:
          fragment.fragment_id,

        title: fragment.title,

        image:
          uploadedImage,

        piece: fragment.piece,

        price: Number(
          customPrice
        ),

        rarity:
          original?.rarity ||
          "Rare",

      };

      const { error } =
        await supabase
          .from("marketplace")
          .insert(
            marketplaceItem
          );

      if (error) {

        console.log(error);

        alert(
          "Listing failed."
        );

        return;

      }

      setListed([
        ...listed,
        fragment.fragment_id,
      ]);

      localStorage.setItem(
        `price-${fragment.fragment_id}`,
        customPrice
      );

      localStorage.setItem(
        `owner-${fragment.fragment_id}`,
        userEmail
      );

      alert(
        "Fragment listed successfully."
      );

    };

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-7xl mx-auto">

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-wider text-sm">
            Live Marketplace
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3 leading-tight">
            Sell Rare
            <br />
            Fragments
          </h1>

          <p className="text-zinc-500 mt-4 text-base max-w-2xl">
            Turn your owned puzzle pieces into marketplace profit.
          </p>

        </div>

        {loading && (

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-12 text-center">

            <h2 className="text-3xl font-black">
              Loading Inventory...
            </h2>

          </div>

        )}

        {!loading &&
          inventory.length === 0 && (

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-12 text-center">

            <h2 className="text-3xl font-black">
              No Fragments Available
            </h2>

            <p className="text-zinc-500 mt-3">
              Buy fragments first before selling.
            </p>

          </div>

        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {inventory.map(
            (fragment) => (

              <div
                key={fragment.id}
                className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 hover:border-cyan-400 transition"
              >

                <div className="relative">

                  <img
                    src={
                      fragment.image
                    }
                    alt={
                      fragment.title
                    }
                    className="w-full h-72 object-cover"
                  />

                  <div className="absolute top-4 right-4 bg-green-400 text-black px-3 py-1 rounded-full text-xs font-black">
                    OWNED
                  </div>

                </div>

                <div className="p-5">

                  <p className="text-zinc-500 text-sm">
                    {
                      fragment.title
                    }
                  </p>

                  <h2 className="text-3xl font-black mt-1">
                    Piece #
                    {
                      fragment.piece
                    }
                  </h2>

                  <div className="mt-6">

                    <p className="text-zinc-500 text-sm">
                      Original Value
                    </p>

                    <h3 className="text-cyan-400 text-4xl font-black mt-2">
                      $
                      {
                        fragment.price
                      }
                    </h3>

                  </div>

                  <input
                    type="number"
                    value={
                      prices[
                        fragment.fragment_id
                      ] || ""
                    }
                    onChange={(e) =>
                      setPrices({
                        ...prices,
                        [fragment.fragment_id]:
                          e.target
                            .value,
                      })
                    }
                    placeholder="Set listing price..."
                    className="w-full mt-6 bg-black border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-cyan-400 transition"
                  />

                  <button
                    onClick={() =>
                      handleList(
                        fragment
                      )
                    }
                    disabled={listed.includes(
                      fragment.fragment_id
                    )}
                    className={`w-full mt-5 font-black py-3 rounded-2xl transition ${
                      listed.includes(
                        fragment.fragment_id
                      )
                        ? "bg-green-500 text-black"
                        : "bg-cyan-400 hover:bg-cyan-300 text-black"
                    }`}
                  >

                    {listed.includes(
                      fragment.fragment_id
                    )
                      ? "LIVE ON MARKET"
                      : "List Fragment"}

                  </button>

                </div>

              </div>

            )
          )}

        </div>

      </div>

    </main>

  );
}