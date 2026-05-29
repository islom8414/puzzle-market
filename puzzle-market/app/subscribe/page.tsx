"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";

type PlanTier = "starter" | "premium" | "creator";

const plans: Array<{
  tier: PlanTier;
  name: string;
  price: string;
  badge: string;
  description: string;
  features: string[];
}> = [
  {
    tier: "starter",
    name: "Starter",
    price: "$1/mo",
    badge: "PROFILE ACCESS",
    description: "Start collecting, buy missing pieces, and keep a private collector profile.",
    features: [
      "Verified collector profile",
      "Buy and own missing pieces",
      "Resell pieces you own",
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    price: "$10/mo",
    badge: "BOOSTED TRADER",
    description: "Get stronger marketplace visibility when you list pieces for resale.",
    features: [
      "Everything in Starter",
      "Boosted resale listings",
      "Premium marketplace badge",
    ],
  },
  {
    tier: "creator",
    name: "Creator",
    price: "$100/mo",
    badge: "PUZZLE CREATOR",
    description: "Unlock creator tools for adding your own puzzle collections and prices.",
    features: [
      "Everything in Premium",
      "Create official puzzle boards",
      "Set missing piece prices",
    ],
  },
];

export default function SubscribePage() {
  const router = useRouter();

  const [loadingTier, setLoadingTier] =
    useState<PlanTier | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function startSubscription(tier: PlanTier) {
    setLoadingTier(tier);
    setErrorMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/create-subscription-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const text =
        await response.text();

      const data =
        text
          ? JSON.parse(text)
          : {};

      if (!response.ok || !data.url) {
        throw new Error(
          data.error ||
            "Subscription checkout failed"
        );
      }

      window.location.assign(data.url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Subscription checkout failed";

      setErrorMessage(message);
      alert(message);
      setLoadingTier(null);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.35em]">
          Collector Plans
        </p>

        <h1 className="mt-4 text-5xl md:text-7xl font-black leading-none">
          Choose your access.
        </h1>

        <p className="mt-5 max-w-2xl text-zinc-400 text-lg">
          A plan unlocks your Puzzle Market profile. Upgrade any time when you want more visibility or creator tools.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.tier}
              className="rounded-[28px] border border-cyan-400/20 bg-white/[0.03] p-6"
            >
              <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.25em]">
                {plan.badge}
              </p>

              <h2 className="mt-4 text-4xl font-black">
                {plan.name}
              </h2>

              <div className="mt-3 text-5xl font-black text-cyan-400">
                {plan.price}
              </div>

              <p className="mt-4 text-zinc-400 min-h-[76px]">
                {plan.description}
              </p>

              <div className="mt-6 space-y-3 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <div key={feature}>
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={() => startSubscription(plan.tier)}
                disabled={loadingTier !== null}
                className="mt-8 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black disabled:opacity-60"
              >
                {loadingTier === plan.tier
                  ? "Opening Stripe..."
                  : `Choose ${plan.name}`}
              </button>
            </article>
          ))}
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 font-bold text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="mt-8">
          <Link href="/profile" className="text-zinc-400 hover:text-white">
            Back to profile
          </Link>
        </div>
      </section>
    </main>
  );
}
