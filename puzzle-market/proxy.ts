import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = new Set([
  "https://puzzle-market.com",
  "https://www.puzzle-market.com",
  "https://ru.puzzle-market.com",
  "https://ja.puzzle-market.com",
  "https://zh-cn.puzzle-market.com",
]);

type RateLimitRule = {
  limit: number;
  windowMs: number;
};

const defaultRateLimit: RateLimitRule = {
  limit: 180,
  windowMs: 60_000,
};

const sensitiveRateLimits: Array<{
  path: string;
  methods?: string[];
  rule: RateLimitRule;
}> = [
  {
    path: "/api/create-checkout-session",
    methods: ["POST"],
    rule: { limit: 8, windowMs: 60_000 },
  },
  {
    path: "/api/create-subscription-session",
    methods: ["POST"],
    rule: { limit: 8, windowMs: 60_000 },
  },
  {
    path: "/api/request-withdrawal",
    methods: ["POST"],
    rule: { limit: 5, windowMs: 60_000 },
  },
  {
    path: "/api/purchase-listing",
    methods: ["POST"],
    rule: { limit: 20, windowMs: 60_000 },
  },
  {
    path: "/api/purchase-marketplace",
    methods: ["POST"],
    rule: { limit: 20, windowMs: 60_000 },
  },
  {
    path: "/api/list-owned-piece",
    methods: ["POST"],
    rule: { limit: 20, windowMs: 60_000 },
  },
  {
    path: "/api/chat-messages",
    methods: ["POST"],
    rule: { limit: 18, windowMs: 60_000 },
  },
  {
    path: "/api/support-private",
    methods: ["POST"],
    rule: { limit: 10, windowMs: 60_000 },
  },
  {
    path: "/api/gifts",
    methods: ["POST"],
    rule: { limit: 15, windowMs: 60_000 },
  },
  {
    path: "/api/gifts/claim",
    methods: ["POST"],
    rule: { limit: 12, windowMs: 60_000 },
  },
  {
    path: "/api/stripe/connect-onboarding",
    methods: ["POST"],
    rule: { limit: 6, windowMs: 60_000 },
  },
  {
    path: "/api/montra/cards",
    methods: ["POST"],
    rule: { limit: 8, windowMs: 60_000 },
  },
  {
    path: "/api/admin",
    rule: { limit: 30, windowMs: 60_000 },
  },
  {
    path: "/api/admin-piece-price",
    methods: ["POST"],
    rule: { limit: 30, windowMs: 60_000 },
  },
];

const rateLimitBuckets = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

let nextRateLimitCleanup = 0;

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
}

function getClientIp(request: NextRequest) {
  const forwardedFor =
    request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function rateLimitRuleFor(
  pathname: string,
  method: string
) {
  return (
    sensitiveRateLimits.find((entry) => {
      if (!pathname.startsWith(entry.path)) {
        return false;
      }

      return (
        !entry.methods ||
        entry.methods.includes(method)
      );
    })?.rule || defaultRateLimit
  );
}

function cleanupExpiredRateLimits(now: number) {
  if (now < nextRateLimitCleanup) {
    return;
  }

  nextRateLimitCleanup = now + 60_000;

  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) {
      rateLimitBuckets.delete(key);
    }
  }
}

function checkRateLimit(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const now = Date.now();

  cleanupExpiredRateLimits(now);

  const rule = rateLimitRuleFor(pathname, method);
  const ip = getClientIp(request);
  const key = `${ip}:${method}:${pathname}`;
  const current =
    rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, {
      count: 1,
      resetAt: now + rule.windowMs,
    });
    return null;
  }

  current.count += 1;

  if (current.count <= rule.limit) {
    return null;
  }

  const retryAfter = Math.max(
    1,
    Math.ceil((current.resetAt - now) / 1000)
  );

  return NextResponse.json(
    {
      error:
        "Too many requests. Please wait a moment and try again.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(rule.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(
          Math.ceil(current.resetAt / 1000)
        ),
      },
    }
  );
}

export function proxy(request: NextRequest) {
  const origin =
    request.headers.get("origin") || "";

  if (request.method !== "OPTIONS") {
    const rateLimitResponse =
      checkRateLimit(request);

    if (rateLimitResponse) {
      if (allowedOrigins.has(origin)) {
        Object.entries(corsHeaders(origin)).forEach(
          ([key, value]) => {
            rateLimitResponse.headers.set(key, value);
          }
        );
      }

      return rateLimitResponse;
    }
  }

  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    allowedOrigins.has(origin)
  ) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    const response = NextResponse.next();

    Object.entries(corsHeaders(origin)).forEach(
      ([key, value]) => {
        response.headers.set(key, value);
      }
    );

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
