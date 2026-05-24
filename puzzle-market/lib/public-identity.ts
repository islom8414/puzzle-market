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

export function cleanPublicName(
  value?: string | null
) {
  const raw =
    (value || "").trim();

  if (
    !raw ||
    raw.includes("@")
  ) {
    return "Collector";
  }

  return raw
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    )
    .slice(0, 24) ||
    "Collector";
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
