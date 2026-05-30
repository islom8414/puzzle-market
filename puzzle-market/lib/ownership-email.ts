type OwnershipEmailInput = {
  to: string;
  puzzleTitle: string;
  puzzleSlug: string;
  pieceIndex: number;
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
        subject: `You own a missing piece: ${input.puzzleTitle}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
            <h1 style="margin:0 0 12px">You are the owner of this missing piece</h1>
            <p><strong>${input.puzzleTitle}</strong> — piece #${input.pieceIndex + 1}</p>
            <p>This fragment is now in your Puzzle Market profile. You can play the board or resell it at your own price.</p>
            <p>
              <a href="${puzzleUrl}" style="display:inline-block;padding:12px 18px;background:#22d3ee;color:#000;text-decoration:none;font-weight:700;border-radius:10px">Open your puzzle</a>
            </p>
            <p>
              <a href="${profileUrl}">View your profile inventory</a>
            </p>
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
