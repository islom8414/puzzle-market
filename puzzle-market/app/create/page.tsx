"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import {
  BRAND_COUNTRIES,
  PUZZLE_CATEGORIES,
} from "@/lib/brand-metadata";
import { hasCreatorUploadAccess } from "@/lib/market-access";
import {
  RARITY_OPTIONS,
  type PuzzleRarity,
  validateRarityPrice,
} from "@/lib/rarity";
import { supabase } from "@/lib/supabase";

export default function CreatePage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [branded, setBranded] = useState(true);
  const [brandName, setBrandName] = useState("");
  const [brandCountry, setBrandCountry] = useState("UZ");
  const [customCountry, setCustomCountry] = useState("");
  const [category, setCategory] = useState("Football");
  const [rarity, setRarity] =
    useState<PuzzleRarity>("Rare");
  const [price, setPrice] = useState("5");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploadedSlug, setUploadedSlug] =
    useState("");

  const selectedTier = useMemo(
    () =>
      RARITY_OPTIONS.find(
        (item) => item.value === rarity
      ),
    [rarity]
  );

  useEffect(() => {
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

      setAllowed(
        hasCreatorUploadAccess(
          session.user,
          data
        )
      );

      setLoading(false);
    }

    checkCreatorAccess();
  }, []);

  async function savePuzzle() {
    setMessage("");
    setUploadedSlug("");

    if (!title.trim()) {
      setMessage("Enter puzzle title.");
      return;
    }

    if (!image) {
      setMessage("Choose puzzle image.");
      return;
    }

    if (branded && !brandName.trim()) {
      setMessage("Enter the brand shown in this puzzle.");
      return;
    }

    const priceError = validateRarityPrice(
      rarity,
      Number(price)
    );

    if (priceError) {
      setMessage(priceError);
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessage("Login required.");
        return;
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("branded", String(branded));
      formData.append(
        "brandName",
        branded ? brandName.trim() : ""
      );
      formData.append(
        "brandCountry",
        brandCountry === "OTHER"
          ? customCountry
          : brandCountry
      );
      formData.append("category", category);
      formData.append("image", image);
      formData.append("rarity", rarity);
      formData.append("price", price.trim());

      const response = await apiFetch(
        "/api/create-puzzle",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const rawBody = await response.text();
      let payload: {
        error?: string;
        puzzle?: { slug?: string };
      } | null = null;

      if (rawBody) {
        try {
          payload = JSON.parse(
            rawBody
          ) as {
            error?: string;
            puzzle?: { slug?: string };
          };
        } catch {
          payload = null;
        }
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Upload API missing on server. Push latest code and redeploy on Vercel."
          );
        }

        throw new Error(
          payload?.error ||
            `Upload failed (${response.status}).`
        );
      }

      const slug =
        payload?.puzzle?.slug || "";

      if (slug) {
        setUploadedSlug(slug);
      }

      setTitle("");
      setBranded(true);
      setBrandName("");
      setPrice(
        rarity === "Rare"
          ? "5"
          : rarity === "Epic"
            ? "25"
            : "150"
      );
      setImage(null);
      setMessage(
        slug
          ? "Puzzle published. Only ONE missing piece is listed for sale — collectors complete the board and buy that single fragment."
          : "Puzzle uploaded successfully."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload puzzle."
      );
    } finally {
      setSaving(false);
    }
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
            Only Creator members can upload new official puzzle boards.
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
          Publish a missing piece puzzle.
        </h1>

        <p className="mt-5 text-zinc-400">
          Upload a 4×4 board. Players assemble the puzzle — one piece stays
          missing. You sell only that single fragment; buyers can resell it
          later at their own price.
        </p>

        <div className="mt-8 grid gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Puzzle title"
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
              Puzzle type
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBranded(true)}
                className={`rounded-2xl border px-4 py-4 font-black transition ${
                  branded
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-black text-zinc-400"
                }`}
              >
                Branded
              </button>

              <button
                type="button"
                onClick={() => setBranded(false)}
                className={`rounded-2xl border px-4 py-4 font-black transition ${
                  !branded
                    ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                    : "border-white/10 bg-black text-zinc-400"
                }`}
              >
                Regular
              </button>
            </div>
          </div>

          <div className={`grid gap-4 ${branded ? "md:grid-cols-2" : ""}`}>
            {branded ? (
              <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                Brand
              </span>
              <input
                value={brandName}
                onChange={(event) =>
                  setBrandName(event.target.value)
                }
                placeholder="Nintendo, Nike, Artel..."
                maxLength={80}
                className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
              />
              </label>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-zinc-400">
                Regular puzzle - no brand will be attached.
              </div>
            )}

            {branded && (
              <label className="grid gap-2">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
                Brand country
              </span>
              <select
                value={brandCountry}
                onChange={(event) =>
                  setBrandCountry(event.target.value)
                }
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
                  placeholder="Two-letter code, for example BR"
                  maxLength={2}
                  className="rounded-2xl border border-white/10 bg-black px-5 py-4 uppercase text-white"
                />
              )}
              </label>
            )}
          </div>

          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
              Puzzle category
            </span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
            >
              {PUZZLE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-400">
              Rarity tier
            </p>
            <div className="grid grid-cols-3 gap-2">
              {RARITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setRarity(option.value);
                    setPrice(
                      option.value === "Rare"
                        ? "5"
                        : option.value === "Epic"
                          ? "25"
                          : "150"
                    );
                  }}
                  className={`rounded-2xl border px-3 py-4 text-sm font-black transition ${
                    rarity === option.value
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-300"
                      : "border-white/10 bg-black text-zinc-400"
                  }`}
                >
                  {option.label}
                  <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {option.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Missing piece price (USD)"
              type="number"
              min={selectedTier?.minPrice}
              max={selectedTier?.maxPrice ?? undefined}
              step="0.01"
              className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
            />
            <p className="mt-2 text-sm text-zinc-500">
              Allowed for {rarity}: {selectedTier?.hint}
            </p>
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(e.target.files?.[0] ?? null)
            }
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

          <button
            onClick={savePuzzle}
            disabled={saving}
            className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-black disabled:opacity-60"
          >
            {saving ? "Publishing..." : "Publish Missing Piece"}
          </button>

          {message && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 font-bold">
              {message}

              {uploadedSlug && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
                  <Link
                    href="/"
                    className="rounded-xl bg-cyan-400 px-4 py-2 text-black"
                  >
                    View Homepage
                  </Link>
                  <Link
                    href={`/puzzle/${uploadedSlug}`}
                    className="rounded-xl border border-white/15 px-4 py-2"
                  >
                    Open Puzzle
                  </Link>
                  <Link
                    href={`/marketplace?puzzle=${encodeURIComponent(uploadedSlug)}`}
                    className="rounded-xl border border-white/15 px-4 py-2"
                  >
                    Sell Missing Piece
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
