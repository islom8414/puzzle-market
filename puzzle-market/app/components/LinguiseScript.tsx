"use client";

import Script from "next/script";

const linguiseScriptUrl =
  process.env.NEXT_PUBLIC_LINGUISE_SCRIPT_URL;

export default function LinguiseScript() {
  if (
    !linguiseScriptUrl ||
    !linguiseScriptUrl.startsWith("https://")
  ) {
    return null;
  }

  return (
    <Script
      src={linguiseScriptUrl}
      strategy="afterInteractive"
    />
  );
}
