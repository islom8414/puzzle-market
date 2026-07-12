"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { trackBeginCheckout } from "@/lib/analytics";

type PlanTier = "starter" | "premium" | "creator";

const plans: Array<{
  tier: PlanTier;
  name: string;
  price: string;
  badge: string;
  description: string;
  bonus: string;
  features: string[];
}> = [
  {
    tier: "starter",
    name: "Starter",
    price: "$1/mo",
    badge: "3-DAY FREE TRIAL",
    description:
      "Start collecting, buy missing pieces, and keep a private collector profile.",
    bonus:
      "$5 puzzle credit after the first successful billing",
    features: [
      "Card required, no subscription charge today",
      "Verified collector profile",
      "Buy and own missing pieces",
      "Resell pieces you own",
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    price: "$10/mo",
    badge: "3-DAY FREE TRIAL",
    description:
      "Get stronger marketplace visibility when you list pieces for resale.",
    bonus:
      "$20 puzzle credit after the first successful billing",
    features: [
      "Card required, no subscription charge today",
      "Everything in Starter",
      "Boosted resale listings",
      "Premium marketplace badge",
    ],
  },
  {
    tier: "creator",
    name: "Creator",
    price: "$100/mo",
    badge: "3-DAY FREE TRIAL",
    description:
      "Unlock creator tools for adding your own puzzle collections and prices.",
    bonus:
      "$100 puzzle credit after the first successful billing",
    features: [
      "Card required, no subscription charge today",
      "Everything in Premium",
      "Create official puzzle boards",
      "Set missing piece prices",
    ],
  },
];

const planValues: Record<PlanTier, number> = {
  starter: 1,
  premium: 10,
  creator: 100,
};

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

      const response = await apiFetch("/api/create-subscription-session", {
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

      const plan =
        plans.find((item) => item.tier === tier);
      const value =
        planValues[tier];

      trackBeginCheckout({
        value,
        items: [
          {
            item_id: `subscription_${tier}`,
            item_name:
              plan?.name ||
              `${tier} subscription`,
            item_category: "subscription",
            price: value,
            quantity: 1,
          },
        ],
      });

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
    <main className="subscribe-page min-h-screen bg-black text-white px-4 md:px-6 py-8 md:py-10">
      <section className="mx-auto max-w-6xl">
        <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.18em] md:tracking-[0.35em]">
          Collector Plans
        </p>

        <h1 className="mt-4 text-5xl sm:text-6xl md:text-7xl font-black leading-none">
          Choose your access.
        </h1>

        <p className="mt-5 max-w-2xl text-zinc-400 text-base md:text-lg leading-relaxed">
          Start with a 3-day free trial. Add a card now, pay nothing for the subscription today, and cancel before the trial ends if Puzzle Market is not for you.
        </p>

        <div className="mt-8 md:mt-10 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.tier}
              className="rounded-[24px] md:rounded-[28px] border border-cyan-400/20 bg-white/[0.03] p-5 md:p-6"
            >
              <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.16em] md:tracking-[0.25em]">
                {plan.badge}
              </p>

              <h2 className="mt-4 text-3xl md:text-4xl font-black">
                {plan.name}
              </h2>

              <div className="plan-price mt-3 text-4xl md:text-5xl font-black text-cyan-400">
                {plan.price}
              </div>

              <p className="mt-4 text-zinc-400 md:min-h-[76px] leading-relaxed">
                {plan.description}
              </p>

              <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-100">
                {plan.bonus}
              </div>

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
                  : `Start ${plan.name} Trial`}
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
