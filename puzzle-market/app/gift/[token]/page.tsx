"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

export default function GiftClaimPage() {
  const params = useParams<{
    token: string;
  }>();
  const giftToken =
    params.token || "";
  const [loggedIn, setLoggedIn] =
    useState(false);
  const [claiming, setClaiming] =
    useState(false);
  const [message, setMessage] =
    useState("");
  const [claimedSlug, setClaimedSlug] =
    useState("");

  useEffect(() => {
    if (giftToken) {
      localStorage.setItem(
        "puzzle-gift-token",
        giftToken
      );
    }

    supabase.auth
      .getUser()
      .then(({ data }) => {
        setLoggedIn(
          Boolean(data.user)
        );
      });
  }, [giftToken]);

  const registerHref =
    useMemo(
      () =>
        `/register?gift=${encodeURIComponent(giftToken)}`,
      [giftToken]
    );

  const loginHref =
    useMemo(
      () =>
        `/login?next=${encodeURIComponent(`/gift/${giftToken}`)}`,
      [giftToken]
    );

  const claimGift =
    async () => {
      setClaiming(true);
      setMessage("");

      try {
        const { data } =
          await supabase.auth.getSession();

        if (!data.session) {
          window.location.href =
            loginHref;
          return;
        }

        const response =
          await apiFetch(
            "/api/gifts/claim",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({
                giftToken,
              }),
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          setMessage(
            result.error ||
            "Gift is not ready yet. Make sure you are using the same email and have an active Starter plan or higher."
          );
          return;
        }

        setClaimedSlug(
          result.puzzleSlug || ""
        );
        setMessage(
          result.emailSent
            ? "Gift claimed. Your ownership certificate was emailed."
            : "Gift claimed. Certificate email could not be sent automatically, but the piece is now in your profile."
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Gift claim failed"
        );
      } finally {
        setClaiming(false);
      }
    };

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-3xl items-center">
        <div className="w-full rounded-[30px] border border-cyan-400/25 bg-zinc-950 p-6 shadow-[0_0_80px_rgba(34,211,238,0.16)] md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
            Puzzle Market Gift
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
            A puzzle piece is reserved for you.
          </h1>

          <p className="mt-5 text-lg leading-8 text-zinc-300">
            Sign in or create an account with the email that received the gift.
            After you activate a Starter plan or higher, this piece can be
            claimed and your ownership certificate will be emailed to you.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {loggedIn ? (
              <button
                type="button"
                onClick={claimGift}
                disabled={claiming}
                className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
              >
                {claiming
                  ? "Claiming..."
                  : "Claim Gift"}
              </button>
            ) : (
              <>
                <Link
                  href={registerHref}
                  className="rounded-2xl bg-cyan-400 px-6 py-4 text-center font-black text-black transition hover:bg-cyan-300"
                >
                  Create Account
                </Link>

                <Link
                  href={loginHref}
                  className="rounded-2xl border border-white/15 px-6 py-4 text-center font-black transition hover:border-cyan-400"
                >
                  Sign In
                </Link>
              </>
            )}

            {loggedIn && (
              <Link
                href="/subscribe"
                className="rounded-2xl border border-white/15 px-6 py-4 text-center font-black transition hover:border-cyan-400"
              >
                Activate Plan
              </Link>
            )}
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-4 text-sm leading-6 text-zinc-200">
              {message}

              {claimedSlug && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/puzzle/${claimedSlug}`}
                    className="rounded-xl bg-white px-4 py-2 font-black text-black"
                  >
                    Open Puzzle
                  </Link>

                  <Link
                    href="/profile"
                    className="rounded-xl border border-white/15 px-4 py-2 font-black"
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          )}

          <p className="mt-6 text-sm text-zinc-500">
            The gift can only be claimed by the email address chosen by the
            sender. If the sender sells the piece before it is claimed, the
            gift will no longer be valid.
          </p>
        </div>
      </section>
    </main>
  );
}
