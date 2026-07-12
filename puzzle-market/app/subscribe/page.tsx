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

const trialTrustPoints = [
  "Card required to start the trial",
  "No subscription charge today",
  "Cancel before day 3",
  "Stripe-secured checkout",
] as const;

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
    <main
      className="subscribe-page min-h-screen bg-black px-4 py-6 text-white sm:px-6 md:py-8 notranslate"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
    >
      <section className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
            Collector Plans
          </p>

          <h1 className="mt-3 text-4xl font-black leading-[0.98] sm:text-5xl md:text-6xl">
            Start collecting with 3 days free.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
            Add a card to unlock buying, ownership and resale tools today. The
            subscription is not charged during the trial, and you can cancel
            before the trial ends.
          </p>
        </div>

        <div className="mt-5 grid gap-3 text-sm font-bold text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
          {trialTrustPoints.map((point) => (
            <div
              key={point}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
            >
              {point}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-3 text-sm font-bold text-cyan-100">
          Bonus puzzle credit is added after the first successful subscription
          billing, not during the free trial.
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.tier}
              className="flex min-h-[420px] flex-col rounded-3xl border border-cyan-400/20 bg-white/[0.035] p-5 shadow-[0_0_50px_rgba(34,211,238,0.08)] md:p-6"
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-400">
                {plan.badge}
              </p>

              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                {plan.name}
              </h2>

              <div className="plan-price mt-2 text-4xl font-black text-cyan-400 md:text-5xl">
                {plan.price}
              </div>

              <p className="mt-4 min-h-[76px] text-sm leading-relaxed text-zinc-300 md:text-base">
                {plan.description}
              </p>

              <div className="mt-4 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-100">
                {plan.bonus}
              </div>

              <div className="mt-5 flex-1 space-y-3 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex gap-2"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => startSubscription(plan.tier)}
                disabled={loadingTier !== null}
                className="mt-6 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {loadingTier === plan.tier
                  ? "Opening Stripe..."
                  : `Start ${plan.name} Trial`}
              </button>

              <p className="mt-3 text-center text-xs font-semibold text-zinc-500">
                Subscription billing starts only after the 3-day trial unless
                you cancel first.
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-sm leading-relaxed text-zinc-300 md:p-6">
          <p className="font-black text-white">
            What happens during the trial?
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              "You can browse collections, buy available pieces and keep ownership in your account.",
              "You can list owned pieces for resale while your plan is active or trialing.",
              "Bonus puzzle credit is added only after the first successful subscription billing.",
            ].map((item) => (
              <div key={item} className="text-zinc-400">
                {item}
              </div>
            ))}
          </div>
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
