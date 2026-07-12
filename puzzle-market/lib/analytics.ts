export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  "G-0QBE800RNW";

type GtagCommand =
  | "config"
  | "event"
  | "js"
  | "set";

type GtagParams =
  Record<
    string,
    | string
    | number
    | boolean
    | null
    | undefined
    | GtagItem[]
    | Record<string, unknown>
  >;

export type GtagItem = {
  item_id?: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price?: number;
  quantity?: number;
};

type CheckoutPayload = {
  currency?: string;
  value?: number;
  transaction_id?: string;
  items: GtagItem[];
};

type PurchasePayload =
  CheckoutPayload & {
    transaction_id: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
  };

declare global {
  interface Window {
    gtag?: (
      command: GtagCommand,
      targetId: string | Date,
      config?: GtagParams
    ) => void;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

const attributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function getAttributionParams() {
  if (!isBrowser()) {
    return {};
  }

  try {
    const params =
      new URLSearchParams(
        window.location.search
      );
    const attribution: Record<
      string,
      string
    > = {};

    for (const key of attributionKeys) {
      const value =
        params.get(key);

      if (value) {
        attribution[key] = value;
      }
    }

    return attribution;
  } catch {
    return {};
  }
}

function getStoredAttributionParams() {
  if (!isBrowser()) {
    return {};
  }

  try {
    const stored =
      localStorage.getItem("pm_last_touch") ||
      localStorage.getItem("pm_first_touch");

    if (!stored) {
      return {};
    }

    const parsed = JSON.parse(stored) as Record<
      string,
      unknown
    >;
    const attribution: Record<string, string> = {};

    for (const key of attributionKeys) {
      const value = parsed[key];

      if (typeof value === "string" && value) {
        attribution[key] = value;
      }
    }

    return attribution;
  } catch {
    return {};
  }
}

function getEventAttributionParams() {
  return {
    ...getStoredAttributionParams(),
    ...getAttributionParams(),
  };
}

export function captureCampaignAttribution() {
  if (!isBrowser()) {
    return;
  }

  const attribution =
    getAttributionParams();

  if (
    Object.keys(attribution).length === 0
  ) {
    return;
  }

  try {
    const payload =
      JSON.stringify({
        ...attribution,
        landing_path:
          window.location.pathname,
        captured_at:
          new Date().toISOString(),
      });

    if (
      !localStorage.getItem(
        "pm_first_touch"
      )
    ) {
      localStorage.setItem(
        "pm_first_touch",
        payload
      );
    }

    localStorage.setItem(
      "pm_last_touch",
      payload
    );
  } catch {
    // Attribution is helpful, but should never block the page.
  }
}

export function isGoogleAnalyticsReady() {
  return (
    isBrowser() &&
    typeof window.gtag === "function" &&
    Boolean(GA_MEASUREMENT_ID)
  );
}

function runWhenGoogleAnalyticsReady(
  callback: () => void,
  attempt = 0
) {
  if (!isBrowser() || !GA_MEASUREMENT_ID) {
    return;
  }

  if (isGoogleAnalyticsReady()) {
    callback();
    return;
  }

  if (attempt >= 20) {
    return;
  }

  window.setTimeout(() => {
    runWhenGoogleAnalyticsReady(
      callback,
      attempt + 1
    );
  }, 250);
}

export function sendGAEvent(
  eventName: string,
  params: GtagParams = {}
) {
  runWhenGoogleAnalyticsReady(() => {
    window.gtag?.("event", eventName, {
      ...getEventAttributionParams(),
      ...params,
    });
  });
}

export function trackPageView(
  pagePath: string,
  pageTitle?: string
) {
  runWhenGoogleAnalyticsReady(() => {
    window.gtag?.("config", GA_MEASUREMENT_ID, {
      page_path: pagePath,
      page_title: pageTitle,
    });
  });
}

export function trackSignUp(
  method = "email"
) {
  sendGAEvent("sign_up", {
    method,
  });
}

export function trackLogin(
  method = "email"
) {
  sendGAEvent("login", {
    method,
  });
}

export function trackSearch(
  searchTerm: string
) {
  const normalizedTerm =
    searchTerm.trim();

  if (!normalizedTerm) {
    return;
  }

  sendGAEvent("search", {
    search_term: normalizedTerm,
  });
}

export function trackViewItem(
  item: GtagItem
) {
  sendGAEvent("view_item", {
    currency: "USD",
    value: item.price,
    items: [item],
  });
}

export function trackAddToCart(
  item: GtagItem
) {
  sendGAEvent("add_to_cart", {
    currency: "USD",
    value: item.price,
    items: [
      {
        quantity: 1,
        ...item,
      },
    ],
  });
}

export function trackBeginCheckout({
  currency = "USD",
  value,
  transaction_id,
  items,
}: CheckoutPayload) {
  sendGAEvent("begin_checkout", {
    currency,
    value,
    transaction_id,
    items,
  });
}

export function trackPurchase({
  currency = "USD",
  value,
  transaction_id,
  tax,
  shipping,
  coupon,
  items,
}: PurchasePayload) {
  sendGAEvent("purchase", {
    currency,
    value,
    transaction_id,
    tax,
    shipping,
    coupon,
    items,
  });
}
