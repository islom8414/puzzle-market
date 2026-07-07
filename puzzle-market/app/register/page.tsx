"use client";

import { useEffect, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import {
  cacheUsername,
  saveMyUsername,
} from "@/lib/client-profile";
import { sanitizeUsername } from "@/lib/display-name";
import { getAuthRedirectUrl } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";
import { termsAcceptPath } from "@/lib/terms-status";
import { trackSignUp } from "@/lib/analytics";

const confirmationRedirect =
  getAuthRedirectUrl(
    "/auth/callback?next=/login?confirmed=1"
  );

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

  const [confirmationPending, setConfirmationPending] =
    useState(false);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );
    const ref = params
      .get("ref")
      ?.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 32);

    if (ref) {
      localStorage.setItem(
        "puzzle-referral-code",
        ref
      );
    }

    const gift = params
      .get("gift")
      ?.trim()
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 96);

    if (gift) {
      localStorage.setItem(
        "puzzle-gift-token",
        gift
      );
    }
  }, []);

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
      setConfirmationPending(false);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              confirmationRedirect,
            data: {
              username:
                cleanUsername,
              referral_code:
                localStorage.getItem(
                  "puzzle-referral-code"
                ) || "",
              gift_token:
                localStorage.getItem(
                  "puzzle-gift-token"
                ) || "",
            },
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

          trackSignUp("email");

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
              termsAcceptPath(
                "/profile"
              );
          }, 1200);
        } else {
          localStorage.setItem(
            "puzzle-pending-username",
            cleanUsername
          );
          trackSignUp("email_pending_confirmation");
          setMessage(
            "Check your email to confirm your account. After confirmation, sign in with this email."
          );
          setConfirmationPending(true);
        }

      }

      setLoading(false);

    };

  const handleResendConfirmation =
    async () => {

      if (!email) {
        setMessage(
          "Enter your email first"
        );
        return;
      }

      setLoading(true);

      const { error } =
        await supabase.auth.resend({
          type: "signup",
          email,
          options: {
            emailRedirectTo:
              confirmationRedirect,
          },
        });

      setLoading(false);

      if (error) {
        setMessage(
          error.message
        );
        return;
      }

      setMessage(
        "Confirmation email sent again. Check inbox and spam."
      );
      setConfirmationPending(true);

    };

  const handleGoogleRegister =
    async () => {
      trackSignUp("google");

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
          Create Account
        </h1>

        <p className="mt-2 text-center text-zinc-500 sm:mt-3">
          Join Puzzle Market
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

            <input
              value={username}
              autoComplete="username"
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="Username"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400"
            />

            <PasswordInput
              value={password}
              onChange={setPassword}
            />

          </div>

          <div className="mt-6 space-y-4">

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="min-h-12 w-full rounded-2xl bg-cyan-400 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >

              {loading
                ? "Creating..."
                : "Create Account"}

            </button>

            <button
              type="button"
              onClick={handleGoogleRegister}
              className="min-h-12 w-full rounded-2xl bg-white py-4 font-black text-black transition hover:bg-zinc-200"
            >
              Continue with Google
            </button>

            {confirmationPending && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={loading}
                className="min-h-12 w-full rounded-2xl border border-cyan-400/40 py-4 font-black text-cyan-300 transition hover:bg-cyan-400/10 disabled:opacity-50"
              >
                Resend confirmation email
              </button>
            )}

          </div>

        </div>

        {message && (

          <div className="mt-5 text-center text-sm text-cyan-400">
            {message}
          </div>

        )}

        <p className="mb-1 mt-8 text-center text-zinc-500">

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
