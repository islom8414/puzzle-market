import "server-only";

import {
  MontraConfig,
  getMontraConfig,
  isMontraConfigured,
} from "@/lib/montra-config";

export type MontraCard = {
  token: string;
  pan: string;
  bank?: string;
  type?: string;
};

export type MontraPayout = {
  id: string;
  referenceId?: string;
  status: string;
  payment?: {
    id?: string;
    status?: string;
  };
};

function authHeaders(config: MontraConfig) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.secretKey}`,
    "X-API-Key": config.apiKey,
  };
}

async function montraRequest<T>(
  path: string,
  init: RequestInit = {}
) {
  const config = getMontraConfig();

  if (!config.payoutsEnabled) {
    throw new Error(
      "Montra payouts are not enabled yet"
    );
  }

  const response = await fetch(
    `${config.baseUrl}${path}`,
    {
      ...init,
      headers: {
        ...authHeaders(config),
        ...(init.headers || {}),
      },
    }
  );

  const text = await response.text();
  const data = text
    ? JSON.parse(text)
    : null;

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Montra request failed with ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export function getMontraReadiness() {
  return {
    configured: isMontraConfigured(),
    enabled:
      process.env.MONTRA_PAYOUTS_ENABLED ===
      "true",
  };
}

export async function getCardsByPhone(
  phone: string
) {
  const normalizedPhone =
    phone.replace(/[^\d+]/g, "");
  const encodedPhone =
    encodeURIComponent(normalizedPhone);

  const data = await montraRequest<
    MontraCard[] | { data?: MontraCard[] }
  >(
    `/payouts/cards/by-phone/${encodedPhone}`,
    {
      method: "GET",
    }
  );

  return Array.isArray(data)
    ? data
    : data.data || [];
}

export function usdCentsToUzs(
  cents: number
) {
  const config = getMontraConfig();
  return Math.round(
    (cents / 100) * config.usdToUzsRate
  );
}

export async function createPayoutByToken({
  token,
  amountUzs,
  referenceId,
  withdrawalId,
  userId,
}: {
  token: string;
  amountUzs: number;
  referenceId: string;
  withdrawalId: string;
  userId: string;
}) {
  return montraRequest<MontraPayout>(
    "/payouts/by-token",
    {
      method: "POST",
      body: JSON.stringify({
        referenceId,
        receiver: {
          account: token,
        },
        money: {
          amount: amountUzs,
          currency: "UZS",
        },
        metadata: {
          withdrawalId,
          userId,
        },
      }),
    }
  );
}
