import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api-client";

export type UserProfile = {
  username: string;
  email: string;
  profileComplete: boolean;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  hasActiveSubscription?: boolean;
};

async function getAccessToken() {
  const {
    data: { session },
  } =
    await supabase.auth.getSession();

  return session?.access_token || null;
}

export async function fetchMyProfile() {
  try {
    const token =
      await getAccessToken();

    if (!token) {
      return null;
    }

    const response =
      await apiFetch("/api/profile", {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
        cache: "no-store",
      });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveMyUsername(
  username: string
) {
  const token =
    await getAccessToken();

  if (!token) {
    return {
      ok: false as const,
      error: "Login required",
    };
  }

  const response =
    await apiFetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
        Authorization:
          `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
      }),
    });

  const data =
    (await response.json()) as {
      error?: string;
      username?: string;
    };

  if (!response.ok) {
    return {
      ok: false as const,
      error:
        data.error ||
        "Failed to save username",
    };
  }

  return {
    ok: true as const,
    username:
      data.username || username,
  };
}

export function cacheUsername(
  username: string
) {
  localStorage.setItem(
    "puzzle-username",
    username
  );
}
