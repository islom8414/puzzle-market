"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import {
  cacheUsername,
  fetchMyProfile,
} from "@/lib/client-profile";
import { supabase } from "@/lib/supabase";

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
        if (next) {
          router.replace(next);
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
          if (next) {
            router.replace(next);
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
              if (next) {
                router.replace(next);
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
