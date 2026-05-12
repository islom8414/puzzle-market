"use client";

import { useEffect, useState } from "react";

const activities = [
  "Alex bought Dragon Fantasy for $250",
  "Mika listed Book Kingdom collection",
  "ShadowUser sold rare puzzle piece",
  "New VIP collection added",
  "CryptoWolf purchased Dark Desert",
  "Marketplace volume reached $2.4M",
  "Rare piece discovered in fantasy archive",
];

export default function LiveFeed() {

  const [feed, setFeed] = useState(activities[0]);

  useEffect(() => {

    const interval = setInterval(() => {

      const random =
        activities[
          Math.floor(Math.random() * activities.length)
        ];

      setFeed(random);

    }, 3000);

    return () => clearInterval(interval);

  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50">

      <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-2xl px-5 py-4 shadow-2xl max-w-[320px] animate-pulse">

        <div className="flex items-center gap-3">

          <div className="w-3 h-3 rounded-full bg-green-400"></div>

          <p className="text-xs text-zinc-400 uppercase font-bold">
            Live Marketplace
          </p>

        </div>

        <p className="text-sm mt-3 leading-relaxed">
          {feed}
        </p>

      </div>

    </div>
  );
}