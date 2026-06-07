"use client";

import { useEffect, useState } from "react";

import { PasswordInput } from "@/components/password-input";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setSessionReady(Boolean(session));

      if (!session) {
        setMessage(
          "This recovery link is invalid or expired. Request a new one."
        );
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function updatePassword() {
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    setSuccess(true);
    setMessage(
      "Password updated successfully. Redirecting to login..."
    );
    await supabase.auth.signOut();

    window.setTimeout(() => {
      window.location.assign("/login?password=updated");
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-black px-4 text-white flex items-center justify-center">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)] pointer-events-none" />

      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 backdrop-blur-xl sm:p-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-4xl font-black text-black shadow-[0_0_40px_rgba(34,211,238,0.35)]">
          P
        </div>

        <h1 className="mt-6 text-center text-4xl font-black sm:text-5xl">
          New Password
        </h1>

        <p className="mt-3 text-center text-zinc-500">
          Choose a new password for your Puzzle Market account.
        </p>

        {sessionReady && !success ? (
          <div className="mt-8 grid gap-4">
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="New password"
              autoComplete="new-password"
            />

            <PasswordInput
              value={confirmation}
              onChange={setConfirmation}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />

            <button
              type="button"
              onClick={updatePassword}
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </div>
        ) : !success ? (
          <a
            href="/forgot-password"
            className="mt-8 flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black"
          >
            Request New Link
          </a>
        ) : null}

        {message && (
          <p
            className={`mt-5 text-center text-sm ${
              success ? "text-cyan-300" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
