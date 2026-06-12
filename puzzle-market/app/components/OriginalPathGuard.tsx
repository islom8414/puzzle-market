"use client";

import { usePathname } from "next/navigation";

export default function OriginalPathGuard() {
  const pathname = usePathname() || "/";
  const script = `
    (() => {
      const originalPath = ${JSON.stringify(pathname)};
      const languageByHost = {
        "ru.puzzle-market.com": "ru",
        "ja.puzzle-market.com": "ja",
        "zh-cn.puzzle-market.com": "zh-cn"
      };
      const language = languageByHost[window.location.hostname];

      if (language) {
        const target = new URL(
          originalPath,
          "https://www.puzzle-market.com"
        );
        const currentParams = new URLSearchParams(
          window.location.search
        );

        for (const [key, value] of currentParams) {
          target.searchParams.append(key, value);
        }

        target.searchParams.set("lang", language);
        target.hash = window.location.hash;
        window.location.replace(target.toString());
        return;
      }

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
      id="puzzle-market-original-path"
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
