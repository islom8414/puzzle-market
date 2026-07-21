import { isAdminUser } from "@/lib/market-access";
import type { SupabaseClient } from "@supabase/supabase-js";

const activeStatuses = new Set(["active", "trialing"]);
const paidTiers = new Set([
  "starter",
  "premium",
  "creator",
  "sweepstakes",
]);

export function hasActivePaidSubscription(
  profile:
    | {
        subscription_tier?: string | null;
        subscription_status?: string | null;
      }
    | null
    | undefined,
  user?: {
    app_metadata?: unknown;
  } | null
) {
  if (isAdminUser(user)) {
    return true;
  }

  return (
    activeStatuses.has(profile?.subscription_status || "") &&
    paidTiers.has(profile?.subscription_tier || "")
  );
}

export async function requireActivePaidSubscription(
  // Supabase's generated client type can recurse heavily in Next builds here.
  admin: SupabaseClient,
  user: {
    id: string;
    email?: string | null;
    app_metadata?: unknown;
  }
) {
  const { data: profile } =
    await admin
      .from("market_profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

  return hasActivePaidSubscription(profile, user);
}
