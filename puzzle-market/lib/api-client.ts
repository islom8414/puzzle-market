const translatedHosts = new Set([
  "ru.puzzle-market.com",
  "ja.puzzle-market.com",
  "zh-cn.puzzle-market.com",
]);

function getPrimaryApiOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.puzzle-market.com";
  const url = new URL(configured);

  if (
    url.hostname ===
    "puzzle-market.com"
  ) {
    url.hostname =
      "www.puzzle-market.com";
  }

  return url.toString().replace(/\/$/, "");
}

const primaryApiOrigin =
  getPrimaryApiOrigin();

function shouldUsePrimaryApi() {
  if (typeof window === "undefined") {
    return false;
  }

  return translatedHosts.has(
    window.location.hostname
  );
}

export function apiUrl(path: string) {
  if (!path.startsWith("/api/")) {
    return path;
  }

  if (!shouldUsePrimaryApi()) {
    return path;
  }

  return `${primaryApiOrigin}${path}`;
}

export function apiFetch(
  path: string,
  init?: RequestInit
) {
  return fetch(apiUrl(path), init);
}
