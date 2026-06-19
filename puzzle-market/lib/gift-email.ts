type GiftInviteEmailInput = {
  to: string;
  senderName: string;
  puzzleTitle: string;
  pieceIndex: number;
  claimUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendGiftInviteEmail(
  input: GiftInviteEmailInput
) {
  const apiKey =
    process.env.RESEND_API_KEY?.trim();

  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Puzzle Market <support@puzzle-market.com>";

  if (!apiKey) {
    return {
      sent: false,
      reason:
        "RESEND_API_KEY is not configured",
    };
  }

  const senderName = escapeHtml(
    input.senderName
  );
  const puzzleTitle = escapeHtml(
    input.puzzleTitle
  );
  const claimUrl = escapeHtml(
    input.claimUrl
  );
  const pieceNumber =
    input.pieceIndex + 1;

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
        subject: `${senderName} sent you a Puzzle Market gift`,
        text:
          `You received a Puzzle Market gift\n\n` +
          `${input.senderName} reserved ${input.puzzleTitle}, piece #${pieceNumber}, for this email address.\n\n` +
          `Open your gift: ${input.claimUrl}\n\n` +
          `Create or sign in to your Puzzle Market account with this email, activate a Starter plan or higher, and the gifted piece will be assigned to you automatically.`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#050505;padding:28px">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #bae6fd;border-radius:22px;overflow:hidden">
              <div style="background:#050505;color:#fff;padding:28px;border-bottom:4px solid #22d3ee">
                <p style="margin:0;color:#22d3ee;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase">Puzzle Market Gift</p>
                <h1 style="margin:12px 0 0;font-size:30px;line-height:1.1">${senderName} sent you a puzzle piece</h1>
                <p style="margin:14px 0 0;color:#cbd5e1;font-size:15px">This gift is reserved for your email address until you claim it.</p>
              </div>

              <div style="padding:26px">
                <div style="border:1px solid #bae6fd;border-radius:18px;padding:18px;background:#ecfeff;margin:0 0 20px">
                  <p style="margin:0;color:#0891b2;font-size:12px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase">Reserved Piece</p>
                  <h2 style="margin:8px 0 0;font-size:24px;line-height:1.15;color:#0f172a">${puzzleTitle}</h2>
                  <p style="margin:8px 0 0;color:#334155;font-size:15px">Piece #${pieceNumber}</p>
                </div>

                <p style="margin:0 0 18px;color:#334155">Open the link below, create or sign in to your account with this email, and activate a Starter plan or higher. After that, Puzzle Market assigns the piece to you and emails your ownership certificate.</p>

                <p style="margin:22px 0">
                  <a href="${claimUrl}" style="display:inline-block;padding:14px 20px;background:#22d3ee;color:#000;text-decoration:none;font-weight:900;border-radius:12px">Open Gift</a>
                </p>

                <p style="margin:18px 0 0;color:#64748b;font-size:12px">If you did not expect this gift, you can ignore this email.</p>
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
