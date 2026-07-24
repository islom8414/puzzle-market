import { TERMS_VERSION } from "@/lib/legal";

export function hasAcceptedCurrentTerms(
  metadata:
    | Record<string, unknown>
    | null
    | undefined
) {
  return (
    metadata?.terms_version ===
      TERMS_VERSION &&
    typeof metadata
      ?.terms_accepted_at ===
      "string"
  );
}

export function termsAcceptPath(
  nextPath = "/marketplace"
) {
  const safeNext =
    nextPath.startsWith("/") &&
    !nextPath.startsWith("//")
      ? nextPath
      : "/marketplace";

  return `/terms/accept?next=${encodeURIComponent(safeNext)}`;
}

export function isGiveawayCheckoutIntent(
  nextPath: string | null | undefined
) {
  if (
    !nextPath ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//")
  ) {
    return false;
  }

  try {
    const url = new URL(
      nextPath,
      "https://www.puzzle-market.com"
    );

    return (
      url.pathname === "/subscribe" &&
      url.searchParams.get("plan") === "sweepstakes" &&
      url.searchParams.get("checkout") === "1" &&
      url.searchParams.get("rules") === "accepted"
    );
  } catch {
    return false;
  }
}
