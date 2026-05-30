export const ADMIN_EMAILS = [
  "islommatchanov888@gmail.com",
  "ismatchanov08@gmail.com",
] as const;

export function isAdminEmail(
  email: string | null | undefined
) {
  const normalized =
    email?.toLowerCase() || "";

  return (
    ADMIN_EMAILS as readonly string[]
  ).includes(normalized);
}

export function hasCreatorUploadAccess(
  email: string | null | undefined,
  profile:
    | {
        subscription_tier?: string | null;
        subscription_status?: string | null;
      }
    | null
    | undefined
) {
  if (isAdminEmail(email)) {
    return true;
  }

  const active =
    profile?.subscription_status ===
      "active" ||
    profile?.subscription_status ===
      "trialing";

  return (
    active &&
    profile?.subscription_tier ===
      "creator"
  );
}
