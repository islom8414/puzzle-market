type OwnershipEmailInput = {
  to: string;
  puzzleTitle: string;
  puzzleSlug: string;
  tradeId: string;
  pieceId: string;
  pieceIndex: number;
  certificateCode: string;
  certificateUrl: string;
  origin: string;
};

export async function sendOwnershipEmail(
  input: OwnershipEmailInput
) {
  const apiKey =
    process.env.RESEND_API_KEY?.trim();

  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Puzzle Market <onboarding@resend.dev>";

  const puzzleUrl = `${input.origin}/puzzle/${encodeURIComponent(input.puzzleSlug)}`;
  const profileUrl = `${input.origin}/profile`;
  const shortCode =
    input.certificateCode.slice(0, 18);

  if (!apiKey) {
    return {
      sent: false,
      reason:
        "RESEND_API_KEY is not configured",
    };
  }

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.to],
        subject: `Ownership confirmed: ${input.puzzleTitle}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#f6f8fb;padding:28px">
            <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden">
              <div style="background:#050505;color:#fff;padding:24px">
                <p style="margin:0;color:#22d3ee;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">Puzzle Market Ownership</p>
                <h1 style="margin:10px 0 0;font-size:28px;line-height:1.1">You successfully bought this puzzle piece</h1>
              </div>

              <div style="padding:24px">
                <p style="margin:0 0 14px"><strong>${input.puzzleTitle}</strong> - piece #${input.pieceIndex + 1}</p>
                <p style="margin:0 0 18px">This fragment is now assigned to your Puzzle Market account. If you resell it later, this certificate will no longer verify as current ownership because the new buyer becomes the active owner.</p>

                <div style="border:1px solid #d1d5db;border-radius:14px;padding:16px;background:#f9fafb;margin:18px 0">
                  <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase">Ownership code</p>
                  <code style="display:block;word-break:break-all;font-size:13px;color:#111">${input.certificateCode}</code>
                  <p style="margin:10px 0 0;color:#6b7280;font-size:12px">Short reference: ${shortCode}...</p>
                </div>

                <p style="margin:18px 0">
                  <a href="${input.certificateUrl}" style="display:inline-block;padding:12px 18px;background:#22d3ee;color:#000;text-decoration:none;font-weight:800;border-radius:10px">Verify ownership certificate</a>
                </p>

                <p style="margin:18px 0">
                  <a href="${puzzleUrl}" style="color:#0f766e;font-weight:700">Open your puzzle</a>
                  &nbsp;|&nbsp;
                  <a href="${profileUrl}" style="color:#0f766e;font-weight:700">View inventory</a>
                </p>

                <p style="margin:18px 0 0;color:#6b7280;font-size:12px">Trade ID: ${input.tradeId}<br/>Piece ID: ${input.pieceId}</p>
              </div>
            </div>
          </div>
        `,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();

    return {
      sent: false,
      reason: body || "Email provider error",
    };
  }

  return { sent: true };
}
