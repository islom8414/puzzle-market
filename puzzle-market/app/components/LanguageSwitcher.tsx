const primaryDomain =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ||
  "puzzle-market.com";

const languageLinks = [
  {
    code: "en",
    href: `https://${primaryDomain}/`,
  },
  {
    code: "ru",
    href: `https://ru.${primaryDomain}/`,
  },
  {
    code: "ja",
    href: `https://ja.${primaryDomain}/`,
  },
  {
    code: "zh",
    href: `https://zh-cn.${primaryDomain}/`,
  },
];

export default function LanguageSwitcher() {
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
        {languageLinks.map(
          (language) => (
            <a
              key={language.code}
              href={language.href}
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
