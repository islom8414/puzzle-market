"use client";

import { useEffect, useRef, useState } from "react";

type LanguageCode =
  | "en"
  | "ru"
  | "ja"
  | "zh-cn";

const primaryDomain =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ||
  "puzzle-market.com";

const languages: {
  code: LanguageCode;
  label: string;
  shortLabel: string;
}[] = [
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
  },
  {
    code: "ru",
    label: "Русский",
    shortLabel: "RU",
  },
  {
    code: "ja",
    label: "日本語",
    shortLabel: "JA",
  },
  {
    code: "zh-cn",
    label: "中文",
    shortLabel: "ZH",
  },
];

function getCurrentLanguage(
  hostname: string
): LanguageCode {
  const normalized =
    hostname.toLowerCase();

  if (
    normalized.startsWith("zh-cn.")
  ) {
    return "zh-cn";
  }

  if (
    normalized.startsWith("ru.")
  ) {
    return "ru";
  }

  if (
    normalized.startsWith("ja.")
  ) {
    return "ja";
  }

  return "en";
}

function getLanguageUrl(
  code: LanguageCode
) {
  const {
    pathname,
    search,
    hash,
    protocol,
    hostname,
  } = window.location;

  const host =
    hostname.toLowerCase();

  const localHost =
    host === "localhost" ||
    host === "127.0.0.1";

  const baseDomain =
    localHost
      ? primaryDomain
      : host.endsWith(primaryDomain)
        ? primaryDomain
        : host.replace(
            /^(zh-cn|ru|ja)\./,
            ""
          );

  const nextHost =
    code === "en"
      ? baseDomain
      : `${code}.${baseDomain}`;

  const nextProtocol =
    localHost
      ? "https:"
      : protocol;

  return `${nextProtocol}//${nextHost}${pathname}${search}${hash}`;
}

export default function LanguageSwitcher() {
  const [open, setOpen] =
    useState(false);
  const [current, setCurrent] =
    useState<LanguageCode>("en");
  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrent(
      getCurrentLanguage(
        window.location.hostname
      )
    );
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(
      event: MouseEvent
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      closeOnOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick
      );
    };
  }, []);

  const currentLanguage =
    languages.find(
      (language) =>
        language.code === current
    ) || languages[0];

  return (
    <div
      ref={containerRef}
      className="notranslate relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen(!open)
        }
        className="translate-safe-action notranslate h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-black transition hover:border-cyan-400 md:px-4"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {currentLanguage.shortLabel}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-14 z-[80] w-40 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
        >
          {languages.map(
            (language) => (
              <button
                key={language.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  window.location.href =
                    getLanguageUrl(
                      language.code
                    );
                }}
                className={`translate-safe-action notranslate flex w-full items-center justify-between px-4 py-3 text-left text-sm font-black transition hover:bg-white/10 ${
                  language.code ===
                  current
                    ? "text-cyan-400"
                    : "text-white"
                }`}
              >
                <span>
                  {language.label}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {language.shortLabel}
                </span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
