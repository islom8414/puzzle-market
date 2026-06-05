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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendOwnershipEmail(
  input: OwnershipEmailInput
) {
  const apiKey =
    process.env.RESEND_API_KEY?.trim();

  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Puzzle Market <support@puzzle-market.com>";

  const puzzleUrl = `${input.origin}/puzzle/${encodeURIComponent(input.puzzleSlug)}`;
  const profileUrl = `${input.origin}/profile`;
  const puzzleTitle = escapeHtml(
    input.puzzleTitle
  );
  const certificateCode = escapeHtml(
    input.certificateCode
  );
  const certificateUrl = escapeHtml(
    input.certificateUrl
  );
  const safePuzzleUrl = escapeHtml(
    puzzleUrl
  );
  const safeProfileUrl = escapeHtml(
    profileUrl
  );
  const tradeId = escapeHtml(
    input.tradeId
  );
  const pieceId = escapeHtml(
    input.pieceId
  );
  const shortCode =
    input.certificateCode.slice(0, 18);
  const pieceNumber =
    input.pieceIndex + 1;

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
        subject: `You now own a Puzzle Market piece: ${input.puzzleTitle}`,
        text:
          `Puzzle Market ownership confirmed\n\n` +
          `You are now the current verified owner of ${input.puzzleTitle}, piece #${pieceNumber}.\n\n` +
          `Your signed ownership code:\n${input.certificateCode}\n\n` +
          `Verify certificate: ${input.certificateUrl}\n` +
          `Open puzzle: ${puzzleUrl}\n` +
          `Inventory: ${profileUrl}\n\n` +
          `If you resell this piece, this certificate remains authentic but will no longer verify as current ownership.`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#050505;padding:28px">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbeafe;border-radius:22px;overflow:hidden">
              <div style="background:#050505;color:#fff;padding:28px;border-bottom:4px solid #22d3ee">
                <p style="margin:0;color:#22d3ee;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase">Puzzle Market Ownership Certificate</p>
                <h1 style="margin:12px 0 0;font-size:30px;line-height:1.1">You are now the verified owner</h1>
                <p style="margin:14px 0 0;color:#cbd5e1;font-size:15px">This signed certificate proves that this puzzle fragment is currently assigned to your Puzzle Market account.</p>
              </div>

              <div style="padding:26px">
                <div style="border:1px solid #bae6fd;border-radius:18px;padding:18px;background:#ecfeff;margin:0 0 20px">
                  <p style="margin:0;color:#0891b2;font-size:12px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase">Current Owner Status</p>
                  <h2 style="margin:8px 0 0;font-size:24px;line-height:1.15;color:#0f172a">${puzzleTitle}</h2>
                  <p style="margin:8px 0 0;color:#334155;font-size:15px">Piece #${pieceNumber} is now yours unless you list and resell it later.</p>
                </div>

                <p style="margin:0 0 18px;color:#334155">Keep this email as your receipt and ownership proof. The code below is unique, signed by Puzzle Market, and can be checked on the certificate page.</p>

                <div style="border:1px solid #d1d5db;border-radius:16px;padding:18px;background:#f8fafc;margin:18px 0">
                  <p style="margin:0 0 8px;color:#64748b;font-size:12px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase">Signed Ownership Code</p>
                  <code style="display:block;word-break:break-all;font-size:13px;line-height:1.6;color:#0f172a;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px">${certificateCode}</code>
                  <p style="margin:10px 0 0;color:#64748b;font-size:12px">Short reference: ${escapeHtml(shortCode)}...</p>
                </div>

                <p style="margin:22px 0">
                  <a href="${certificateUrl}" style="display:inline-block;padding:14px 20px;background:#22d3ee;color:#000;text-decoration:none;font-weight:900;border-radius:12px">Verify certificate</a>
                </p>

                <p style="margin:18px 0">
                  <a href="${safePuzzleUrl}" style="color:#0e7490;font-weight:800">Open your puzzle</a>
                  &nbsp;|&nbsp;
                  <a href="${safeProfileUrl}" style="color:#0e7490;font-weight:800">View inventory</a>
                </p>

                <div style="margin:22px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;color:#64748b;font-size:12px">
                  <p style="margin:0">If this piece is resold later, this certificate remains authentic, but the verification page will show that ownership has transferred to a newer buyer.</p>
                  <p style="margin:12px 0 0">Trade ID: ${tradeId}<br/>Piece ID: ${pieceId}</p>
                </div>
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
