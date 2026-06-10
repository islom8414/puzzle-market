"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/password-input";
import {
  cacheUsername,
  fetchMyProfile,
} from "@/lib/client-profile";
import { getAuthRedirectUrl } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const handleLogin =
    async () => {

      setLoading(true);
      setMessage("");

      try {
        const requestedNext =
          new URLSearchParams(
            window.location.search
          ).get("next");
        const nextPath =
          requestedNext?.startsWith("/") &&
          !requestedNext.startsWith("//")
            ? requestedNext
            : "/marketplace";

        const { data, error } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (error) {
          setMessage(error.message);
          return;
        }

        localStorage.setItem(
          "puzzle-user",
          data.user.email || ""
        );

        const profile =
          await Promise.race([
            fetchMyProfile(),
            new Promise<null>((resolve) => {
              window.setTimeout(
                () => resolve(null),
                5000
              );
            }),
          ]);

        if (
          profile?.profileComplete &&
          profile.username
        ) {
          cacheUsername(
            profile.username
          );

          window.location.assign(
            nextPath
          );
          return;
        }

        const metadataUsername =
          typeof data.user.user_metadata
            ?.username === "string"
            ? data.user.user_metadata.username
            : "";

        if (!metadataUsername) {
          localStorage.setItem(
            "puzzle-next-path",
            nextPath
          );
        }

        window.location.assign(
          metadataUsername
            ? nextPath
            : "/setup"
        );
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Login failed. Please try again."
        );
      } finally {
        setLoading(false);
      }

    };

  const handleGoogleLogin =
    async () => {

      await supabase.auth
        .signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              getAuthRedirectUrl(),
          },
        });

    };

  return (

    <main
      className="notranslate min-h-screen flex items-center justify-center px-4 bg-black text-white overflow-hidden"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
    >

      {/* BG */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)] pointer-events-none" />

      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">

        <div className="flex justify-center">

          <div className="w-20 h-20 rounded-full bg-cyan-400 flex items-center justify-center text-black text-4xl font-black shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            P
          </div>

        </div>

        <h1 className="text-5xl font-black text-center mt-6">
          Welcome Back
        </h1>

        <p className="text-zinc-500 text-center mt-3">
          Login to Puzzle Market
        </p>

        <div className="mt-8 space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            autoComplete="email"
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-cyan-400"
          />

          <PasswordInput
            value={password}
            onChange={setPassword}
          />

          <div className="flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition"
          >

            {loading
              ? "Signing In..."
              : "Sign In"}

          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-2xl transition"
          >
            Continue with Google
          </button>

        </div>

        {message && (

          <div className="mt-5 text-center text-sm text-red-400">
            {message}
          </div>

        )}

        <p className="text-center text-zinc-500 mt-6">

          No account?{" "}

          <a
            href="/register"
            className="text-cyan-400 font-bold"
          >
            Create Account
          </a>

        </p>

      </div>

    </main>
  );
}
