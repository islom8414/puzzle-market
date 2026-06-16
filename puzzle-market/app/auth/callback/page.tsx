"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import {
  cacheUsername,
  fetchMyProfile,
} from "@/lib/client-profile";
import { supabase } from "@/lib/supabase";
import {
  hasAcceptedCurrentTerms,
  termsAcceptPath,
} from "@/lib/terms-status";

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
    const finalNext =
      safeNext || "/marketplace";

    function needsTerms(
      session: NonNullable<
        Awaited<
          ReturnType<
            typeof supabase.auth.getSession
          >
        >["data"]["session"]
      >
    ) {
      return !hasAcceptedCurrentTerms(
        session.user
          .user_metadata as Record<
          string,
          unknown
        >
      );
    }

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
        if (needsTerms(session)) {
          router.replace(
            termsAcceptPath(finalNext)
          );
          return;
        }

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
            if (needsTerms(exchangedSession)) {
              router.replace(
                termsAcceptPath(finalNext)
              );
              return;
            }
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
              if (needsTerms(nextSession)) {
                router.replace(
                  termsAcceptPath(finalNext)
                );
                return;
              }

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
