"use client";

import { useEffect, useState } from "react";

const promptKey = "puzzle-language-prompt-dismissed";
const languageKey = "puzzle-language";

const languages = [
  { label: "English", code: "EN", value: "en" },
  { label: "Russian", code: "RU", value: "ru" },
  { label: "Japanese", code: "JA", value: "ja" },
  { label: "Chinese", code: "ZH", value: "zh-cn" },
];

function targetForLanguage(language: string) {
  const target = new URL(window.location.href);

  if (language === "en") {
    target.searchParams.delete("lang");
  } else {
    target.searchParams.set("lang", language);
  }

  return target.toString();
}

export default function LanguagePrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    if (
      window.localStorage.getItem(promptKey) ||
      window.localStorage.getItem(languageKey) ||
      params.has("lang")
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function chooseLanguage(language: string) {
    window.localStorage.setItem(promptKey, "1");
    window.localStorage.setItem(languageKey, language);
    window.location.assign(
      targetForLanguage(language)
    );
  }

  function dismiss() {
    window.localStorage.setItem(promptKey, "1");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      className="language-prompt notranslate"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
    >
      <div>
        <p className="language-prompt-title">
          Choose your language
        </p>
        <p className="language-prompt-copy">
          Continue in your preferred language.
        </p>
      </div>

      <div className="language-prompt-actions">
        {languages.map((language) => (
          <button
            key={language.value}
            type="button"
            onClick={() =>
              chooseLanguage(language.value)
            }
            className="language-prompt-button"
            aria-label={language.label}
          >
            {language.code}
          </button>
        ))}

        <button
          type="button"
          onClick={dismiss}
          className="language-prompt-close"
          aria-label="Close language prompt"
        >
          x
        </button>
      </div>
    </div>
  );
}
