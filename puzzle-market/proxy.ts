import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = new Set([
  "https://puzzle-market.com",
  "https://ru.puzzle-market.com",
  "https://ja.puzzle-market.com",
  "https://zh-cn.puzzle-market.com",
]);

function corsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
}

export function proxy(request: NextRequest) {
  const origin =
    request.headers.get("origin") || "";

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
