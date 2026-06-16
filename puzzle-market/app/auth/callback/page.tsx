"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import {
  cacheUsername,
  fetchMyProfile,
} from "@/lib/client-profile";
import { supabase } from "@/lib/supabase";

async function savePendingTermsAcceptance(
  accessToken: string
) {
  if (
    localStorage.getItem(
      "puzzle-terms-consent-pending"
    ) !== "1"
  ) {
    return;
  }

  const response = await fetch(
    "/api/terms-acceptance",
    {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
    }
  );

  if (response.ok) {
    localStorage.removeItem(
      "puzzle-terms-consent-pending"
    );
  }
}

export default function AuthCallbackPage() {
  const router =
    useRouter();

  useEffect(() => {
    let active = true;
    const searchParams =
      new URLSearchParams(
        window.location.search
      );
    const next =
      searchParams.get("next");
    const safeNext =
      next?.startsWith("/") &&
      !next.startsWith("//")
        ? next
        : null;

    async function finishLogin() {
      const profile =
        await fetchMyProfile();

      if (!active) {
        return;
      }

      if (
        profile?.profileComplete &&
        profile.username
      ) {
        cacheUsername(
          profile.username
        );
        router.replace("/marketplace");
        return;
      }

      router.replace("/setup");
    }

    async function bootstrap() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (session) {
        await savePendingTermsAcceptance(
          session.access_token
        );

        if (safeNext) {
          router.replace(safeNext);
          return;
        }

        await finishLogin();
        return;
      }

      const code =
        searchParams.get("code");

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(
            code
          );

        if (!error) {
          const {
            data: {
              session:
                exchangedSession,
            },
          } =
            await supabase.auth.getSession();

          if (exchangedSession) {
            await savePendingTermsAcceptance(
              exchangedSession.access_token
            );
          }

          if (safeNext) {
            router.replace(safeNext);
            return;
          }

          await finishLogin();
          return;
        }
      }

      const {
        data: {
          subscription,
        },
      } =
        supabase.auth.onAuthStateChange(
          async (
            _event,
            nextSession
          ) => {
            if (
              nextSession &&
              active
            ) {
              await savePendingTermsAcceptance(
                nextSession.access_token
              );

              if (safeNext) {
                router.replace(safeNext);
                return;
              }

              await finishLogin();
            }
          }
        );

      return () => {
        subscription.unsubscribe();
      };
    }

    const cleanupPromise =
      bootstrap();

    return () => {
      active = false;
      cleanupPromise.then(
        (cleanup) =>
          cleanup?.()
      );
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      Signing you in...
    </main>
  );
}
