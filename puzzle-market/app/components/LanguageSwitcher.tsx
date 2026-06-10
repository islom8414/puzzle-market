"use client";

import { usePathname } from "next/navigation";
import {
  useState,
  type MouseEvent,
} from "react";

import { apiFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

const primaryDomain =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ||
  "puzzle-market.com";

const languages = [
  {
    code: "en",
    host: primaryDomain,
  },
  {
    code: "ru",
    host: `ru.${primaryDomain}`,
  },
  {
    code: "ja",
    host: `ja.${primaryDomain}`,
  },
  {
    code: "zh",
    host: `zh-cn.${primaryDomain}`,
  },
];

export default function LanguageSwitcher() {
  const path =
    usePathname() || "/";
  const [switchingTo, setSwitchingTo] =
    useState<string | null>(null);

  async function switchLanguage(
    event: MouseEvent<HTMLAnchorElement>,
    targetHost: string
  ) {
    event.preventDefault();

    const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const targetUrl = `https://${targetHost}${nextPath}`;

    if (
      window.location.hostname ===
        targetHost ||
      switchingTo
    ) {
      return;
    }

    setSwitchingTo(targetHost);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.assign(targetUrl);
        return;
      }

      const response = await apiFetch(
        "/api/auth/language-bridge",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            refreshToken:
              session.refresh_token,
            targetHost,
            nextPath,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not transfer session"
        );
      }

      const data = (await response.json()) as {
        token: string;
      };

      const bridgeUrl = new URL(
        `https://${targetHost}/auth/language`
      );
      bridgeUrl.hash = new URLSearchParams({
        token: data.token,
      }).toString();

      window.location.assign(
        bridgeUrl.toString()
      );
    } catch {
      setSwitchingTo(null);
    }
  }

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
        {languages.map(
          (language) => (
            <a
              key={language.code}
              href={`https://${language.host}${path}`}
              onClick={(event) =>
                switchLanguage(
                  event,
                  language.host
                )
              }
              className={`language-switcher-option language-switcher-option-${language.code}`}
              translate="no"
              data-no-translation="true"
              data-linguise-ignore="true"
              aria-label={language.code}
              aria-busy={
                switchingTo ===
                language.host
              }
            />
          )
        )}
      </div>
    </details>
  );
}
