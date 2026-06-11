const cookieDomain =
  ".puzzle-market.com";
const chunkSize = 2800;
const maxChunks = 8;
const oneYear = 60 * 60 * 24 * 365;

function isBrowser() {
  return typeof window !== "undefined";
}

function canShareCookies() {
  if (!isBrowser()) {
    return false;
  }

  const hostname =
    window.location.hostname;

  return (
    hostname === "puzzle-market.com" ||
    hostname ===
      "www.puzzle-market.com" ||
    hostname.endsWith(
      ".puzzle-market.com"
    )
  );
}

function readCookie(name: string) {
  if (
    typeof document === "undefined"
  ) {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((item) =>
      item.startsWith(prefix)
    );

  return cookie
    ? cookie.slice(prefix.length)
    : null;
}

function cookieOptions(maxAge: number) {
  const secure =
    window.location.protocol ===
    "https:"
      ? "; Secure"
      : "";
  const domain = canShareCookies()
    ? `; Domain=${cookieDomain}`
    : "";

  return `; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${domain}`;
}

function writeCookie(
  name: string,
  value: string,
  maxAge = oneYear
) {
  document.cookie = `${name}=${value}${cookieOptions(maxAge)}`;
}

function clearCookie(name: string) {
  writeCookie(name, "", 0);
}

function writeSharedValue(
  key: string,
  value: string
) {
  const encoded =
    encodeURIComponent(value);
  const chunks: string[] = [];

  for (
    let index = 0;
    index < encoded.length;
    index += chunkSize
  ) {
    chunks.push(
      encoded.slice(
        index,
        index + chunkSize
      )
    );
  }

  for (
    let index = 0;
    index < maxChunks;
    index += 1
  ) {
    if (chunks[index]) {
      writeCookie(
        `${key}.${index}`,
        chunks[index]
      );
    } else {
      clearCookie(
        `${key}.${index}`
      );
    }
  }

  writeCookie(
    `${key}.count`,
    String(chunks.length)
  );
}

function readSharedValue(key: string) {
  const rawCount = readCookie(
    `${key}.count`
  );
  const count = Number(rawCount);

  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > maxChunks
  ) {
    return null;
  }

  let encoded = "";

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const chunk = readCookie(
      `${key}.${index}`
    );

    if (chunk === null) {
      return null;
    }

    encoded += chunk;
  }

  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function clearSharedValue(key: string) {
  clearCookie(`${key}.count`);

  for (
    let index = 0;
    index < maxChunks;
    index += 1
  ) {
    clearCookie(`${key}.${index}`);
  }
}

export const sharedAuthStorage = {
  getItem(key: string) {
    if (!isBrowser()) {
      return null;
    }

    const shared =
      readSharedValue(key);

    if (shared !== null) {
      window.localStorage.setItem(
        key,
        shared
      );
      return shared;
    }

    const local =
      window.localStorage.getItem(key);

    if (local !== null) {
      writeSharedValue(key, local);
    }

    return local;
  },

  setItem(
    key: string,
    value: string
  ) {
    if (!isBrowser()) {
      return;
    }

    window.localStorage.setItem(
      key,
      value
    );
    writeSharedValue(key, value);
  },

  removeItem(key: string) {
    if (!isBrowser()) {
      return;
    }

    window.localStorage.removeItem(key);
    clearSharedValue(key);
  },
};
