import "server-only";

import crypto from "crypto";

type CertificatePayload = {
  tradeId: string;
  pieceId: string;
  ownerId: string;
};

function base64Url(
  value: string | Buffer
) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  return Buffer.from(
    normalized,
    "base64"
  ).toString("utf8");
}

function getCertificateSecret() {
  const secret =
    process.env
      .OWNERSHIP_CERTIFICATE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "Ownership certificate secret is missing"
    );
  }

  return secret;
}

export function createOwnershipCode(
  payload: CertificatePayload
) {
  const body = base64Url(
    JSON.stringify(payload)
  );
  const signature = crypto
    .createHmac(
      "sha256",
      getCertificateSecret()
    )
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

export function readOwnershipCode(
  code: string
): CertificatePayload | null {
  const [body, signature] =
    code.split(".");

  if (!body || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac(
      "sha256",
      getCertificateSecret()
    )
    .update(body)
    .digest("base64url");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      fromBase64Url(body)
    ) as CertificatePayload;

    if (
      !payload.tradeId ||
      !payload.pieceId ||
      !payload.ownerId
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
