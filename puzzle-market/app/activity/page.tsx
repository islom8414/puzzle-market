"use client";

import { useEffect, useState } from "react";

type Activity = {
  type: string;
  title: string;
  price: number;
  date: string;
};

export default function ActivityPage() {

  const [activities, setActivities] =
    useState<Activity[]>([]);

  useEffect(() => {

    const saved = JSON.parse(
      localStorage.getItem(
        "puzzle-activity"
      ) || "[]"
    );

    setActivities(saved.reverse());

  }, []);

  return (

    <main className="min-h-screen px-4 md:px-6 py-8 text-white">

      <div className="max-w-5xl mx-auto">

        {/* HERO */}

        <div className="mb-12">

          <p className="text-cyan-400 font-black uppercase tracking-wider text-sm">
            Marketplace Activity
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3">
            Transaction History
          </h1>

          <p className="text-zinc-500 mt-4">
            Live fragment purchases and marketplace trades.
          </p>

        </div>

        {/* EMPTY */}

        {activities.length === 0 && (

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-14 text-center">

            <h2 className="text-3xl font-black">
              No Activity Yet
            </h2>

            <p className="text-zinc-500 mt-3">
              Buy or sell fragments to create marketplace activity.
            </p>

          </div>

        )}

        {/* LIST */}

        <div className="space-y-5">

          {activities.map((activity, index) => (

            <div
              key={index}
              className="bg-zinc-950 border border-white/10 rounded-3xl p-5"
            >

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                  <div className="flex items-center gap-3">

                    <div className={`px-3 py-1 rounded-full text-xs font-black ${
                      activity.type === "BUY"
                        ? "bg-cyan-400 text-black"
                        : "bg-green-400 text-black"
                    }`}>

                      {activity.type}

                    </div>

                    <p className="text-zinc-500 text-sm">
                      {activity.date}
                    </p>

                  </div>

                  <h2 className="text-2xl font-black mt-4">
                    {activity.title}
                  </h2>

                </div>

                <div className="text-left md:text-right">

                  <p className="text-zinc-500 text-sm">
                    Transaction Value
                  </p>

                  <h3 className="text-cyan-400 text-4xl font-black mt-2">
                    ${activity.price}
                  </h3>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    </main>

  );
}