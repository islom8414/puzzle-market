export type StripeMode = "test" | "live";

export type StripeConfig = {
  mode: StripeMode;
  secretKey: string;
};

function getExpectedStripeMode(): StripeMode {
  const configuredMode =
    process.env.STRIPE_MODE?.trim().toLowerCase();

  if (
    configuredMode === "live" ||
    configuredMode === "test"
  ) {
    return configuredMode;
  }

  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    return "live";
  }

  return "test";
}

function getKeyMode(secretKey: string) {
  if (secretKey.startsWith("sk_live_")) {
    return "live";
  }

  if (secretKey.startsWith("sk_test_")) {
    return "test";
  }

  return null;
}

export function getStripeConfig(): StripeConfig {
  const secretKey =
    process.env.STRIPE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new Error(
      "Stripe secret key is missing"
    );
  }

  const expectedMode =
    getExpectedStripeMode();

  const keyMode =
    getKeyMode(secretKey);

  if (!keyMode) {
    throw new Error(
      "Stripe secret key must start with sk_test_ or sk_live_"
    );
  }

  if (keyMode !== expectedMode) {
    throw new Error(
      `Stripe ${expectedMode} mode requires an sk_${expectedMode}_ secret key`
    );
  }

  return {
    mode: expectedMode,
    secretKey,
  };
}

export function assertStripeEventMode(
  livemode: boolean,
  expectedMode: StripeMode
) {
  if (livemode !== (expectedMode === "live")) {
    throw new Error(
      `Stripe webhook mode does not match ${expectedMode} server mode`
    );
  }
}
