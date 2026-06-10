import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";
import { NextResponse } from "next/server";

import {
  createSupabaseAdmin,
  getBearerToken,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";

const allowedHosts = new Set([
  "puzzle-market.com",
  "www.puzzle-market.com",
  "ru.puzzle-market.com",
  "ja.puzzle-market.com",
  "zh-cn.puzzle-market.com",
]);

type BridgePayload = {
  accessToken: string;
  expiresAt: number;
  nextPath: string;
  refreshToken: string;
  targetHost: string;
  userId: string;
};

function getEncryptionKey() {
  const secret =
    process.env.AUTH_BRIDGE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Auth bridge secret is missing"
    );
  }

  return createHash("sha256")
    .update(secret)
    .digest();
}

function encryptPayload(
  payload: BridgePayload
) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );
  const encrypted = Buffer.concat([
    cipher.update(
      JSON.stringify(payload),
      "utf8"
    ),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([
    iv,
    authTag,
    encrypted,
  ]).toString("base64url");
}

function decryptPayload(token: string) {
  const buffer = Buffer.from(
    token,
    "base64url"
  );

  if (buffer.length < 29) {
    throw new Error(
      "Invalid bridge token"
    );
  }

  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(
    12,
    28
  );
  const encrypted =
    buffer.subarray(28);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    iv
  );

  decipher.setAuthTag(authTag);

  return JSON.parse(
    Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString("utf8")
  ) as BridgePayload;
}

function safePath(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
    ? value
    : "/";
}

function response(
  request: Request,
  body: unknown,
  status = 200
) {
  const origin =
    request.headers.get("origin") || "";
  const headers = new Headers({
    "Cache-Control": "no-store",
  });

  try {
    const originHost = new URL(
      origin
    ).hostname;

    if (allowedHosts.has(originHost)) {
      headers.set(
        "Access-Control-Allow-Origin",
        origin
      );
      headers.set("Vary", "Origin");
    }
  } catch {
    // Same-origin requests do not always include Origin.
  }

  return NextResponse.json(body, {
    status,
    headers,
  });
}

export async function POST(
  request: Request
) {
  try {
    const accessToken =
      getBearerToken(request);

    if (!accessToken) {
      return response(
        request,
        { error: "Unauthorized" },
        401
      );
    }

    const body = (await request.json()) as {
      refreshToken?: string;
      targetHost?: string;
      nextPath?: string;
    };
    const targetHost =
      body.targetHost || "";

    if (
      !allowedHosts.has(targetHost) ||
      !body.refreshToken
    ) {
      return response(
        request,
        { error: "Invalid request" },
        400
      );
    }

    const admin =
      createSupabaseAdmin();
    const { data, error } =
      await admin.auth.getUser(
        accessToken
      );

    if (error || !data.user) {
      return response(
        request,
        { error: "Invalid session" },
        401
      );
    }

    const token = encryptPayload({
      accessToken,
      refreshToken:
        body.refreshToken,
      targetHost,
      nextPath: safePath(
        body.nextPath
      ),
      expiresAt: Date.now() + 60_000,
      userId: data.user.id,
    });

    return response(request, {
      token,
    });
  } catch {
    return response(
      request,
      {
        error:
          "Could not create language session",
      },
      500
    );
  }
}

export async function PUT(
  request: Request
) {
  try {
    const body = (await request.json()) as {
      token?: string;
    };

    if (!body.token) {
      return response(
        request,
        { error: "Token is required" },
        400
      );
    }

    const payload = decryptPayload(
      body.token
    );
    const origin =
      request.headers.get("origin");
    const originHost = origin
      ? new URL(origin).hostname
      : "";

    if (
      payload.expiresAt < Date.now() ||
      payload.targetHost !== originHost ||
      !allowedHosts.has(originHost)
    ) {
      return response(
        request,
        {
          error:
            "Language session expired",
        },
        401
      );
    }

    const admin =
      createSupabaseAdmin();
    const { data, error } =
      await admin.auth.getUser(
        payload.accessToken
      );

    if (
      error ||
      !data.user ||
      data.user.id !== payload.userId
    ) {
      return response(
        request,
        { error: "Invalid session" },
        401
      );
    }

    return response(request, {
      accessToken:
        payload.accessToken,
      refreshToken:
        payload.refreshToken,
      nextPath: payload.nextPath,
    });
  } catch {
    return response(
      request,
      {
        error:
          "Could not restore language session",
      },
      401
    );
  }
}
