"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import { fetchMyProfile } from "@/lib/client-profile";
import { supabase } from "@/lib/supabase";

const protectedPrefixes = [
  "/",
  "/marketplace",
  "/puzzle",
  "/sell",
  "/withdraw",
  "/add-funds",
  "/chat",
  "/collection",
  "/activity",
  "/fragment",
];

const publicPrefixes = [
  "/login",
  "/register",
  "/auth",
  "/setup",
  "/subscribe",
  "/profile",
  "/about",
  "/support",
  "/ownership",
];

function isProtectedPath(pathname: string) {
  if (
    publicPrefixes.some((prefix) =>
      pathname.startsWith(prefix)
    )
  ) {
    return false;
  }

  return protectedPrefixes.some((prefix) =>
    prefix === "/"
      ? pathname === "/"
      : pathname.startsWith(prefix)
  );
}

export default function SubscriptionGate() {
  const pathname = usePathname();
  const [loading, setLoading] =
    useState(true);
  const [state, setState] =
    useState<
      | "allowed"
      | "guest"
      | "profile"
      | "subscription"
    >("allowed");

  const protectedPath = useMemo(
    () => isProtectedPath(pathname),
    [pathname]
  );

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (!protectedPath) {
        setState("allowed");
        setLoading(false);
        return;
      }

      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session) {
        setState("guest");
        setLoading(false);
        return;
      }

      const profile =
        await fetchMyProfile();

      if (!active) {
        return;
      }

      if (!profile?.profileComplete) {
        setState("profile");
      } else if (
        profile.hasActiveSubscription
      ) {
        setState("allowed");
      } else {
        setState("subscription");
      }

      setLoading(false);
    }

    checkAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      () => {
        checkAccess();
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, protectedPath]);

  if (
    !protectedPath ||
    loading ||
    state === "allowed"
  ) {
    return null;
  }

  const copy =
    state === "guest"
      ? {
          title: "Sign in to enter Puzzle Market",
          body: "Create an account or sign in before collecting, buying, selling, or chatting.",
          href: "/login",
          action: "Sign in",
        }
      : state === "profile"
        ? {
            title: "Finish your collector profile",
            body: "Choose your username first. It will be saved to your account and can be changed later in Profile.",
            href: "/setup",
            action: "Finish profile",
          }
        : {
            title: "Starter plan required",
            body: "A Starter subscription unlocks puzzle assembly, buying pieces, reselling, wallet actions, and chat.",
            href: "/subscribe",
            action: "Choose Starter",
          };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md">
      <section className="w-full max-w-lg rounded-[28px] border border-cyan-400/25 bg-zinc-950 p-6 text-white shadow-2xl md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-400">
          Puzzle Market Access
        </p>

        <h2 className="mt-4 text-4xl font-black leading-tight">
          {copy.title}
        </h2>

        <p className="mt-4 text-zinc-400 leading-relaxed">
          {copy.body}
        </p>

        <a
          href={copy.href}
          className="mt-7 flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black"
        >
          {copy.action}
        </a>
      </section>
    </div>
  );
}
