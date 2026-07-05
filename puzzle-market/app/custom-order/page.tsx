"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api-client";
import {
  BRAND_COUNTRIES,
  PUZZLE_CATEGORIES,
} from "@/lib/brand-metadata";
import { hasCustomPuzzleOrderAccess } from "@/lib/market-access";
import {
  RARITY_OPTIONS,
  type PuzzleRarity,
  validateRarityPrice,
} from "@/lib/rarity";
import { supabase } from "@/lib/supabase";

function CustomOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderStatus = searchParams.get("order");

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [branded, setBranded] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandCountry, setBrandCountry] = useState("GLOBAL");
  const [customCountry, setCustomCountry] = useState("");
  const [category, setCategory] = useState("Other");
  const [rarity, setRarity] = useState<PuzzleRarity>("Rare");
  const [piecePrice, setPiecePrice] = useState("5");
  const [marketPieceCount, setMarketPieceCount] = useState(1);
  const [image, setImage] = useState<File | null>(null);

  const selectedTier = useMemo(
    () => RARITY_OPTIONS.find((item) => item.value === rarity),
    [rarity]
  );

  useEffect(() => {
    async function checkAccess() {
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

      setAllowed(hasCustomPuzzleOrderAccess(session.user, data));
      setLoading(false);
    }

    checkAccess();
  }, []);

  async function startOrder() {
    setMessage("");

    if (!title.trim()) {
      setMessage("Enter puzzle title.");
      return;
    }

    if (!description.trim() && !image) {
      setMessage("Upload an image/logo or describe how the puzzle should look.");
      return;
    }

    if (branded && !brandName.trim()) {
      setMessage("Enter the brand or logo name.");
      return;
    }

    const priceError = validateRarityPrice(rarity, Number(piecePrice));

    if (priceError) {
      setMessage(priceError);
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("branded", String(branded));
      formData.append("brandName", branded ? brandName.trim() : "");
      formData.append(
        "brandCountry",
        brandCountry === "OTHER" ? customCountry : brandCountry
      );
      formData.append("category", category);
      formData.append("rarity", rarity);
      formData.append("piecePrice", piecePrice.trim());
      formData.append("marketPieceCount", String(marketPieceCount));

      if (image) {
        formData.append("image", image);
      }

      const response = await apiFetch("/api/create-custom-puzzle-order-session", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Order checkout failed");
      }

      window.location.assign(payload.url);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Order checkout failed"
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading order access...
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <section className="mx-auto max-w-2xl rounded-[28px] border border-cyan-400/20 bg-white/[0.03] p-6 text-center md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
            Custom Puzzle Order
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Active plan required.
          </h1>

          <p className="mt-5 text-zinc-400">
            Starter, Premium, and Creator members can order one custom puzzle setup for $50.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/subscribe"
              className="rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black"
            >
              Choose Plan
            </Link>
            <Link
              href="/profile"
              className="rounded-2xl border border-white/10 px-5 py-4 font-black"
            >
              Back To Profile
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-6 md:py-10">
      <section className="mx-auto max-w-4xl rounded-[28px] border border-cyan-400/20 bg-white/[0.03] p-5 md:rounded-[36px] md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 md:tracking-[0.3em]">
          Custom Puzzle Order
        </p>

        <h1 className="mt-4 text-4xl font-black leading-none md:text-6xl">
          Order your own puzzle.
        </h1>

        <p className="mt-5 max-w-2xl text-zinc-400">
          Send your logo, image, or idea. After the $50 setup payment, Puzzle Market reviews it and creates the puzzle board for you.
        </p>

        {orderStatus === "success" && (
          <div className="mt-6 rounded-2xl border border-green-400/20 bg-green-400/10 px-5 py-4 font-bold text-green-200">
            Payment received. Your custom puzzle order is waiting for admin review.
          </div>
        )}

        {orderStatus === "cancelled" && (
          <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-4 font-bold text-yellow-100">
            Checkout was cancelled. Your order was not paid yet.
          </div>
        )}

        <div className="mt-8 grid gap-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Puzzle title"
            maxLength={120}
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe how your puzzle should look..."
            rows={5}
            maxLength={2000}
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
              Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBranded(false)}
                className={`rounded-2xl border px-4 py-4 font-black ${
                  !branded
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-black text-zinc-400"
                }`}
              >
                Regular
              </button>
              <button
                type="button"
                onClick={() => setBranded(true)}
                className={`rounded-2xl border px-4 py-4 font-black ${
                  branded
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-black text-zinc-400"
                }`}
              >
                Brand / Logo
              </button>
            </div>
          </div>

          {branded && (
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
                placeholder="Brand or logo name"
                maxLength={80}
                className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
              />
              <div className="grid gap-2">
                <select
                  value={brandCountry}
                  onChange={(event) => setBrandCountry(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
                >
                  {BRAND_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.label}
                    </option>
                  ))}
                </select>
                {brandCountry === "OTHER" && (
                  <input
                    value={customCountry}
                    onChange={(event) =>
                      setCustomCountry(
                        event.target.value
                          .toUpperCase()
                          .replace(/[^A-Z]/g, "")
                          .slice(0, 2)
                      )
                    }
                    placeholder="Two-letter country code"
                    maxLength={2}
                    className="rounded-2xl border border-white/10 bg-black px-5 py-4 uppercase text-white"
                  />
                )}
              </div>
            </div>
          )}

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
              Category
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
            >
              {PUZZLE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                Rarity
              </p>
              <div className="grid grid-cols-3 gap-2">
                {RARITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRarity(option.value);
                      setPiecePrice(
                        option.value === "Rare"
                          ? "5"
                          : option.value === "Epic"
                            ? "25"
                            : "150"
                      );
                    }}
                    className={`rounded-2xl border px-2 py-4 text-sm font-black ${
                      rarity === option.value
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-black text-zinc-400"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
                Pieces to sell
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setMarketPieceCount(count)}
                    className={`rounded-2xl border px-2 py-4 text-sm font-black ${
                      marketPieceCount === count
                        ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                        : "border-white/10 bg-black text-zinc-400"
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-400">
              Price per missing piece
            </span>
            <input
              value={piecePrice}
              onChange={(event) => setPiecePrice(event.target.value)}
              type="number"
              min={selectedTier?.minPrice}
              max={selectedTier?.maxPrice ?? undefined}
              step="0.01"
              className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
            />
            <span className="text-sm text-zinc-500">
              Allowed for {rarity}: {selectedTier?.hint}
            </span>
          </label>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4">
            <div className="text-3xl font-black text-cyan-300">$50</div>
            <p className="mt-2 text-sm text-zinc-300">
              One custom puzzle setup request. Final puzzle is reviewed before publishing.
            </p>
          </div>

          <button
            onClick={startOrder}
            disabled={submitting}
            className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black disabled:opacity-60"
          >
            {submitting ? "Opening Stripe..." : "Pay $50 And Order Puzzle"}
          </button>

          {message && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold">
              {message}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function CustomOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading order form...
        </main>
      }
    >
      <CustomOrderForm />
    </Suspense>
  );
}
