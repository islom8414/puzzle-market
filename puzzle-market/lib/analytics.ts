export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
  "G-0QBE80QRNW";

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

export function isGoogleAnalyticsReady() {
  return (
    isBrowser() &&
    typeof window.gtag === "function" &&
    Boolean(GA_MEASUREMENT_ID)
  );
}

export function sendGAEvent(
  eventName: string,
  params: GtagParams = {}
) {
  if (!isGoogleAnalyticsReady()) {
    return;
  }

  window.gtag?.("event", eventName, params);
}

export function trackPageView(
  pagePath: string,
  pageTitle?: string
) {
  if (!isGoogleAnalyticsReady()) {
    return;
  }

  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: pagePath,
    page_title: pageTitle,
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
