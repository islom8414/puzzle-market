"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "islommatchanov888@gmail.com";
const ROWS = 4;
const COLUMNS = 4;
const PIECES = ROWS * COLUMNS;

function makeSlug(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") +
    "-" +
    Date.now()
  );
}

export default function CreatePage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [message, setMessage] = useState("");

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

  async function savePuzzle() {
    setMessage("");

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
      const slug = makeSlug(title);
      const fileExt = image.name.split(".").pop() || "png";
      const filePath = `puzzles/${slug}.${fileExt}`;

      const upload = await supabase.storage
        .from("fragments")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (upload.error) {
        throw upload.error;
      }

      const { data: publicUrlData } = supabase.storage
        .from("fragments")
        .getPublicUrl(filePath);

      const imageUrl = publicUrlData.publicUrl;

      const { data: puzzle, error: puzzleError } =
        await supabase
          .from("puzzle_catalog")
          .insert({
            slug,
            title: title.trim(),
            image_url: imageUrl,
            rows: ROWS,
            columns: COLUMNS,
            missing_piece_count: PIECES,
          })
          .select("id")
          .single();

      if (puzzleError) {
        throw puzzleError;
      }

      const pieces = Array.from({ length: PIECES }).map(
        (_, index) => ({
          puzzle_id: puzzle.id,
          piece_index: index,
          shape_seed: Math.floor(Math.random() * 1000000),
          is_market_piece: true,
        })
      );

      const { error: piecesError } = await supabase
        .from("puzzle_pieces")
        .insert(pieces);

      if (piecesError) {
        throw piecesError;
      }

      setTitle("");
      setPrice("");
      setImage(null);
      setMessage("Puzzle uploaded successfully.");
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
            </div>
          )}
        </div>
      </section>
    </main>
  );
}