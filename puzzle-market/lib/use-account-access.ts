"use client";

import { useEffect, useState } from "react";

import { fetchMyProfile } from "@/lib/client-profile";
import { hasActivePaidSubscription } from "@/lib/subscription-access";
import { supabase } from "@/lib/supabase";

type AccountAccess = {
  checking: boolean;
  authenticated: boolean;
  hasActivePlan: boolean;
};

const initialAccess: AccountAccess = {
  checking: true,
  authenticated: false,
  hasActivePlan: false,
};

export function useAccountAccess() {
  const [access, setAccess] =
    useState<AccountAccess>(initialAccess);

  useEffect(() => {
    let mounted = true;

    async function loadAccess() {
      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      const user = session?.user || null;

      if (!user) {
        setAccess({
          checking: false,
          authenticated: false,
          hasActivePlan: false,
        });
        return;
      }

      const profile =
        await fetchMyProfile();

      if (!mounted) {
        return;
      }

      const subscriptionProfile =
        profile
          ? {
              subscription_tier:
                profile.subscriptionTier,
              subscription_status:
                profile.subscriptionStatus,
            }
          : null;

      setAccess({
        checking: false,
        authenticated: true,
        hasActivePlan:
          Boolean(
            profile?.hasActiveSubscription
          ) ||
          hasActivePaidSubscription(
            subscriptionProfile,
            user
          ),
      });
    }

    loadAccess();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        () => {
          loadAccess();
        }
      );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return access;
}
