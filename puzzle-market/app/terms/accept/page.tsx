"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  TERMS_ACCEPTANCE_TEXT,
  TERMS_SECTIONS,
  TERMS_TITLE,
  TERMS_VERSION,
} from "@/lib/legal";
import { hasAcceptedCurrentTerms } from "@/lib/terms-status";
import { supabase } from "@/lib/supabase";

function safeNextPath() {
  if (typeof window === "undefined") {
    return "/marketplace";
  }

  const raw =
    new URLSearchParams(
      window.location.search
    ).get("next") || "/marketplace";

  return raw.startsWith("/") &&
    !raw.startsWith("//")
    ? raw
    : "/marketplace";
}

export default function AcceptTermsPage() {
  const scrollRef =
    useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [canAccept, setCanAccept] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const nextPath =
    useMemo(() => safeNextPath(), []);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!session) {
        window.location.replace(
          `/login?next=${encodeURIComponent(nextPath)}`
        );
        return;
      }

      if (
        hasAcceptedCurrentTerms(
          session.user.user_metadata as Record<
            string,
            unknown
          >
        )
      ) {
        window.location.replace(nextPath);
        return;
      }

      setLoading(false);
    }

    checkSession();
  }, [nextPath]);

  function handleScroll() {
    const node = scrollRef.current;

    if (!node) {
      return;
    }

    const atBottom =
      node.scrollTop +
        node.clientHeight >=
      node.scrollHeight - 12;

    if (atBottom) {
      setCanAccept(true);
    }
  }

  async function acceptTerms() {
    setSubmitting(true);
    setMessage("");

    const {
      data: { session },
    } =
      await supabase.auth.getSession();

    if (!session) {
      window.location.replace(
        `/login?next=${encodeURIComponent(nextPath)}`
      );
      return;
    }

    const response = await fetch(
      "/api/terms-acceptance",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const data =
        await response
          .json()
          .catch(() => ({}));

      setMessage(
        data.error ||
          "Could not save agreement. Please try again."
      );
      setSubmitting(false);
      return;
    }

    await supabase.auth.refreshSession();
    window.location.replace(nextPath);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-cyan-400" />
          <h1 className="mt-5 text-3xl font-black">
            Preparing agreement...
          </h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-6">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_35%)] pointer-events-none" />

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-white/10 bg-zinc-950/95 p-5 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur-xl md:rounded-[36px] md:p-8">
          <div className="flex items-center gap-4 border-b border-white/10 pb-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-3xl font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)]">
              P
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                Required Agreement
              </p>
              <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">
                {TERMS_TITLE}
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Version {TERMS_VERSION}
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="mt-5 max-h-[48vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/55 p-5 pr-4 md:max-h-[52vh]"
          >
            <p className="leading-relaxed text-zinc-300">
              Please read this agreement carefully. You must scroll to the end
              before accepting.
            </p>

            <div className="mt-5 space-y-5">
              {TERMS_SECTIONS.map((section, index) => (
                <article
                  key={section.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-xs font-black text-cyan-400">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-2 text-xl font-black">
                    {section.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-zinc-400">
                    {section.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
              <h2 className="text-xl font-black text-cyan-300">
                Acceptance
              </h2>
              <p className="mt-3 leading-relaxed text-zinc-200">
                {TERMS_ACCEPTANCE_TEXT}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-zinc-500">
              {canAccept
                ? "You reached the end. You can accept now."
                : "Scroll to the bottom to enable agreement."}
            </p>

            <button
              type="button"
              onClick={acceptTerms}
              disabled={!canAccept || submitting}
              className="rounded-2xl bg-cyan-400 px-7 py-4 font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {submitting
                ? "Saving..."
                : "I Agree And Continue"}
            </button>
          </div>

          {message && (
            <p className="mt-4 text-center text-sm text-red-400">
              {message}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

