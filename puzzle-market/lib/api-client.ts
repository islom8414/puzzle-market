import { getCanonicalSiteUrl } from "@/lib/site-url";

function shouldUseCanonicalApi() {
  if (typeof window === "undefined") {
    return false;
  }

  const host = window.location.hostname;

  return (
    host.endsWith(".puzzle-market.com") &&
    host !== "puzzle-market.com"
  );
}

export function apiUrl(path: string) {
  if (!path.startsWith("/api/")) {
    return path;
  }

  if (!shouldUseCanonicalApi()) {
    return path;
  }

  return `${getCanonicalSiteUrl()}${path}`;
}

export function apiFetch(
  path: string,
  init?: RequestInit
) {
  return fetch(apiUrl(path), init);
}
