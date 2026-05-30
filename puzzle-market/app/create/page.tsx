"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { hasCreatorUploadAccess } from "@/lib/market-access";
import { supabase } from "@/lib/supabase";

export default function CreatePage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [uploadedSlug, setUploadedSlug] =
    useState("");

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

    setAllowed(
      hasCreatorUploadAccess(
        session.user.email,
        data
      )
    );

    setLoading(false);
  }

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
      formData.append("image", image);

      if (price.trim()) {
        formData.append("price", price.trim());
      }

      const response = await fetch(
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
          ) as { error?: string };
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

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          await fetch(
            "/api/backfill-puzzle-listings",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                price: Number(price) || 100,
              }),
            }
          );
        }
      }

      setTitle("");
      setPrice("");
      setImage(null);
      setMessage(
        slug
          ? "Puzzle uploaded successfully. It is now visible on the homepage and marketplace."
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
          Upload a puzzle collection.
        </h1>

        <p className="mt-5 text-zinc-400">
          This creates a 4x4 puzzle with 16 market pieces.
        </p>

        <div className="mt-8 grid gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Puzzle title"
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Missing piece price"
            type="number"
            className="rounded-2xl border border-white/10 bg-black px-5 py-4 text-white"
          />

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
            {saving ? "Uploading..." : "Upload Puzzle"}
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
                    Marketplace
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