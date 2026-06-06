"use client";

import { usePathname } from "next/navigation";

const primaryDomain =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ||
  "puzzle-market.com";

const languages = [
  {
    code: "en",
    host: primaryDomain,
  },
  {
    code: "ru",
    host: `ru.${primaryDomain}`,
  },
  {
    code: "ja",
    host: `ja.${primaryDomain}`,
  },
  {
    code: "zh",
    host: `zh-cn.${primaryDomain}`,
  },
];

export default function LanguageSwitcher() {
  const path =
    usePathname() || "/";

  return (
    <details
      className="language-switcher notranslate"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
    >
      <summary
        aria-label="Language"
        className="language-switcher-trigger"
      >
        <span
          aria-hidden="true"
          className="language-current"
        />
      </summary>

      <div className="language-switcher-menu">
        {languages.map(
          (language) => (
            <a
              key={language.code}
              href={`https://${language.host}${path}`}
              className={`language-switcher-option language-switcher-option-${language.code}`}
              translate="no"
              data-no-translation="true"
              data-linguise-ignore="true"
              aria-label={language.code}
            />
          )
        )}
      </div>
    </details>
  );
}
