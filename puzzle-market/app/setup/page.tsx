"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

export default function SetupPage() {

  const [nickname, setNickname] =
    useState("");

  const router =
    useRouter();

  const saveProfile =
    () => {

      if (
        nickname.trim().length < 3
      ) {

        alert(
          "Nickname too short"
        );

        return;

      }

      localStorage.setItem(
        "puzzle-username",
        nickname
      );

      router.push(
        "/profile"
      );

    };

  return (

    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">

      <div className="w-full max-w-xl bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-12">

        <p className="text-cyan-400 uppercase tracking-[0.3em] text-xs font-black">
          PROFILE SETUP
        </p>

        <h1 className="text-5xl md:text-6xl font-black mt-5 leading-none">
          Choose
          <br />
          Nickname
        </h1>

        <p className="text-zinc-500 mt-6 text-lg">
          Your nickname will appear in chat, marketplace and profile instead of email.
        </p>

        <input
          value={nickname}
          onChange={(e) =>
            setNickname(
              e.target.value
            )
          }
          placeholder="ShadowUser"
          className="w-full mt-10 bg-black/40 border border-white/10 rounded-3xl px-6 py-5 text-lg outline-none focus:border-cyan-400"
        />

        <button
          onClick={saveProfile}
          className="w-full mt-8 bg-cyan-400 hover:bg-cyan-300 text-black font-black py-5 rounded-3xl transition text-lg"
        >
          Save Nickname
        </button>

      </div>

    </main>

  );
}