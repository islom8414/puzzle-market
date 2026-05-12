"use client";

import { useEffect, useState } from "react";

const auctionData = [

  {
    id: 1,
    title: "Dragon Fantasy",
    piece: 218,
    rarity: "Legendary",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
    currentBid: 250,
    endsIn: 3600,
  },

  {
    id: 2,
    title: "Dark Desert",
    piece: 551,
    rarity: "Epic",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    currentBid: 120,
    endsIn: 7200,
  },

];

export default function AuctionsPage() {

  const [auctions, setAuctions] =
    useState(auctionData);

  useEffect(() => {

    const interval = setInterval(() => {

      setAuctions((prev) =>
        prev.map((auction) => ({

          ...auction,

          endsIn:
            auction.endsIn > 0
              ? auction.endsIn - 1
              : 0,

        }))
      );

    }, 1000);

    return () =>
      clearInterval(interval);

  }, []);

  const formatTime = (
    seconds: number
  ) => {

    const hrs = Math.floor(
      seconds / 3600
    );

    const mins = Math.floor(
      (seconds % 3600) / 60
    );

    const secs =
      seconds % 60;

    return `${hrs}h ${mins}m ${secs}s`;

  };

  const placeBid = (
    id: number
  ) => {

    setAuctions((prev) =>
      prev.map((auction) => {

        if (auction.id === id) {

          return {
            ...auction,
            currentBid:
              auction.currentBid + 25,
          };

        }

        return auction;

      })
    );

  };

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-7xl mx-auto">

        {/* HERO */}

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-wider text-sm">
            Premium Marketplace
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3">
            Live Auctions
          </h1>

          <p className="text-zinc-500 mt-4">
            Bid on legendary puzzle fragments before auction ends.
          </p>

        </div>

        {/* GRID */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">

          {auctions.map((auction) => (

            <div
              key={auction.id}
              className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-950 hover:border-cyan-400 transition"
            >

              {/* IMAGE */}

              <div className="relative">

                <img
                  src={auction.image}
                  alt={auction.title}
                  className="w-full h-80 object-cover"
                />

                <div className="absolute top-4 left-4 bg-yellow-400 text-black px-3 py-1 rounded-full text-xs font-black">
                  {auction.rarity}
                </div>

                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black">
                  LIVE AUCTION
                </div>

              </div>

              {/* CONTENT */}

              <div className="p-6">

                <p className="text-zinc-500 text-sm">
                  {auction.title}
                </p>

                <h2 className="text-4xl font-black mt-2">
                  Piece #{auction.piece}
                </h2>

                {/* STATS */}

                <div className="grid grid-cols-2 gap-4 mt-8">

                  <div className="bg-black border border-white/10 rounded-2xl p-4">

                    <p className="text-zinc-500 text-sm">
                      Current Bid
                    </p>

                    <h3 className="text-cyan-400 text-3xl font-black mt-2">
                      ${auction.currentBid}
                    </h3>

                  </div>

                  <div className="bg-black border border-white/10 rounded-2xl p-4">

                    <p className="text-zinc-500 text-sm">
                      Ends In
                    </p>

                    <h3 className="text-2xl font-black mt-2">
                      {formatTime(
                        auction.endsIn
                      )}
                    </h3>

                  </div>

                </div>

                {/* BUTTON */}

                <button
                  onClick={() =>
                    placeBid(
                      auction.id
                    )
                  }
                  className="w-full mt-8 bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
                >
                  Place Bid +$25
                </button>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );
}