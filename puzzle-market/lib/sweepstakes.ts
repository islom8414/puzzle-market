import type { SupabaseClient } from "@supabase/supabase-js";

export const sweepstakesPaidTiers = [
  "starter",
  "premium",
  "creator",
  "sweepstakes",
] as const;

export const sweepstakesActiveStatuses = [
  "active",
  "trialing",
] as const;

export const sweepstakesWaves = [
  {
    name: "Wave 1",
    label: "Register by August 31",
    endsAt: "2026-08-31T23:59:59.999Z",
    tickets: 3,
  },
  {
    name: "Wave 2",
    label: "Register by October 15",
    endsAt: "2026-10-15T23:59:59.999Z",
    tickets: 2,
  },
  {
    name: "Wave 3",
    label: "Register by November 30",
    endsAt: "2026-11-30T23:59:59.999Z",
    tickets: 1,
  },
] as const;

export const sweepstakesFirstDrawDate = "2026-12-25";
export const sweepstakesMegaDrawDate = "2027-07-07";

export const sweepstakesPrizePool = [
  { name: "iPhone 17 Pro Max", quantity: 7 },
  { name: "AirPods Pro", quantity: 7 },
  { name: "$100 puzzle credit", quantity: 7 },
  { name: "$10 puzzle credit", quantity: 7 },
  { name: "$1 puzzle credit", quantity: 70 },
] as const;

export const sweepstakesPurchaseUnitCents = 700;
export const sweepstakesOneDollarPieceCents = 100;
export const sweepstakesOneDollarBundleSize = 7;

export type SweepstakesSummary = {
  isEntered: boolean;
  entryDate: string | null;
  baseTickets: number;
  referralTickets: number;
  purchaseTickets: number;
  oneDollarBundleTickets: number;
  totalTickets: number;
  qualifiedReferralCount: number;
  purchaseSpendCents: number;
  oneDollarPieceCount: number;
  waveLabel: string | null;
};

export function getBaseSweepstakesTickets(
  entryDate: string | null | undefined
) {
  if (!entryDate) {
    return {
      tickets: 0,
      waveLabel: null,
    };
  }

  const enteredAt = new Date(entryDate).getTime();

  const wave = sweepstakesWaves.find(
    (item) => enteredAt <= new Date(item.endsAt).getTime()
  );

  return {
    tickets: wave?.tickets || 0,
    waveLabel: wave?.label || null,
  };
}

export async function getSweepstakesSummary(
  admin: SupabaseClient,
  userId: string
): Promise<SweepstakesSummary> {
  const { data: profile } = await admin
    .from("market_profiles")
    .select(
      "subscription_tier,subscription_status,sweepstakes_entered_at,subscription_updated_at"
    )
    .eq("id", userId)
    .maybeSingle();

  const isEntered =
    profile?.subscription_tier === "sweepstakes" &&
    sweepstakesActiveStatuses.includes(
      profile?.subscription_status as "active" | "trialing"
    );

  const entryDate =
    (profile?.sweepstakes_entered_at as string | null | undefined) ||
    (isEntered
      ? (profile?.subscription_updated_at as string | null | undefined)
      : null) ||
    null;

  const base =
    isEntered
      ? getBaseSweepstakesTickets(entryDate)
      : { tickets: 0, waveLabel: null };

  const [referralsResult, tradesResult] = await Promise.all([
    admin
      .from("market_profiles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("referred_by_user_id", userId)
      .in("subscription_tier", sweepstakesPaidTiers)
      .in("subscription_status", sweepstakesActiveStatuses),
    admin
      .from("piece_trades")
      .select("price_cents")
      .eq("buyer_user_id", userId),
  ]);

  const qualifiedReferralCount =
    referralsResult.count || 0;
  const prices =
    (tradesResult.data || []) as Array<{
      price_cents: number | null;
    }>;
  const purchaseSpendCents = prices.reduce(
    (sum, item) =>
      sum + Math.max(0, item.price_cents || 0),
    0
  );
  const oneDollarPieceCount = prices.filter(
    (item) => item.price_cents === sweepstakesOneDollarPieceCents
  ).length;

  const referralTickets = qualifiedReferralCount;
  const purchaseTickets = Math.floor(
    purchaseSpendCents / sweepstakesPurchaseUnitCents
  );
  const oneDollarBundleTickets = Math.floor(
    oneDollarPieceCount / sweepstakesOneDollarBundleSize
  );
  const totalTickets =
    base.tickets +
    referralTickets +
    purchaseTickets +
    oneDollarBundleTickets;

  return {
    isEntered,
    entryDate,
    baseTickets: base.tickets,
    referralTickets,
    purchaseTickets,
    oneDollarBundleTickets,
    totalTickets,
    qualifiedReferralCount,
    purchaseSpendCents,
    oneDollarPieceCount,
    waveLabel: base.waveLabel,
  };
}
