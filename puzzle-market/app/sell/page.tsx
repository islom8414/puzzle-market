"use client";

import { useEffect, useMemo, useState } from "react";

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

type MarketplaceItem = {

  id: number;

  fragment_id: string;

  title: string;

  image: string;

  piece: number;

  price: number;

  rarity: string;

};

export default function SellPage() {

  const [inventory, setInventory] =
    useState<InventoryItem[]>([]);

  const [activeListings, setActiveListings] =
    useState<MarketplaceItem[]>([]);

  const [prices, setPrices] =
    useState<{
      [key: string]: string;
    }>({});

  const [loading, setLoading] =
    useState(true);

  const [userEmail, setUserEmail] =
    useState("");

  useEffect(() => {

    loadData();

    const channel =
      supabase
        .channel(
          "seller-live"
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table:
              "marketplace",
          },
          () => {

            loadData();

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  const loadData =
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

      const {
        data: inventoryData,
      } =
        await supabase
          .from("inventory")
          .select("*")
          .eq(
            "user_email",
            user
          );

      if (inventoryData) {

        setInventory(
          inventoryData
        );

      }

      const {
        data: listingData,
      } =
        await supabase
          .from("marketplace")
          .select("*")
          .eq(
            "seller_email",
            user
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

      if (listingData) {

        setActiveListings(
          listingData
        );

      }

      setLoading(false);

    };

  const totalRevenue =
    useMemo(() => {

      return activeListings.reduce(
        (sum, item) =>
          sum + item.price,
        0
      );

    }, [activeListings]);

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

      const alreadyListed =
        activeListings.find(
          (item) =>
            item.fragment_id ===
            fragment.fragment_id
        );

      if (alreadyListed) {

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

      alert(
        "Fragment listed successfully."
      );

      loadData();

    };

  const removeListing =
    async (
      listingId: number
    ) => {

      await supabase
        .from(
          "marketplace"
        )
        .delete()
        .eq(
          "id",
          listingId
        );

      loadData();

    };

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[36px] p-8 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="relative">

            <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
              LIVE SELLER CENTER
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-5 leading-[0.95]">
              Creator
              <br />
              Marketplace
            </h1>

            <p className="text-zinc-400 text-lg mt-8 max-w-2xl leading-relaxed">
              Manage your live marketplace listings, fragment sales and realtime cloud inventory.
            </p>

            {/* STATS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Inventory
                </p>

                <h2 className="text-5xl font-black mt-4">
                  {inventory.length}
                </h2>

              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Active Listings
                </p>

                <h2 className="text-cyan-400 text-5xl font-black mt-4">
                  {activeListings.length}
                </h2>

              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[28px] p-6">

                <p className="text-zinc-500 text-sm">
                  Market Value
                </p>

                <h2 className="text-green-400 text-5xl font-black mt-4">
                  ${totalRevenue}
                </h2>

              </div>

            </div>

          </div>

        </section>

        {/* ACTIVE LISTINGS */}

        <section className="mt-16">

          <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
            LIVE MARKETPLACE
          </p>

          <h2 className="text-5xl font-black mt-3">
            Active Listings
          </h2>

          {activeListings.length ===
            0 && (

            <div className="mt-10 bg-white/[0.03] border border-white/10 rounded-[36px] p-20 text-center">

              <h2 className="text-4xl font-black">
                No Active Listings
              </h2>

            </div>

          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">

            {activeListings.map(
              (listing) => (

                <div
                  key={listing.id}
                  className={`group rounded-[32px] overflow-hidden border bg-white/[0.03] backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${rarityGlow(listing.rarity)}`}
                >

                  <div className="relative overflow-hidden">

                    <img
                      src={
                        listing.image
                      }
                      alt={
                        listing.title
                      }
                      className="w-full h-[340px] object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    <div className="absolute top-5 right-5 bg-green-400 text-black px-4 py-2 rounded-full text-xs font-black">
                      LIVE
                    </div>

                  </div>

                  <div className="p-6">

                    <p className="text-zinc-500 text-sm uppercase tracking-wider">
                      {listing.title}
                    </p>

                    <h2 className="text-4xl font-black mt-2">
                      Piece #{listing.piece}
                    </h2>

                    <div className="mt-6 flex items-center justify-between">

                      <div>

                        <p className="text-zinc-500 text-sm">
                          Listing Price
                        </p>

                        <h2 className="text-cyan-400 text-4xl font-black mt-2">
                          ${listing.price}
                        </h2>

                      </div>

                    </div>

                    <button
                      onClick={() =>
                        removeListing(
                          listing.id
                        )
                      }
                      className="w-full mt-6 bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl transition"
                    >
                      Remove Listing
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

        {/* INVENTORY */}

        <section className="mt-24">

          <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
            INVENTORY
          </p>

          <h2 className="text-5xl font-black mt-3">
            Sell Fragments
          </h2>

          {loading && (

            <div className="mt-10 bg-white/[0.03] border border-white/10 rounded-[36px] p-20 text-center">

              <h2 className="text-5xl font-black">
                Loading Inventory...
              </h2>

            </div>

          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">

            {inventory.map(
              (fragment) => {

                const original =
                  fragments.find(
                    (f) =>
                      f.slug ===
                      fragment.fragment_id
                  );

                const rarity =
                  original?.rarity ||
                  "Rare";

                const alreadyListed =
                  activeListings.find(
                    (item) =>
                      item.fragment_id ===
                      fragment.fragment_id
                  );

                return (

                  <div
                    key={fragment.id}
                    className={`group rounded-[32px] overflow-hidden border bg-white/[0.03] backdrop-blur-xl transition duration-500 hover:-translate-y-2 ${rarityGlow(rarity)}`}
                  >

                    <div className="relative overflow-hidden">

                      <img
                        src={
                          fragment.image
                        }
                        alt={
                          fragment.title
                        }
                        className="w-full h-[340px] object-cover transition duration-700 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                      <div className="absolute top-5 left-5 bg-black/70 backdrop-blur-xl px-4 py-2 rounded-full text-xs font-black border border-white/10">

                        {rarity}

                      </div>

                    </div>

                    <div className="p-6">

                      <p className="text-zinc-500 text-sm uppercase tracking-wider">
                        {fragment.title}
                      </p>

                      <h2 className="text-4xl font-black mt-2">
                        Piece #{fragment.piece}
                      </h2>

                      <div className="mt-6">

                        <p className="text-zinc-500 text-sm">
                          Estimated Value
                        </p>

                        <h2 className="text-cyan-400 text-4xl font-black mt-2">
                          ${fragment.price}
                        </h2>

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
                        className="w-full mt-6 bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400 transition"
                      />

                      <button
                        onClick={() =>
                          handleList(
                            fragment
                          )
                        }
                        disabled={
                          !!alreadyListed
                        }
                        className={`w-full mt-6 font-black py-4 rounded-2xl transition ${
                          alreadyListed
                            ? "bg-green-400 text-black"
                            : "bg-cyan-400 hover:bg-cyan-300 text-black"
                        }`}
                      >

                        {alreadyListed
                          ? "LIVE ON MARKET"
                          : "List Fragment"}

                      </button>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </section>

      </div>

    </main>

  );
}