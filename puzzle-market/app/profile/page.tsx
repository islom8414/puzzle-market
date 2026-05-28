"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { cleanPublicName } from "@/lib/display-name";

type OwnedPiece = {
  pieceId: string;
  pieceIndex: number;
  puzzleSlug: string;
  title: string;
  image: string;
  listingPrice: number | null;
};

export default function ProfilePage() {

  const [ownedPieces, setOwnedPieces] =
    useState<OwnedPiece[]>([]);

  const [balance, setBalance] =
    useState(0);

  const [username, setUsername] =
    useState("Guest");

  const [editUsername, setEditUsername] =
    useState("");

  const [savingUsername, setSavingUsername] =
    useState(false);
  const [subscriptionTier, setSubscriptionTier] =
    useState("free");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState("inactive");
  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    // eslint-disable-next-line react-hooks/immutability
    loadProfile();

  }, []);

  const loadProfile =
    async () => {

      const savedUser =
        cleanPublicName(
          localStorage.getItem(
            "puzzle-username"
          )
        );

      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      if (!user) {

        window.location.href =
          "/login";

        return;

      }

      const {
        data: profileData,
      } =
        await supabase
          .from(
            "market_profiles"
          )
          .select(
            "username, subscription_tier, subscription_status, subscription_current_period_end"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      const publicName =
        cleanPublicName(
          profileData?.username ||
          savedUser
        );

      if (
        publicName ===
        "Collector"
      ) {

        window.location.href =
          "/setup";

        return;

      }

      setUsername(
        publicName
      );

      setEditUsername(
          publicName
        );

        setSubscriptionTier(
          profileData?.subscription_tier ||
          "free"
        );

        setSubscriptionStatus(
          profileData?.subscription_status ||
          "inactive"
        );

      localStorage.setItem(
        "puzzle-username",
        publicName
      );

      if (user) {

        const {
          data: accountData,
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

        if (accountData) {

          setBalance(
            accountData
              .balance_cents /
              100
          );

        }

      }

      const {
        data: sessionData,
      } =
        await supabase.auth
          .getSession();

      if (
        sessionData.session
      ) {
        const response =
          await fetch(
            "/api/owned-pieces",
            {
              headers: {
                Authorization:
                  `Bearer ${sessionData.session.access_token}`,
              },
            }
          );

        const exactData =
          await response.json();

        setOwnedPieces(
          exactData.pieces || []
        );
      }

      setLoading(false);

    };

  const saveUsername =
    async () => {

      const nextName =
        cleanPublicName(
          editUsername
        );

      if (
        nextName.length < 3 ||
        nextName === "Collector"
      ) {
        alert(
          "Choose a username with at least 3 letters"
        );
        return;
      }

      setSavingUsername(true);

      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      if (!user?.email) {
        alert("Login required");
        setSavingUsername(false);
        return;
      }

      const { error } =
        await supabase
          .from(
            "market_profiles"
          )
          .upsert(
            {
              id: user.id,
              email: user.email,
              username: nextName,
            },
            {
              onConflict: "id",
            }
          );

      if (error) {
        alert(
          error.message.includes(
            "duplicate"
          )
            ? "Username is already taken"
            : error.message
        );
        setSavingUsername(false);
        return;
      }

      localStorage.setItem(
        "puzzle-username",
        nextName
      );

      setUsername(nextName);
      setEditUsername(nextName);
      setSavingUsername(false);
      alert("Username updated");

    };

  const totalValue =
    useMemo(() => {

      return ownedPieces.reduce(
        (sum, item) =>
          sum + (
            item.listingPrice ||
            0
          ),
        0
      );

    }, [ownedPieces]);

  const activeListings =
    useMemo(
      () =>
        ownedPieces.filter(
          (item) =>
            item.listingPrice
        ).length,
      [ownedPieces]
    );
  const planIsActive =
    subscriptionStatus === "active" ||
    subscriptionStatus === "trialing";

  const planLabel =
    subscriptionTier === "creator"
      ? "CREATOR PLAN"
      : subscriptionTier === "premium"
        ? "PREMIUM PLAN"
        : subscriptionTier === "starter"
          ? "STARTER PLAN"
          : "FREE PROFILE";

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[36px] p-8 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-10 relative">

            <div className="flex items-center gap-6">

              <div className="w-28 h-28 rounded-full bg-cyan-400 text-black flex items-center justify-center text-5xl font-black shadow-[0_0_50px_rgba(34,211,238,0.45)]">

                {username
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
                  Creator Dashboard
                </p>

                <h1 className="text-4xl md:text-6xl font-black mt-3 break-all">
                  {username}
                </h1>

                <p className="text-zinc-500 mt-4 max-w-xl">
                  Premium cloud fragment trader and live marketplace creator.
                </p>

                <div className="flex flex-wrap gap-3 mt-6">

                  <div className="bg-cyan-400 text-black px-4 py-2 rounded-full text-xs font-black">
                    VERIFIED CREATOR
                  </div>
              <Link
                href="/subscribe"
                className="bg-white text-black px-4 py-2 rounded-full text-xs font-black"
              >
                {planIsActive ? planLabel : "UPGRADE PLAN"}
              </Link>

                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-black">
                    LIVE MARKET MEMBER
                  </div>

                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full text-xs font-black">
                    REALTIME CLOUD SYNC
                  </div>

                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl">
                  <input
                    value={editUsername}
                    onChange={(event) =>
                      setEditUsername(
                        event.target.value
                      )
                    }
                    placeholder="Change username"
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/60 px-5 py-3 outline-none focus:border-cyan-400"
                  />

                  <button
                    onClick={saveUsername}
                    disabled={savingUsername}
                    className="rounded-2xl bg-white/10 px-5 py-3 font-black transition hover:bg-cyan-400 hover:text-black disabled:opacity-50"
                  >
                    {savingUsername
                      ? "Saving..."
                      : "Save Name"}
                  </button>
                </div>

              </div>

            </div>

            <Link
              href="/sell"
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-8 py-5 rounded-3xl transition text-center text-lg shadow-[0_0_40px_rgba(34,211,238,0.35)]"
            >
              Resell My Pieces
            </Link>

          </div>

        </section>

        {/* STATS */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Owned Fragments
            </p>

            <h2 className="text-5xl font-black mt-4">
              {ownedPieces.length}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Active Listings
            </p>

            <h2 className="text-5xl font-black mt-4">
              {activeListings}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Wallet Balance
            </p>

            <h2 className="text-5xl font-black mt-4 text-cyan-400">
              ${balance}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[30px] p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Listed Value
            </p>

            <h2 className="text-5xl font-black mt-4 text-green-400">
              ${totalValue}
            </h2>

          </div>

        </section>

        <section className="mt-12">

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
                Inventory
              </p>

              <h2 className="text-4xl md:text-5xl font-black mt-3">
                Owned Pieces
              </h2>
            </div>

            <Link
              href="/sell"
              className="bg-white/5 border border-white/10 hover:border-cyan-400 font-black px-5 py-3 rounded-2xl transition"
            >
              Resell Pieces
            </Link>
          </div>

          {ownedPieces.length === 0 && (
            <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-[30px] p-10 text-center">
              <h3 className="text-3xl font-black">
                No owned pieces yet
              </h3>

              <p className="text-zinc-500 mt-3">
            Purchased missing pieces will appear here as ownership certificates.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
            {ownedPieces.map((item) => (
              <div
                key={item.pieceId}
                className="overflow-hidden rounded-[30px] border border-cyan-400/25 bg-cyan-400/[0.04]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-56 w-full object-cover blur-sm scale-105"
                />

                <div className="p-5">
                  <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.25em]">
                    Ownership Certificate
                  </p>

                  <h3 className="text-3xl font-black mt-2">
                    {item.title} #{item.pieceIndex}
                  </h3>

                  <p className="text-zinc-500 mt-3">
                    This missing piece belongs to you. You can keep it or list it for resale.
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-cyan-400 text-xl font-black">
                      {item.listingPrice
                        ? `Listed $${item.listingPrice}`
                        : "Private"}
                    </span>

                    <Link
                      href="/sell"
                      className="bg-cyan-400 text-black font-black px-4 py-2 rounded-xl"
                    >
                      Resell
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </section>

      </div>

    </main>

  );

}

