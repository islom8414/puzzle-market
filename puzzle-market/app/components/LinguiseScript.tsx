"use client";

import { useEffect } from "react";

const publicKey =
  "pk_ofdGPZoP3EV4s45OpExbRtYSeqqbocYG";
const scriptUrl =
  `https://static.linguise.com/script-js/switcher.bundle.js?d=${publicKey}`;
const languageStorageKey =
  "puzzle-language";
const supportedLanguages = new Set([
  "en",
  "ru",
  "ja",
  "zh-cn",
]);

function getSelectedLanguage() {
  const queryLanguage =
    new URLSearchParams(
      window.location.search
    ).get("lang");
  const storedLanguage =
    window.localStorage.getItem(
      languageStorageKey
    );
  const language =
    queryLanguage ||
    storedLanguage ||
    "en";

  return supportedLanguages.has(language)
    ? language
    : "en";
}

function refreshTextNodes() {
  const walker =
    document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node =
      walker.currentNode as Text;
    const parent =
      node.parentElement;

    if (
      !parent ||
      !node.textContent?.trim() ||
      parent.closest(
        "script, style, noscript, code, pre, textarea, .notranslate, [translate='no'], [data-no-translation], [data-linguise-ignore]"
      )
    ) {
      continue;
    }

    nodes.push(node);
  }

  for (const node of nodes) {
    node.replaceWith(
      document.createTextNode(
        node.textContent || ""
      )
    );
  }
}

function addMetadata(language: string) {
  document
    .getElementById(
      "linguise-extra-metadata"
    )
    ?.remove();

  const metadata =
    document.createElement("script");
  metadata.id =
    "linguise-extra-metadata";
  metadata.type =
    "application/json";
  metadata.textContent =
    JSON.stringify({
      domain: window.btoa(
        "https://www.puzzle-market.com"
      ),
      url: window.btoa(
        window.location.href
      ),
      language: "en",
      translate_urls: false,
      dynamic_translations: {
        enabled: true,
      },
      language_settings: null,
      languages: [
        {
          code: "zh-cn",
          name: "Chinese",
          original_name: "Chinese",
        },
        {
          code: "ru",
          name: "Russian",
          original_name: "Russian",
        },
        {
          code: "ja",
          name: "Japanese",
          original_name: "Japanese",
        },
        {
          code: "en",
          name: "English",
          original_name: "English",
        },
      ],
      current_language: language,
      structure: "subdomains",
      platform: "other",
      debug: false,
      public_key: publicKey,
      rules: [],
      cached_selectors: [],
    });

  document.head.appendChild(
    metadata
  );
}

export default function LinguiseScript() {
  useEffect(() => {
    const language =
      getSelectedLanguage();

    window.localStorage.setItem(
      languageStorageKey,
      language
    );

    if (language === "en") {
      document.documentElement.lang = "en";
      return;
    }

    addMetadata(language);

    const translatePage = () => {
      window.setTimeout(
        refreshTextNodes,
        120
      );
      window.setTimeout(
        refreshTextNodes,
        650
      );
      window.setTimeout(() => {
        document.documentElement.lang =
          language;
      }, 700);
    };
    const existing =
      document.querySelector<HTMLScriptElement>(
        `script[src^="${scriptUrl}"]`
      );

    if (existing) {
      translatePage();
      return;
    }

    const script =
      document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.addEventListener(
      "load",
      translatePage,
      { once: true }
    );
    document.body.appendChild(script);
  }, []);

  return null;
}
