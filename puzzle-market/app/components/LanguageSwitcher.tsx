"use client";

import { useEffect, useState } from "react";

type LanguageCode =
  | "en"
  | "ru"
  | "ja"
  | "zh-cn";

const primaryDomain =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ||
  "puzzle-market.com";

const languageOrder: LanguageCode[] = [
  "en",
  "ru",
  "ja",
  "zh-cn",
];

const languageLabels:
  Record<LanguageCode, string> = {
    en: "EN",
    ru: "RU",
    ja: "JA",
    "zh-cn": "ZH",
  };

const languageNames:
  Record<LanguageCode, string> = {
    en: "Switch language",
    ru: "Switch to Russian",
    ja: "Switch to Japanese",
    "zh-cn": "Switch to Chinese",
  };

function getCurrentLanguage(
  hostname: string,
  pathname: string
): LanguageCode {
  const host =
    hostname.toLowerCase();
  const path =
    pathname.toLowerCase();

  if (
    host.startsWith("zh-cn.") ||
    path.startsWith("/zh-cn/")
  ) {
    return "zh-cn";
  }

  if (
    host.startsWith("ru.") ||
    path.startsWith("/ru/")
  ) {
    return "ru";
  }

  if (
    host.startsWith("ja.") ||
    path.startsWith("/ja/")
  ) {
    return "ja";
  }

  return "en";
}

function getNextLanguage(
  current: LanguageCode
): LanguageCode {
  const currentIndex =
    languageOrder.indexOf(current);
  const nextIndex =
    (currentIndex + 1) %
    languageOrder.length;

  return languageOrder[nextIndex];
}

function cleanPathname(
  pathname: string
) {
  return pathname.replace(
    /^\/(zh-cn|ru|ja)(?=\/|$)/,
    ""
  ) || "/";
}

function getLanguageUrl(
  code: LanguageCode
) {
  const {
    pathname,
    search,
    hash,
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

  return `https://${nextHost}${cleanPathname(
    pathname
  )}${search}${hash}`;
}

export default function LanguageSwitcher() {
  const [label, setLabel] =
    useState("RU");
  const [href, setHref] =
    useState(
      `https://ru.${primaryDomain}/`
    );
  const [title, setTitle] =
    useState(languageNames.ru);

  useEffect(() => {
    const current =
      getCurrentLanguage(
        window.location.hostname,
        window.location.pathname
      );
    const next =
      getNextLanguage(current);

    setLabel(languageLabels[next]);
    setHref(getLanguageUrl(next));
    setTitle(languageNames[next]);
  }, []);

  const handleClick = (
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault();

    const current =
      getCurrentLanguage(
        window.location.hostname,
        window.location.pathname
      );
    const next =
      getNextLanguage(current);

    window.location.assign(
      getLanguageUrl(next)
    );
  };

  return (
    <a
      href={href}
      title={title}
      aria-label={title}
      onClick={handleClick}
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
      className="notranslate translate-safe-action flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 text-xs font-black transition hover:border-cyan-400 md:px-4"
    >
      {label}
    </a>
  );
}
