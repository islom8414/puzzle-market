"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

const initialNotifications = [
  "Marketplace synced successfully",
];

export default function Navbar() {

  const [open, setOpen] =
    useState(false);

  const [walletOpen, setWalletOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [balance, setBalance] =
    useState(8000);

  const [username, setUsername] =
    useState("");

  const [notifications, setNotifications] =
    useState<string[]>(
      initialNotifications
    );

  const [notificationCount, setNotificationCount] =
    useState(0);

  useEffect(() => {

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

    loadNotifications();

    const channel =
      supabase
        .channel(
          "navbar-live"
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table:
              "marketplace",
          },
          (payload) => {

            const item =
              payload.new as any;

            setNotifications(
              (prev) => [
                `New fragment listed: ${item.title}`,
                ...prev,
              ]
            );

            setNotificationCount(
              (prev) =>
                prev + 1
            );

          }
        )
        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );

    };

  }, []);

  const loadNotifications =
    async () => {

      const { data } =
        await supabase
          .from("marketplace")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          )
          .limit(5);

      if (data) {

        const mapped =
          data.map(
            (item: any) =>
              `New fragment listed: ${item.title}`
          );

        setNotifications(
          mapped
        );

      }

    };

  const addFunds = (
    amount: number
  ) => {

    const newBalance =
      balance + amount;

    setBalance(newBalance);

    localStorage.setItem(
      "puzzle-balance",
      String(newBalance)
    );

  };

  const handleLogout = () => {

    localStorage.removeItem(
      "puzzle-user"
    );

    window.location.href =
      "/login";

  };

  return (

    <>
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/5">

        <div className="max-w-7xl mx-auto px-4 md:px-6">

          <div className="h-16 flex items-center justify-between">

            {/* LEFT */}

            <div className="flex items-center gap-10">

              <a
                href="/marketplace"
                className="flex items-center gap-3"
              >

                <div className="w-10 h-10 rounded-2xl bg-cyan-400 text-black flex items-center justify-center font-black">
                  P
                </div>

                <div className="hidden sm:block">

                  <h1 className="font-black text-lg">
                    Puzzle Market
                  </h1>

                  <p className="text-zinc-500 text-[10px]">
                    Premium Marketplace
                  </p>

                </div>

              </a>

              <nav className="hidden xl:flex items-center gap-6 text-sm font-semibold">

                <a
                  href="/marketplace"
                  className="hover:text-cyan-400 transition"
                >
                  Explore
                </a>

                <a
                  href="/create"
                  className="hover:text-cyan-400 transition"
                >
                  Create
                </a>

                <a
                  href="/profile"
                  className="hover:text-cyan-400 transition"
                >
                  Profile
                </a>

                <a
                  href="/sell"
                  className="hover:text-cyan-400 transition"
                >
                  Sell
                </a>

              </nav>

            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-3">

              {/* NOTIFICATIONS */}

              <div className="relative hidden md:block">

                <button
                  onClick={() => {

                    setNotificationsOpen(
                      !notificationsOpen
                    );

                    setNotificationCount(
                      0
                    );

                  }}
                  className="relative w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-cyan-400 transition"
                >

                  🔔

                  {notificationCount >
                    0 && (

                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-400 text-black text-[10px] font-black flex items-center justify-center">
                      {
                        notificationCount
                      }
                    </div>

                  )}

                </button>

                {notificationsOpen && (

                  <div className="absolute right-0 top-14 w-[320px] bg-zinc-950 border border-white/10 rounded-3xl p-4 shadow-2xl">

                    <h3 className="font-black text-lg mb-4">
                      Live Notifications
                    </h3>

                    <div className="space-y-3 max-h-[320px] overflow-y-auto">

                      {notifications.map(
                        (
                          item,
                          index
                        ) => (

                          <div
                            key={index}
                            className="bg-white/5 border border-white/5 rounded-2xl p-3 text-sm"
                          >
                            {item}
                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}

              </div>

              {/* PROFILE */}

              {username ? (

                <a
                  href="/profile"
                  className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2"
                >

                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-black flex items-center justify-center font-black text-sm">
                    {username
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>

                    <p className="text-sm font-black uppercase">
                      {username}
                    </p>

                    <p className="text-zinc-500 text-[10px]">
                      LIVE USER
                    </p>

                  </div>

                </a>

              ) : (

                <a
                  href="/login"
                  className="hidden md:flex bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm font-black hover:border-cyan-400 transition"
                >
                  Login
                </a>

              )}

              {/* WALLET */}

              <button
                onClick={() =>
                  setWalletOpen(true)
                }
                className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-4 py-2 rounded-2xl transition"
              >
                ${balance}
              </button>

              {/* LOGOUT */}

              {username && (

                <button
                  onClick={handleLogout}
                  className="hidden md:flex bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl px-4 py-2 text-sm font-black"
                >
                  Logout
                </button>

              )}

              {/* MOBILE */}

              <button
                onClick={() =>
                  setOpen(!open)
                }
                className="xl:hidden w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
              >

                {open ? "✕" : "☰"}

              </button>

            </div>

          </div>

        </div>

        {/* MOBILE MENU */}

        {open && (

          <div className="xl:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl">

            <div className="px-4 py-5 flex flex-col gap-4 text-sm font-semibold">

              <a href="/marketplace">
                Explore
              </a>

              <a href="/create">
                Create
              </a>

              <a href="/profile">
                Profile
              </a>

              <a href="/sell">
                Sell
              </a>

            </div>

          </div>

        )}

      </header>

      {/* WALLET MODAL */}

      {walletOpen && (

        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">

          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6">

            <div className="flex items-center justify-between">

              <h2 className="text-3xl font-black">
                Wallet
              </h2>

              <button
                onClick={() =>
                  setWalletOpen(false)
                }
                className="text-zinc-500 hover:text-white text-xl"
              >
                ✕
              </button>

            </div>

            <div className="mt-6 bg-white/5 border border-white/10 rounded-3xl p-5 text-center">

              <p className="text-zinc-500 text-sm">
                Current Balance
              </p>

              <h3 className="text-cyan-400 text-5xl font-black mt-3">
                ${balance}
              </h3>

            </div>

            <div className="grid grid-cols-3 gap-3 mt-6">

              {[100, 500, 1000].map(
                (amount) => (

                  <button
                    key={amount}
                    onClick={() =>
                      addFunds(amount)
                    }
                    className="bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
                  >
                    +${amount}
                  </button>

                )
              )}

            </div>

            <button
              onClick={() =>
                setWalletOpen(false)
              }
              className="w-full mt-6 bg-white/5 border border-white/10 hover:border-cyan-400 py-4 rounded-2xl font-bold transition"
            >
              Close Wallet
            </button>

          </div>

        </div>

      )}

    </>
  );
}