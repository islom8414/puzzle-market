const productionSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://puzzle-market.com";

export function getCanonicalSiteUrl() {
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost"
  ) {
    return window.location.origin;
  }

  return productionSiteUrl.replace(/\/$/, "");
}

export function getAuthRedirectUrl(path = "/auth/callback") {
  return `${getCanonicalSiteUrl()}${path}`;
}
