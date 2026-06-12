"use client";

import { usePathname } from "next/navigation";
import {
  useState,
  type MouseEvent,
} from "react";

const languages = [
  {
    code: "en",
    value: "en",
  },
  {
    code: "ru",
    value: "ru",
  },
  {
    code: "ja",
    value: "ja",
  },
  {
    code: "zh",
    value: "zh-cn",
  },
];

export default function LanguageSwitcher() {
  const path = usePathname() || "/";
  const [switchingTo, setSwitchingTo] =
    useState<string | null>(null);

  function getTargetUrl(
    language: string
  ) {
    const targetUrl = new URL(
      path,
      window.location.origin
    );
    const currentParams =
      new URLSearchParams(
        window.location.search
      );

    for (const [key, value] of currentParams) {
      targetUrl.searchParams.append(
        key,
        value
      );
    }

    if (language === "en") {
      targetUrl.searchParams.delete(
        "lang"
      );
    } else {
      targetUrl.searchParams.set(
        "lang",
        language
      );
    }

    targetUrl.hash =
      window.location.hash;

    return targetUrl;
  }

  function switchLanguage(
    event: MouseEvent<HTMLAnchorElement>,
    language: string
  ) {
    event.preventDefault();

    if (switchingTo) {
      return;
    }

    setSwitchingTo(language);
    window.localStorage.setItem(
      "puzzle-language",
      language
    );
    window.location.assign(
      getTargetUrl(
        language
      ).toString()
    );
  }

  return (
    <>
      {switchingTo && (
        <div
          className="notranslate fixed inset-0 z-[300] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          translate="no"
          data-no-translation="true"
          data-linguise-ignore="true"
        >
          <div className="rounded-2xl border border-cyan-400/30 bg-zinc-950 px-8 py-6 text-center shadow-2xl">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-cyan-400" />
            <p className="mt-4 font-black text-white">
              Switching language...
            </p>
          </div>
        </div>
      )}

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
                href={
                  language.value === "en"
                    ? path
                    : `${path}?lang=${language.value}`
                }
                onClick={(event) =>
                  switchLanguage(
                    event,
                    language.value
                  )
                }
                className={`language-switcher-option language-switcher-option-${language.code}`}
                translate="no"
                data-no-translation="true"
                data-linguise-ignore="true"
                aria-label={language.code}
                aria-busy={
                  switchingTo ===
                  language.value
                }
              />
            )
          )}
        </div>
      </details>
    </>
  );
}
