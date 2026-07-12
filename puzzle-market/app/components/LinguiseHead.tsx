import {
  LINGUISE_PUBLIC_KEY,
  LINGUISE_SCRIPT_URL,
} from "@/lib/linguise";

const earlyScript = `
(() => {
  const publicKey = ${JSON.stringify(LINGUISE_PUBLIC_KEY)};
  const scriptUrl = ${JSON.stringify(LINGUISE_SCRIPT_URL)};
  const storageKey = "puzzle-language";
  const supported = new Set(["en", "ru", "ja", "zh-cn"]);
  const params = new URLSearchParams(window.location.search);
  const queryLanguage = params.get("lang");
  const storedLanguage = window.localStorage.getItem(storageKey);
  const language = supported.has(queryLanguage || "")
    ? queryLanguage
    : supported.has(storedLanguage || "")
      ? storedLanguage
      : "en";

  window.__puzzleLinguiseLanguage = language;

  if (language === "en") {
    document.documentElement.lang = "en";
    return;
  }

  window.localStorage.setItem(storageKey, language);
  document.documentElement.classList.remove("notranslate");
  document.documentElement.removeAttribute("translate");
  document.documentElement.removeAttribute("data-no-translation");
  document.documentElement.removeAttribute("data-linguise-ignore");

  const unlockBody = () => {
    if (!document.body) {
      return;
    }
    document.body.classList.remove("notranslate");
    document.body.removeAttribute("translate");
    document.body.removeAttribute("data-no-translation");
    document.body.removeAttribute("data-linguise-ignore");
  };

  if (document.body) {
    unlockBody();
  } else {
    document.addEventListener("DOMContentLoaded", unlockBody, { once: true });
  }

  document.getElementById("linguise-extra-metadata")?.remove();
  const metadata = document.createElement("script");
  metadata.id = "linguise-extra-metadata";
  metadata.type = "application/json";
  metadata.textContent = JSON.stringify({
    domain: window.btoa("https://www.puzzle-market.com"),
    url: window.btoa(window.location.href),
    language: "en",
    translate_urls: false,
    dynamic_translations: { enabled: true },
    language_settings: null,
    languages: [
      { code: "zh-cn", name: "Chinese", original_name: "Chinese" },
      { code: "ru", name: "Russian", original_name: "Russian" },
      { code: "ja", name: "Japanese", original_name: "Japanese" },
      { code: "en", name: "English", original_name: "English" }
    ],
    current_language: language,
    structure: "subdomains",
    platform: "other",
    debug: false,
    public_key: publicKey,
    rules: [],
    cached_selectors: []
  });
  document.head.appendChild(metadata);

  if (!document.querySelector('script[src^="' + scriptUrl + '"]')) {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.fetchPriority = "high";
    document.head.appendChild(script);
  }
})();
`;

export default function LinguiseHead() {
  return (
    <>
      <link
        rel="preconnect"
        href="https://static.linguise.com"
        crossOrigin=""
      />
      <link
        rel="dns-prefetch"
        href="https://static.linguise.com"
      />
      <link
        rel="preload"
        as="script"
        href={LINGUISE_SCRIPT_URL}
      />
      <script
        id="puzzle-linguise-head-bootstrap"
        className="notranslate"
        translate="no"
        data-no-translation="true"
        data-linguise-ignore="true"
        dangerouslySetInnerHTML={{
          __html: earlyScript,
        }}
      />
    </>
  );
}
