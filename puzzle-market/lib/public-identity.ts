import { cleanPublicName } from "./display-name";

export const platformOwnerEmails = [
  "islommatchanov888@gmail.com",
  "ismatchanov08@gmail.com",
];

export const platformOwnerName =
  "Puzzle Market Vault";

export function isPlatformOwnerEmail(
  email?: string | null
) {
  return platformOwnerEmails.includes(
    (email || "").toLowerCase()
  );
}

export function publicOwnerName(
  profile?: {
    email?: string | null;
    username?: string | null;
  } | null
) {
  if (
    isPlatformOwnerEmail(
      profile?.email
    )
  ) {
    return platformOwnerName;
  }

  return cleanPublicName(
    profile?.username
  );
}

export { cleanPublicName };
