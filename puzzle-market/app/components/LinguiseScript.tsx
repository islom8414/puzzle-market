"use client";

import { useEffect } from "react";
import {
  LINGUISE_PUBLIC_KEY,
  LINGUISE_SCRIPT_URL,
} from "@/lib/linguise";

const publicKey = LINGUISE_PUBLIC_KEY;
const languageStorageKey = "puzzle-language";
const supportedLanguages = new Set([
  "en",
  "ru",
  "ja",
  "zh-cn",
]);

function isPaidCampaignLanding(params: URLSearchParams) {
  return (
    params.has("utm_source") ||
    params.has("utm_medium") ||
    params.has("utm_campaign") ||
    params.has("gclid") ||
    params.has("fbclid")
  );
}

function getSelectedLanguage() {
  const earlyLanguage = (
    window as typeof window & {
      __puzzleLinguiseLanguage?: string;
    }
  ).__puzzleLinguiseLanguage;
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get("lang");
  const storedLanguage = window.localStorage.getItem(languageStorageKey);

  if (queryLanguage && supportedLanguages.has(queryLanguage)) {
    return queryLanguage;
  }

  if (isPaidCampaignLanding(params)) {
    return "en";
  }

  const language = queryLanguage || earlyLanguage || storedLanguage || "en";

  return supportedLanguages.has(language) ? language : "en";
}

function removeLinguiseRuntime() {
  document.getElementById("linguise-extra-metadata")?.remove();

  document
    .querySelectorAll<HTMLScriptElement>(
      `script[src^="${LINGUISE_SCRIPT_URL}"]`
    )
    .forEach((script) => {
      script.remove();
    });
}

function refreshTextNodes() {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT
  );
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const parent = node.parentElement;

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
    node.replaceWith(document.createTextNode(node.textContent || ""));
  }
}

function addMetadata(language: string) {
  document.getElementById("linguise-extra-metadata")?.remove();

  const metadata = document.createElement("script");
  metadata.id = "linguise-extra-metadata";
  metadata.type = "application/json";
  metadata.textContent = JSON.stringify({
    domain: window.btoa("https://www.puzzle-market.com"),
    url: window.btoa(window.location.href),
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

  document.head.appendChild(metadata);
}

export default function LinguiseScript() {
  useEffect(() => {
    const language = getSelectedLanguage();

    if (language === "en") {
      window.localStorage.setItem(languageStorageKey, "en");
      removeLinguiseRuntime();
      document.documentElement.lang = "en";
      return;
    }

    window.localStorage.setItem(languageStorageKey, language);
    addMetadata(language);

    const unlockRoots = () => {
      for (const root of [document.documentElement, document.body]) {
        root.classList.remove("notranslate");
        root.removeAttribute("translate");
        root.removeAttribute("data-no-translation");
        root.removeAttribute("data-linguise-ignore");
      }
    };

    const scheduleRefresh = (delay: number) => {
      window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(refreshTextNodes, {
            timeout: 300,
          });
          return;
        }

        refreshTextNodes();
      }, delay);
    };

    const translatePage = () => {
      unlockRoots();
      refreshTextNodes();
      scheduleRefresh(120);
      scheduleRefresh(500);
      scheduleRefresh(1100);
      window.setTimeout(() => {
        document.documentElement.lang = language;
      }, 350);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="${LINGUISE_SCRIPT_URL}"]`
    );

    if (existing) {
      translatePage();
      return;
    }

    const script = document.createElement("script");
    script.src = LINGUISE_SCRIPT_URL;
    script.async = true;
    script.setAttribute("fetchpriority", "high");
    script.addEventListener("load", translatePage, { once: true });
    document.head.appendChild(script);
  }, []);

  return null;
}
