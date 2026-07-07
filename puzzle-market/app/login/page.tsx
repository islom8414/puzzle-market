"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/password-input";
import {
  cacheUsername,
  fetchMyProfile,
} from "@/lib/client-profile";
import { getAuthRedirectUrl } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";
import {
  hasAcceptedCurrentTerms,
  termsAcceptPath,
} from "@/lib/terms-status";
import { trackLogin } from "@/lib/analytics";

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

        trackLogin("email");

        if (
          !hasAcceptedCurrentTerms(
            data.user.user_metadata as Record<
              string,
              unknown
            >
          )
        ) {
          window.location.assign(
            termsAcceptPath(nextPath)
          );
          return;
        }

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
      trackLogin("google");

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
      className="flex min-h-dvh items-center justify-center overflow-y-auto bg-black px-4 py-6 text-white sm:py-10"
    >

      {/* BG */}

      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-5 pb-6 backdrop-blur-xl sm:p-8">

        <div className="flex justify-center">

          <img
            src="/puzzle-market-cube-logo.png"
            alt="Puzzle Market"
            className="h-20 w-20 rounded-3xl object-cover shadow-[0_0_40px_rgba(34,211,238,0.35)] sm:h-28 sm:w-28"
          />

        </div>

        <h1 className="mt-5 text-center text-4xl font-black sm:mt-6 sm:text-5xl">
          Welcome Back
        </h1>

        <p className="mt-2 text-center text-zinc-500 sm:mt-3">
          Login to Puzzle Market
        </p>

        <div className="mt-6 sm:mt-8">

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) =>
                setEmail(e.target.value)
              }
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400"
            />

            <PasswordInput
              value={password}
              onChange={setPassword}
            />

          </div>

          <div className="mt-4 flex justify-end">
            <a
              href="/forgot-password"
              className="text-sm font-bold text-cyan-400 transition hover:text-cyan-300"
            >
              Forgot password?
            </a>
          </div>

          <div className="mt-6 space-y-4">

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="min-h-12 w-full rounded-2xl bg-cyan-400 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >

              {loading
                ? "Signing In..."
                : "Sign In"}

            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="min-h-12 w-full rounded-2xl bg-white py-4 font-black text-black transition hover:bg-zinc-200"
            >
              Continue with Google
            </button>

          </div>

        </div>

        {message && (

          <div className="mt-5 text-center text-sm text-red-400">
            {message}
          </div>

        )}

        <p className="mb-1 mt-8 text-center text-zinc-500">

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
