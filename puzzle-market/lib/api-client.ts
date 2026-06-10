const translatedHosts = new Set([
  "ru.puzzle-market.com",
  "ja.puzzle-market.com",
  "zh-cn.puzzle-market.com",
]);

const primaryApiOrigin =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(
    /\/$/,
    ""
  ) || "https://puzzle-market.com";

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
