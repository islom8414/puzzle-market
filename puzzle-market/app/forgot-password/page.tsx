"use client";

import {
  useEffect,
  useState,
} from "react";

import { getAuthRedirectUrl } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

const recoveryRedirect = getAuthRedirectUrl(
  "/reset-password"
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");
  const [cooldown, setCooldown] =
    useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(
      () =>
        setCooldown((value) =>
          Math.max(0, value - 1)
        ),
      1000
    );

    return () =>
      window.clearTimeout(timer);
  }, [cooldown]);

  async function sendRecoveryEmail() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage(
        "Enter your email address."
      );
      return;
    }

    if (cooldown > 0) {
      setErrorMessage(
        `Please wait ${cooldown}s before requesting another link.`
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: recoveryRedirect,
        }
      );

    setLoading(false);

    if (error) {
      setErrorMessage(
        "We could not send a reset link right now. Please wait a moment and try again."
      );
      setCooldown(30);
      return;
    }

    setSent(true);
    setCooldown(60);
    setMessage(
      "If an account exists for this email, a secure reset link will be sent. Check your inbox and spam folder."
    );
  }

  return (
    <main
      className="min-h-screen bg-black px-4 text-white flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)] pointer-events-none" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 backdrop-blur-xl sm:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-4xl font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)]">
          P
        </div>

        <h1 className="mt-6 text-center text-4xl font-black sm:text-5xl">
          Reset Password
        </h1>

        <p className="mt-3 text-center text-zinc-500">
          We will send a secure recovery link to your email.
        </p>
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center text-sm leading-relaxed text-zinc-400">
          For your security, this page never reveals whether an email is
          registered.
        </p>

        <div className="mt-8 grid gap-4">
          <input
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendRecoveryEmail();
              }
            }}
            placeholder="Email"
            className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={sendRecoveryEmail}
            disabled={loading || cooldown > 0}
            className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading
              ? "Sending..."
              : cooldown > 0
                ? `Try again in ${cooldown}s`
              : sent
                ? "Send Again"
                : "Send Reset Link"}
          </button>
        </div>

        {message && (
          <p
            className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] p-4 text-center text-sm leading-relaxed text-cyan-200"
          >
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.07] p-4 text-center text-sm leading-relaxed text-red-200">
            {errorMessage}
          </p>
        )}

        {sent && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-zinc-400">
            <p>
              The email can take a few minutes. Check spam, promotions and any
              filtered folders.
            </p>
            <a
              href="/support"
              className="mt-3 inline-flex font-black text-cyan-300"
            >
              Contact support
            </a>
          </div>
        )}

        <a
          href="/login"
          className="mt-6 block text-center font-bold text-cyan-400"
        >
          Back to login
        </a>
      </section>
    </main>
  );
}
