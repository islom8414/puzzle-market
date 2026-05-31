"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/password-input";
import {
  cacheUsername,
  saveMyUsername,
} from "@/lib/client-profile";
import { sanitizeUsername } from "@/lib/display-name";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleRegister =
    async () => {

      const cleanUsername =
        sanitizeUsername(username);

      if (
        !email ||
        !password ||
        cleanUsername.length < 3
      ) {
        setMessage(
          "Fill email, password, and username (3+ characters)"
        );

        return;
      }

      setLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              `${window.location.origin}/setup`,
          },
        });

      if (error) {

        setMessage(
          error.message
        );

      } else {

        if (data.session && data.user) {
          localStorage.setItem(
            "puzzle-user",
            data.user.email || ""
          );

          const saved =
            await saveMyUsername(
              cleanUsername
            );

          if (!saved.ok) {
            setMessage(
              saved.error ||
              "Account created, but username was not saved. Finish setup after login."
            );
            setTimeout(() => {
              window.location.href =
                "/setup";
            }, 1500);
            setLoading(false);
            return;
          }

          cacheUsername(
            saved.username
          );

          setMessage(
            "Account created successfully"
          );

          setTimeout(() => {
            window.location.href =
              "/profile";
          }, 1200);
        } else {
          setMessage(
            "Check your email to confirm your account"
          );
        }

      }

      setLoading(false);

    };

  const handleGoogleRegister =
    async () => {

      await supabase.auth
        .signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              `${window.location.origin}/auth/callback`,
          },
        });

    };

  return (

    <main className="min-h-screen flex items-center justify-center px-4 bg-black text-white overflow-hidden">

      {/* BG */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)] pointer-events-none" />

      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">

        <div className="flex justify-center">

          <div className="w-20 h-20 rounded-full bg-cyan-400 flex items-center justify-center text-black text-4xl font-black shadow-[0_0_40px_rgba(34,211,238,0.35)]">
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
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            placeholder="Username"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
          />

          <PasswordInput
            value={password}
            onChange={setPassword}
          />

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition"
          >

            {loading
              ? "Creating..."
              : "Create Account"}

          </button>

          <button
            onClick={handleGoogleRegister}
            className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-2xl transition"
          >
            Continue with Google
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
