"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

export default function OriginalPathGuard() {
  const pathname =
    usePathname() || "/";
  const script = `
    (() => {
      const originalPath = ${JSON.stringify(pathname)};

      if (window.location.pathname !== originalPath) {
        window.history.replaceState(
          window.history.state,
          "",
          originalPath +
            window.location.search +
            window.location.hash
        );
      }
    })();
  `;

  return (
    <Script
      id="puzzle-market-original-path"
      strategy="beforeInteractive"
      className="notranslate"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
      dangerouslySetInnerHTML={{
        __html: script,
      }}
    />
  );
}
