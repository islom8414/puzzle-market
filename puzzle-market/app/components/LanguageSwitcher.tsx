"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
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
  const [open, setOpen] = useState(false);
  const rootRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: globalThis.MouseEvent) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
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
    event: ReactMouseEvent<HTMLAnchorElement>,
    language: string
  ) {
    event.preventDefault();
    setOpen(false);
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
    <div
      ref={rootRef}
      className="language-switcher notranslate"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
    >
      <button
        type="button"
        aria-label="Language"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="language-switcher-trigger"
      >
        <span
          aria-hidden="true"
          className="language-current"
        />
      </button>

      {open && (
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
            />
          )
        )}
      </div>
      )}
    </div>
  );
}
