"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

export default function LanguageAuthPage() {
  const [message, setMessage] = useState(
    "Restoring your account..."
  );

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const hash = new URLSearchParams(
          window.location.hash.slice(1)
        );
        const token = hash.get("token");

        if (!token) {
          throw new Error(
            "Language session is missing"
          );
        }

        window.history.replaceState(
          null,
          "",
          "/auth/language"
        );

        const response = await apiFetch(
          "/api/auth/language-bridge",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Language session expired"
          );
        }

        const data = (await response.json()) as {
          accessToken: string;
          refreshToken: string;
          nextPath: string;
        };
        const { error } =
          await supabase.auth.setSession({
            access_token:
              data.accessToken,
            refresh_token:
              data.refreshToken,
          });

        if (error) {
          throw error;
        }

        window.location.replace(
          data.nextPath
        );
      } catch {
        if (active) {
          setMessage(
            "Please sign in again to continue."
          );
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main
      className="notranslate flex min-h-screen items-center justify-center bg-black px-4 text-white"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
    >
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-8 text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-cyan-400" />
        <h1 className="mt-6 text-3xl font-black">
          Switching language
        </h1>
        <p className="mt-3 text-zinc-400">
          {message}
        </p>
        {message.startsWith("Please") && (
          <a
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-cyan-400 px-6 py-3 font-black text-black"
          >
            Sign in
          </a>
        )}
      </section>
    </main>
  );
}
