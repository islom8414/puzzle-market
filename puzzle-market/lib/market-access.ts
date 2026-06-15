type AccessUser = {
  app_metadata?: unknown;
} | null | undefined;

export function isAdminUser(
  user: AccessUser
) {
  const metadata =
    user?.app_metadata &&
    typeof user.app_metadata ===
      "object"
      ? (user.app_metadata as Record<
          string,
          unknown
        >)
      : {};

  return (
    metadata.role ===
      "admin" ||
    metadata.platform_owner === true
  );
}

export function hasCreatorUploadAccess(
  user: AccessUser,
  profile:
    | {
        subscription_tier?: string | null;
        subscription_status?: string | null;
      }
    | null
    | undefined
) {
  if (isAdminUser(user)) {
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

export function hasAuctionListingAccess(
  user: AccessUser,
  profile:
    | {
        subscription_tier?: string | null;
        subscription_status?: string | null;
      }
    | null
    | undefined
) {
  if (isAdminUser(user)) {
    return true;
  }

  const active =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  return (
    active &&
    (profile?.subscription_tier === "premium" ||
      profile?.subscription_tier === "creator")
  );
}
