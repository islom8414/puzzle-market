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

