const productionSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.puzzle-market.com";

function canonicalizeProductionUrl(
  value: string
) {
  const url = new URL(value);

  if (
    url.hostname ===
    "puzzle-market.com"
  ) {
    url.hostname =
      "www.puzzle-market.com";
  }

  return url.toString().replace(/\/$/, "");
}

export function getCanonicalSiteUrl() {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return window.location.origin;
  }

  return canonicalizeProductionUrl(
    productionSiteUrl
  );
}

export function getAuthRedirectUrl(path = "/auth/callback") {
  return `${getCanonicalSiteUrl()}${path}`;
}
