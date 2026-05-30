"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "islommatchanov888@gmail.com";

export default function CreatePage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkCreatorAccess();
  }, []);

  async function checkCreatorAccess() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("market_profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", session.user.id)
      .maybeSingle();

    const active =
      data?.subscription_status === "active" ||
      data?.subscription_status === "trialing";

    const isAdmin =
      session.user.email?.toLowerCase() === ADMIN_EMAIL;

    setAllowed(
      isAdmin ||
        (active && data?.subscription_tier === "creator")
    );

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading creator access...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <section className="max-w-2xl rounded-[32px] border border-cyan-400/20 bg-white/[0.03] p-8 text-center">
          <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
            Creator Plan Required
          </p>

          <h1 className="mt-4 text-4xl md:text-6xl font-black">
            Puzzle creation is locked.
          </h1>

          <p className="mt-5 text-zinc-400">
            Collectors can buy and resell pieces. Only Creator members can upload new official puzzle boards and set missing piece prices.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/subscribe"
              className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black"
            >
              Upgrade To Creator
            </Link>
            <Link
              href="/sell"
              className="rounded-2xl border border-white/15 px-6 py-4 font-black"
            >
              Resell My Pieces
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <section className="mx-auto max-w-3xl rounded-[32px] border border-cyan-400/20 bg-white/[0.03] p-8">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em]">
          Creator Studio
        </p>

        <h1 className="mt-4 text-4xl md:text-6xl font-black">
          Upload a puzzle collection.
        </h1>

        <p className="mt-5 text-zinc-400">
          Creator access is active. The protected upload workflow is unlocked; connect the final storage uploader here before public launch.
        </p>

        <div className="mt-8 grid gap-4">
          <input
            placeholder="Puzzle title"
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />
          <input
            placeholder="Missing piece price"
            type="number"
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />
          <button className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black">
            Save Draft
          </button>
        </div>
      </section>
    </main>
  );
}