"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";

export default function CreatePage() {

  const [title, setTitle] =
    useState("");

  const [rarity, setRarity] =
    useState("Rare");

  const [price, setPrice] =
    useState("");

  const [preview, setPreview] =
    useState("");

  const [file, setFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const handleImage = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const selected =
      e.target.files?.[0];

    if (!selected) return;

    setFile(selected);

    setPreview(
      URL.createObjectURL(selected)
    );

  };

  const handlePublish = async () => {

    const user =
      localStorage.getItem(
        "puzzle-user"
      );

    if (!user) {

      alert("Login required");

      window.location.href =
        "/login";

      return;

    }

    if (
      !title ||
      !price ||
      !file
    ) {

      alert(
        "Fill all fields"
      );

      return;

    }

    setLoading(true);

    const fileName =
      `${Date.now()}-${file.name}`;

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from("fragments")
        .upload(
          fileName,
          file,
          {
            upsert: true,
          }
        );

    if (uploadError) {

      console.log(uploadError);

      alert(
        "Image upload failed"
      );

      setLoading(false);

      return;

    }

    const { data } =
      supabase.storage
        .from("fragments")
        .getPublicUrl(
          fileName
        );

    const imageUrl =
      data.publicUrl;

    const fragmentId =
      crypto.randomUUID();

    const marketplaceItem = {

      seller_email: user,

      fragment_id:
        fragmentId,

      title,

      image: imageUrl,

      piece: Math.floor(
        Math.random() * 9999
      ),

      price: Number(price),

      rarity,

    };

    const { data: insertedData, error } =
  await supabase
    .from("marketplace")
    .insert([
      marketplaceItem
    ])
    .select();

console.log(
  "INSERTED DATA:",
  insertedData
);

console.log(
  "INSERT ERROR:",
  error
);

    if (error) {

      console.log(error);

      alert(
        "Publish failed"
      );

      setLoading(false);

      return;

    }

    alert(
      "Fragment published successfully"
    );

    setLoading(false);

    window.location.href =
      "/marketplace";

  };

  return (

    <main className="min-h-screen px-4 md:px-6 py-10 text-white">

      <div className="max-w-4xl mx-auto">

        <div className="mb-10">

          <p className="text-cyan-400 font-black uppercase tracking-wider text-sm">
            Creator Studio
          </p>

          <h1 className="text-5xl md:text-7xl font-black mt-4 leading-tight">
            Create New
            <br />
            Fragment
          </h1>

          <p className="text-zinc-500 mt-4 max-w-2xl">
            Upload your own collectible fragment directly into the live cloud marketplace.
          </p>

        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6">

            <h2 className="text-3xl font-black mb-6">
              Fragment Details
            </h2>

            <div className="space-y-5">

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="Fragment title..."
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400 transition"
              />

              <input
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(
                    e.target.value
                  )
                }
                placeholder="Set price..."
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400 transition"
              />

              <select
                value={rarity}
                onChange={(e) =>
                  setRarity(
                    e.target.value
                  )
                }
                className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400 transition"
              >

                <option value="Rare">
                  Rare
                </option>

                <option value="Epic">
                  Epic
                </option>

                <option value="Legendary">
                  Legendary
                </option>

              </select>

              <label className="block w-full border border-dashed border-white/10 rounded-3xl p-8 text-center cursor-pointer hover:border-cyan-400 transition">

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />

                <p className="text-2xl font-black">
                  Upload Image
                </p>

                <p className="text-zinc-500 mt-2">
                  PNG, JPG or WEBP
                </p>

              </label>

              <button
                onClick={handlePublish}
                disabled={loading}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
              >

                {loading
                  ? "Publishing..."
                  : "Publish Fragment"}

              </button>

            </div>

          </div>

          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 flex items-center justify-center overflow-hidden min-h-[500px]">

            {preview ? (

              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-2xl"
              />

            ) : (

              <div className="text-center">

                <h2 className="text-3xl font-black">
                  Live Preview
                </h2>

                <p className="text-zinc-500 mt-3">
                  Uploaded fragment preview appears here.
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </main>

  );
}