import { cleanPublicName } from "./display-name";

export const platformOwnerName =
  "Puzzle Market Vault";

export function publicOwnerName(
  profile?: {
    username?: string | null;
  } | null
) {
  return cleanPublicName(
    profile?.username
  );
}

export function isPlatformOwnerName(
  value?: string | null
) {
  const name =
    cleanPublicName(value)
      .trim()
      .toLowerCase();

  return [
    "admin",
    "puzzle market",
    "puzzle market vault",
    "puzzlemarket",
  ].includes(name);
}

export { cleanPublicName };
