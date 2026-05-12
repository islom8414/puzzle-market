"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleRegister =
    async () => {

      if (!email || !password) {
        setMessage(
          "Fill all fields"
        );
        return;
      }

      setLoading(true);

      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {

        setMessage(
          error.message
        );

      } else {

        setMessage(
          "Account created successfully"
        );

        setTimeout(() => {

          window.location.href =
            "/login";

        }, 1500);

      }

      setLoading(false);

    };

  return (

    <main className="min-h-screen flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-8">

        <div className="flex justify-center">

          <div className="w-20 h-20 rounded-full bg-cyan-400 flex items-center justify-center text-black text-4xl font-black">
            P
          </div>

        </div>

        <h1 className="text-5xl font-black text-center mt-6">
          Create Account
        </h1>

        <p className="text-zinc-500 text-center mt-3">
          Join Puzzle Market
        </p>

        <div className="mt-8 space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-black py-4 rounded-2xl transition"
          >

            {loading
              ? "Creating..."
              : "Create Account"}

          </button>

        </div>

        {message && (

          <div className="mt-5 text-center text-sm text-cyan-400">
            {message}
          </div>

        )}

        <p className="text-center text-zinc-500 mt-6">

          Already have account?{" "}

          <a
            href="/login"
            className="text-cyan-400 font-bold"
          >
            Login
          </a>

        </p>

      </div>

    </main>
  );
}