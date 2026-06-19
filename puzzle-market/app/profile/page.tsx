"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import {
  cacheUsername,
  fetchMyProfile,
  saveMyUsername,
} from "@/lib/client-profile";
import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { sanitizeUsername } from "@/lib/display-name";

type OwnedPiece = {
  pieceId: string;
  pieceIndex: number;
  puzzleSlug: string;
  title: string;
  image: string;
  listingPrice: number | null;
  giftPendingEmail: string | null;
  giftClaimUrl: string | null;
};

type ReferralReward = {
  id: string;
  threshold_count: number;
  reward_cents: number;
  remaining_cents: number;
  status: string;
};

type ReferralSummary = {
  referralCode: string;
  referralUrl: string;
  registeredCount: number;
  qualifiedCount: number;
  nextMilestone: {
    threshold: number;
    rewardCents: number;
  } | null;
  rewards: ReferralReward[];
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
  const [referrals, setReferrals] =
    useState<ReferralSummary | null>(
      null
    );
  const [giftingPieceId, setGiftingPieceId] =
    useState<string | null>(null);
  useEffect(() => {

    // eslint-disable-next-line react-hooks/immutability
    loadProfile();

  }, []);

  const loadProfile =
    async () => {

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

      const profile =
        await fetchMyProfile();

      if (
        !profile?.profileComplete ||
        !profile.username
      ) {
        window.location.href =
          "/setup";

        return;
      }

      setUsername(
        profile.username
      );

      setEditUsername(
        profile.username
      );

      const {
        data: profileData,
      } =
        await supabase
          .from(
            "market_profiles"
          )
          .select(
            "subscription_tier, subscription_status, subscription_current_period_end"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

        setSubscriptionTier(
          profileData?.subscription_tier ||
          "free"
        );

        setSubscriptionStatus(
          profileData?.subscription_status ||
          "inactive"
        );

      cacheUsername(
        profile.username
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
          await apiFetch(
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

        const referralResponse =
          await apiFetch(
            "/api/referrals",
            {
              headers: {
                Authorization:
                  `Bearer ${sessionData.session.access_token}`,
              },
            }
          );

        if (referralResponse.ok) {
          setReferrals(
            await referralResponse.json()
          );
        }
      }

    };

  const saveUsername =
    async () => {

      const nextName =
        sanitizeUsername(
          editUsername
        );

      if (
        nextName.length < 3
      ) {
        alert(
          "Choose a username with at least 3 letters"
        );
        return;
      }

      setSavingUsername(true);

      const result =
        await saveMyUsername(
          nextName
        );

      setSavingUsername(false);

      if (!result.ok) {
        alert(result.error);
        return;
      }

      cacheUsername(
        result.username
      );

      setUsername(result.username);
      setEditUsername(result.username);
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

  const activeReferralCredit =
    referrals?.rewards.reduce(
      (sum, reward) =>
        reward.status === "active"
          ? sum +
            reward.remaining_cents
          : sum,
      0
    ) || 0;

  const copyReferralLink =
    async () => {
      if (!referrals?.referralUrl) {
        return;
      }

      await navigator.clipboard.writeText(
        referrals.referralUrl
      );
      alert("Referral link copied");
    };

  const copyText =
    async (
      value: string,
      successMessage: string
    ) => {
      try {
        await navigator.clipboard.writeText(
          value
        );
        alert(successMessage);
      } catch {
        window.prompt(
          "Copy this link",
          value
        );
      }
    };

  const giftPiece =
    async (item: OwnedPiece) => {
      const email = window.prompt(
        "Recipient email for this gift"
      );

      if (!email) {
        return;
      }

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail.includes("@")) {
        alert(
          "Enter a valid recipient email"
        );
        return;
      }

      const confirmed =
        window.confirm(
          "This will reserve the piece as a gift and cancel its active resale listing if it has one. Continue?"
        );

      if (!confirmed) {
        return;
      }

      setGiftingPieceId(
        item.pieceId
      );

      try {
        const {
          data: sessionData,
        } =
          await supabase.auth.getSession();

        if (!sessionData.session) {
          window.location.assign(
            "/login"
          );
          return;
        }

        const response =
          await apiFetch(
            "/api/gifts",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${sessionData.session.access_token}`,
              },
              body: JSON.stringify({
                pieceId:
                  item.pieceId,
                email:
                  cleanEmail,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          alert(
            data.error ||
            "Gift creation failed"
          );
          return;
        }

        if (data.claimUrl) {
          await copyText(
            data.claimUrl,
            data.emailSent
              ? "Gift invitation sent. Gift link also copied."
              : `Gift reserved, but email was not sent automatically.${data.emailReason ? ` Reason: ${data.emailReason}` : ""} Gift link copied.`
          );
        } else {
          alert(
            data.emailSent
              ? "Gift invitation sent."
              : `Gift reserved, but email was not sent automatically.${data.emailReason ? ` Reason: ${data.emailReason}` : ""}`
          );
        }

        await loadProfile();
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Gift creation failed"
        );
      } finally {
        setGiftingPieceId(null);
      }
    };

  return (

    <main className="min-h-screen bg-black text-white overflow-hidden">

      {/* BACKGROUND */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* HERO */}

        <section className="bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[36px] p-5 md:p-10 backdrop-blur-xl overflow-hidden relative">

          <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-400/10 blur-3xl rounded-full" />

          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-10 relative">

            <div className="flex flex-col sm:flex-row sm:items-center gap-5 md:gap-6">

              <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-cyan-400 text-black flex shrink-0 items-center justify-center text-4xl md:text-5xl font-black shadow-[0_0_50px_rgba(34,211,238,0.45)]">

                {username
                  .charAt(0)
                  .toUpperCase()}

              </div>

              <div>

                <p className="text-cyan-400 uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs font-black">
                  Creator Dashboard
                </p>

                <h1 className="text-4xl md:text-6xl font-black mt-3 break-words">
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
              className="bg-cyan-400 hover:bg-cyan-300 text-black font-black px-6 md:px-8 py-4 md:py-5 rounded-2xl md:rounded-3xl transition text-center text-base md:text-lg shadow-[0_0_40px_rgba(34,211,238,0.35)]"
            >
              Resell My Pieces
            </Link>

          </div>

        </section>

        <section className="mt-8 rounded-[24px] border border-cyan-400/20 bg-cyan-400/[0.05] p-5 md:rounded-[30px] md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.22em]">
                Referrals
              </p>

              <h2 className="mt-3 text-3xl md:text-4xl font-black">
                Invite collectors. Earn free puzzle credit.
              </h2>

              <p className="mt-3 max-w-3xl text-zinc-400">
                Rewards unlock only when invited users register and buy an active Starter, Premium, or Creator plan.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-black/50 p-4">
                <p className="text-xs text-zinc-500">
                  Registered
                </p>
                <p className="mt-2 text-2xl font-black">
                  {referrals?.registeredCount || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-black/50 p-4">
                <p className="text-xs text-zinc-500">
                  Paid
                </p>
                <p className="mt-2 text-2xl font-black text-cyan-300">
                  {referrals?.qualifiedCount || 0}
                </p>
              </div>

              <div className="rounded-2xl bg-black/50 p-4">
                <p className="text-xs text-zinc-500">
                  Credit
                </p>
                <p className="mt-2 text-2xl font-black text-green-300">
                  ${(activeReferralCredit / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              readOnly
              value={
                referrals?.referralUrl ||
                "Referral link loads after profile sync"
              }
              className="min-w-0 rounded-2xl border border-white/10 bg-black/60 px-5 py-4 text-sm outline-none"
            />

            <button
              type="button"
              onClick={copyReferralLink}
              disabled={!referrals?.referralUrl}
              className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >
              Copy Link
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-6 text-zinc-300">
            {referrals?.nextMilestone ? (
              <>
                Next reward:{" "}
                <span className="font-black text-white">
                  {referrals.nextMilestone.threshold} paid referrals
                </span>{" "}
                unlocks{" "}
                <span className="font-black text-cyan-300">
                  ${(
                    referrals.nextMilestone.rewardCents / 100
                  ).toFixed(0)}
                </span>{" "}
                free puzzle credit.
              </>
            ) : (
              "All launch referral milestones are unlocked. More tiers can be added later."
            )}
          </div>
        </section>

        {/* STATS */}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mt-8 md:mt-10">

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Owned Fragments
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              {ownedPieces.length}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Active Listings
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4">
              {activeListings}
            </h2>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Wallet Balance
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4 text-cyan-400">
              ${balance}
            </h2>

            <div className="mt-5 flex gap-3">
              <Link
                href="/add-funds"
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-black"
              >
                Add
              </Link>

              <Link
                href="/withdraw"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black"
              >
                Withdraw
              </Link>
            </div>

          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[22px] md:rounded-[30px] p-5 md:p-6 backdrop-blur-xl">

            <p className="text-zinc-500 text-sm">
              Listed Value
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-4 text-green-400">
              ${totalValue}
            </h2>

          </div>

        </section>

        <section className="mt-12">

          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-cyan-400 uppercase tracking-[0.18em] md:tracking-[0.3em] text-xs font-black">
                Inventory
              </p>

              <h2 className="text-3xl md:text-5xl font-black mt-3">
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
            <div className="mt-8 bg-white/[0.03] border border-white/10 rounded-[24px] md:rounded-[30px] p-6 md:p-10 text-center">
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
                className="overflow-hidden rounded-[24px] md:rounded-[30px] border border-cyan-400/25 bg-cyan-400/[0.04]"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-48 md:h-56 w-full object-cover blur-sm scale-105"
                />

                <div className="p-5">
                  <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.25em]">
                    Ownership Certificate
                  </p>

                  <h3 className="text-2xl md:text-3xl font-black mt-2">
                    {item.title} #{item.pieceIndex}
                  </h3>

                  <p className="text-zinc-500 mt-3">
                    {item.giftPendingEmail
                      ? `Gift pending for ${item.giftPendingEmail}. The piece stays in your account until the recipient claims it.`
                      : "This missing piece belongs to you. You can keep it or list it for resale."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/puzzle/${item.puzzleSlug}`}
                      className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black"
                    >
                      Open Puzzle
                    </Link>

                    {item.giftPendingEmail ? (
                      <button
                        type="button"
                        onClick={() =>
                          item.giftClaimUrl &&
                          copyText(
                            item.giftClaimUrl,
                            "Gift link copied"
                          )
                        }
                        className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-black"
                      >
                        Copy Gift Link
                      </button>
                    ) : (
                      <Link
                        href="/sell"
                        className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-black text-black"
                      >
                        {item.listingPrice
                          ? `Listed $${item.listingPrice}`
                          : "Resell"}
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        giftPiece(item)
                      }
                      disabled={
                        Boolean(
                          item.giftPendingEmail
                        ) ||
                        giftingPieceId ===
                        item.pieceId
                      }
                      className="rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:opacity-50"
                    >
                      {giftingPieceId ===
                      item.pieceId
                        ? "Sending..."
                        : item.giftPendingEmail
                          ? "Gift Pending"
                        : "Gift"}
                    </button>
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

