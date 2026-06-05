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
        router.replace(
          profile.hasActiveSubscription
            ? "/marketplace"
            : "/subscribe"
        );
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
        await finishLogin();
        return;
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
