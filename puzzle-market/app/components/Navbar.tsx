"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import {
  cacheUsername,
  fetchMyProfile,
} from "@/lib/client-profile";
import { CHOOSE_PUZZLE_HREF } from "@/lib/site-links";
import LanguageSwitcher from "./LanguageSwitcher";

const initialNotifications = [
  "Verified wallet flow is online",
];

export default function Navbar() {

  const [open, setOpen] =
    useState(false);

  const [walletOpen, setWalletOpen] =
    useState(false);

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [balance, setBalance] =
    useState(0);

  const [authenticated, setAuthenticated] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [notifications, setNotifications] =
    useState<string[]>(
      initialNotifications
    );

  const [notificationCount, setNotificationCount] =
    useState(0);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/immutability
    loadUserProfile();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadUserProfile();
        }
      );

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  const loadUserProfile =
    async () => {

      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      if (!user) {
        setAuthenticated(false);
        setUsername("");
        setBalance(0);
        localStorage.removeItem(
          "puzzle-balance"
        );
        return;
      }

      setAuthenticated(true);

      const profile =
        await fetchMyProfile();

      if (
        profile?.profileComplete &&
        profile.username
      ) {
        setUsername(
          profile.username
        );

        cacheUsername(
          profile.username
        );
      } else {
        setUsername("");
      }

      const {
        data: account,
      } =
        await supabase
          .from(
            "wallet_accounts"
          )
          .select(
            "balance_cents"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

      if (account) {
        const dollars =
          account.balance_cents /
          100;

        setBalance(dollars);

        localStorage.setItem(
          "puzzle-balance",
          String(dollars)
        );
      }

    };

  const handleLogout = () => {

    localStorage.removeItem(
      "puzzle-user"
    );

    localStorage.removeItem(
      "puzzle-username"
    );

    localStorage.removeItem(
      "puzzle-balance"
    );

    supabase.auth.signOut();

    window.location.href =
      "/login";

  };

  return (

    <>
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-xl border-b border-white/5">

        <div className="max-w-7xl mx-auto px-4 md:px-6">

          <div className="h-16 flex items-center justify-between gap-3">

            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-6 2xl:gap-10">

              <a
                href="/marketplace"
                className="flex min-w-0 items-center gap-3"
              >

                <div className="w-10 h-10 shrink-0 rounded-2xl bg-cyan-400 text-black flex items-center justify-center font-black">
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

              <nav className="hidden 2xl:flex min-w-0 items-center gap-5 text-sm font-semibold">

                <a
                  href={CHOOSE_PUZZLE_HREF}
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Play
                </a>

                <a
                  href="/marketplace"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Explore
                </a>

                <a
                  href="/profile"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Profile
                </a>                <a
                  href="/subscribe"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Plans
                </a>


                <a
                  href="/sell"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Sell
                </a>

                <a
                  href="/withdraw"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Withdraw
                </a>

                <a
                  href="/chat"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Chat
                </a>

                <a
                  href="/support"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  Support
                </a>

                <a
                  href="/about"
                  className="translate-safe-nav hover:text-cyan-400 transition"
                >
                  About
                </a>

              </nav>

            </div>

            {/* RIGHT */}

            <div className="flex shrink-0 items-center gap-2 md:gap-3">

              <LanguageSwitcher />

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
                  className="relative w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:border-cyan-400 transition text-[10px] font-black"
                >
                  ALR
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
                  className="translate-safe-action hidden md:flex bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm font-black hover:border-cyan-400 transition"
                >
                  Login
                </a>

              )}

              {/* WALLET */}

              {authenticated && (
                <button
                  onClick={() =>
                    setWalletOpen(true)
                  }
                  className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-3 md:px-4 py-2 rounded-2xl transition text-sm md:text-base"
                >
                  ${balance}
                </button>
              )}

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
                className="translate-safe-action 2xl:hidden h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center px-3 text-xs font-black"
              >

                {open ? "Close" : "Menu"}
              </button>

            </div>

          </div>

        </div>

        {/* MOBILE MENU */}

        {open && (

          <div className="2xl:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl">

            <div className="px-4 py-5 grid grid-cols-2 gap-3 text-sm font-semibold">

              <a href={CHOOSE_PUZZLE_HREF} className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Play
              </a>

              <a href="/marketplace" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Explore
              </a>

              <a href="/profile" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Profile
              </a>

              <a href="/subscribe" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Plans
              </a>


              <a href="/sell" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Sell
              </a>

              <a href="/withdraw" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Withdraw
              </a>

              <a href="/chat" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Chat
              </a>

              <a href="/support" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                Support
              </a>

              <a href="/about" className="translate-safe-action rounded-2xl bg-white/[0.04] px-4 py-3">
                About
              </a>

              <div className="col-span-2 border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                {username ? (
                  <>
                    <a
                      href="/profile"
                      className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 font-black"
                    >
                      {username}
                    </a>

                    <button
                      onClick={handleLogout}
                      className="rounded-2xl bg-red-500/20 border border-red-500/30 px-4 py-3 font-black text-red-300 text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <a
                    href="/login"
                    className="translate-safe-action rounded-2xl bg-cyan-400 px-4 py-3 font-black text-black text-center"
                  >
                    Login
                  </a>
                )}
              </div>

            </div>

          </div>

        )}

      </header>

      {/* WALLET MODAL */}

      {walletOpen && authenticated && (

        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-6">

          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[24px] md:rounded-3xl p-5 md:p-6">

            <div className="flex items-center justify-between">

              <h2 className="text-2xl md:text-3xl font-black">
                Wallet
              </h2>

              <button
                onClick={() =>
                  setWalletOpen(false)
                }
                className="text-zinc-500 hover:text-white text-xl font-black"
              >
                X
              </button>

            </div>

            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 text-center">

              <p className="text-zinc-500 text-sm">
                Current Balance
              </p>

              <h3 className="text-cyan-400 text-4xl md:text-5xl font-black mt-3">
                ${balance}
              </h3>

            </div>

            <a
              href="/add-funds"
              className="flex items-center justify-center w-full mt-6 bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
            >
              Add Funds
            </a>

            <a
              href="/withdraw"
              className="flex items-center justify-center w-full mt-3 bg-white text-black font-black py-4 rounded-2xl transition hover:bg-zinc-200"
            >
              Withdraw Funds
            </a>

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


