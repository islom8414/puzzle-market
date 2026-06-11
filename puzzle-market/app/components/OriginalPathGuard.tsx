"use client";

import { usePathname } from "next/navigation";

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
    <script
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
