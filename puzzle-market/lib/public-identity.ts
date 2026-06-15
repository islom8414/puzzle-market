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

export { cleanPublicName };
