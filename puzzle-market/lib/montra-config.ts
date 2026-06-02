export type MontraMode =
  | "test"
  | "live";

export type MontraConfig = {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  mode: MontraMode;
  payoutsEnabled: boolean;
  usdToUzsRate: number;
};

function getMontraMode(): MontraMode {
  const mode =
    process.env.MONTRA_MODE?.trim().toLowerCase();

  if (
    mode === "live" ||
    mode === "test"
  ) {
    return mode;
  }

  return process.env.NODE_ENV === "production"
    ? "live"
    : "test";
}

export function getMontraConfig(): MontraConfig {
  const mode = getMontraMode();
  const apiKey =
    process.env.MONTRA_API_KEY?.trim();
  const secretKey =
    process.env.MONTRA_SECRET_KEY?.trim();
  const baseUrl =
    process.env.MONTRA_BASE_URL?.trim() ||
    "https://api.montratech.com/api/v1";
  const usdToUzsRate = Number(
    process.env.MONTRA_USD_TO_UZS_RATE ||
      "12600"
  );

  if (!apiKey || !secretKey) {
    throw new Error(
      "Montra API keys are missing"
    );
  }

  if (
    mode === "live" &&
    !apiKey.startsWith("mt_live_")
  ) {
    throw new Error(
      "Montra live mode requires mt_live API key"
    );
  }

  if (
    mode === "test" &&
    !apiKey.startsWith("mt_test_")
  ) {
    throw new Error(
      "Montra test mode requires mt_test API key"
    );
  }

  if (
    !Number.isFinite(usdToUzsRate) ||
    usdToUzsRate <= 0
  ) {
    throw new Error(
      "MONTRA_USD_TO_UZS_RATE must be a positive number"
    );
  }

  return {
    baseUrl,
    apiKey,
    secretKey,
    mode,
    usdToUzsRate,
    payoutsEnabled:
      process.env.MONTRA_PAYOUTS_ENABLED ===
      "true",
  };
}

export function isMontraConfigured() {
  return Boolean(
    process.env.MONTRA_API_KEY?.trim() &&
      process.env.MONTRA_SECRET_KEY?.trim()
  );
}
