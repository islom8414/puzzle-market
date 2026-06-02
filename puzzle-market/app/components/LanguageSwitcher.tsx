"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Weglot?: {
      initialized?: boolean;
      initialize: (options: {
        api_key: string;
        hide_switcher?: boolean;
        wait_transition?: boolean;
      }) => void;
      switchTo: (code: string) => void;
      getCurrentLang?: () => string;
      on?: (
        eventName: string,
        callback: (
          newLanguage?: string
        ) => void
      ) => void;
    };
  }
}

const languages = [
  {
    code: "en",
    label: "English",
    short: "EN",
  },
  {
    code: "ru",
    label: "Russian",
    short: "RU",
  },
  {
    code: "ja",
    label: "Japanese",
    short: "JP",
  },
  {
    code: "zh",
    label: "Chinese",
    short: "CN",
  },
  {
    code: "uz",
    label: "Uzbek",
    short: "UZ",
  },
  {
    code: "ko",
    label: "Korean",
    short: "KR",
  },
] as const;

const weglotApiKey =
  process.env.NEXT_PUBLIC_WEGLOT_API_KEY;

export default function LanguageSwitcher() {
  const [open, setOpen] =
    useState(false);
  const [ready, setReady] =
    useState(false);
  const [current, setCurrent] =
    useState("en");

  function initializeWeglot() {
    if (
      !weglotApiKey ||
      !window.Weglot ||
      window.Weglot.initialized
    ) {
      return;
    }

    window.Weglot.initialize({
      api_key: weglotApiKey,
      hide_switcher: true,
      wait_transition: true,
    });

    setReady(true);

    window.Weglot.on?.(
      "languageChanged",
      (newLanguage) => {
        if (newLanguage) {
          setCurrent(newLanguage);
        }
      }
    );
  }

  useEffect(() => {
    if (
      window.Weglot?.initialized &&
      window.Weglot.getCurrentLang
    ) {
      setReady(true);
      setCurrent(
        window.Weglot.getCurrentLang()
      );
    }
  }, []);

  function switchLanguage(
    code: string
  ) {
    setOpen(false);

    if (
      !ready ||
      !window.Weglot
    ) {
      alert(
        "Language translation will be available after Weglot API key is added."
      );
      return;
    }

    window.Weglot.switchTo(code);
    setCurrent(code);
  }

  const currentLanguage =
    languages.find(
      (language) =>
        language.code === current
    ) || languages[0];

  return (
    <div className="relative">
      {weglotApiKey && (
        <Script
          src="https://cdn.weglot.com/weglot.min.js"
          strategy="afterInteractive"
          onLoad={initializeWeglot}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-11 rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-black transition hover:border-cyan-400"
        aria-label="Choose language"
      >
        {currentLanguage.short}
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-[120] w-44 rounded-2xl border border-white/10 bg-zinc-950 p-2 shadow-2xl">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() =>
                switchLanguage(
                  language.code
                )
              }
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                language.code ===
                currentLanguage.code
                  ? "bg-cyan-400 text-black"
                  : "text-zinc-200 hover:bg-white/10"
              }`}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
