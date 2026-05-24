"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import { cleanPublicName } from "@/lib/public-identity";

export default function SupportPage() {
  const [subject, setSubject] =
    useState("");

  const [details, setDetails] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function sendTicket() {
    if (
      subject.trim().length < 3 ||
      details.trim().length < 10
    ) {
      alert("Describe the issue first");
      return;
    }

    setLoading(true);

    const {
      data: {
        user,
      },
    } =
      await supabase.auth
        .getUser();

    if (!user) {
      alert("Login required");
      location.href = "/login";
      return;
    }

    const { data: profile } =
      await supabase
        .from("market_profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

    const publicName =
      cleanPublicName(
        profile?.username ||
        localStorage.getItem(
          "puzzle-username"
        )
      );

    await supabase
      .from("chat")
      .insert({
        username: "Support Ticket",
        message:
          `[${publicName}] ${subject.trim()} - ${details.trim()}`,
      });

    setSubject("");
    setDetails("");
    setLoading(false);
    alert("Support ticket sent");
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-10">
      <section className="mx-auto max-w-7xl">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Help Desk
        </p>

        <h1 className="mt-5 text-5xl md:text-7xl font-black leading-none">
          Support Center
        </h1>

        <p className="mt-6 max-w-3xl text-zinc-400 text-lg">
          Get help with login, wallet topups, missing pieces, resale listings and ownership transfers.
        </p>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              [
                "Wallet Topup",
                "Stripe payments are confirmed by webhook before balance is credited.",
              ],
              [
                "Missing Piece",
                "A puzzle shows only the exact missing piece that belongs to the current owner.",
              ],
              [
                "Resale",
                "Owners can list purchased pieces with their own resale price.",
              ],
              [
                "Privacy",
                "Public pages show usernames only. Emails and platform owner identity stay hidden.",
              ],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"
              >
                <h2 className="text-2xl font-black">
                  {title}
                </h2>

                <p className="mt-4 text-zinc-400">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <aside className="rounded-[32px] border border-cyan-400/20 bg-cyan-400/[0.04] p-6">
            <h2 className="text-3xl font-black">
              Open Ticket
            </h2>

            <input
              value={subject}
              onChange={(event) =>
                setSubject(
                  event.target.value
                )
              }
              placeholder="Subject"
              className="mt-6 w-full rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400"
            />

            <textarea
              value={details}
              onChange={(event) =>
                setDetails(
                  event.target.value
                )
              }
              placeholder="Tell us what happened..."
              rows={6}
              className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400"
            />

            <button
              onClick={sendTicket}
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-cyan-400 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading
                ? "Sending..."
                : "Send Ticket"}
            </button>

            <a
              href="/chat"
              className="mt-4 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-4 font-black transition hover:border-cyan-400"
            >
              Open Community Chat
            </a>
          </aside>
        </div>
      </section>
    </main>
  );
}
