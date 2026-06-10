"use client";

import { useState } from "react";

import { getAuthRedirectUrl } from "@/lib/site-url";
import { supabase } from "@/lib/supabase";

const recoveryRedirect = getAuthRedirectUrl(
  "/auth/callback?next=/reset-password"
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  async function sendRecoveryEmail() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: recoveryRedirect,
        }
      );

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSent(true);
    setMessage(
      "Password reset email sent. Check your inbox and spam folder."
    );
  }

  return (
    <main
      className="notranslate min-h-screen bg-black px-4 text-white flex items-center justify-center"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
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
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
          >
            {loading
              ? "Sending..."
              : sent
                ? "Send Again"
                : "Send Reset Link"}
          </button>
        </div>

        {message && (
          <p
            className={`mt-5 text-center text-sm ${
              sent ? "text-cyan-300" : "text-red-400"
            }`}
          >
            {message}
          </p>
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
