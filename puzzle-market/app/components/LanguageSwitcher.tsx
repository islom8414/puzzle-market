"use client";

import { usePathname } from "next/navigation";
import {
  useState,
  type MouseEvent,
} from "react";

import { supabase } from "@/lib/supabase";

const primaryDomain =
  process.env.NEXT_PUBLIC_PRIMARY_DOMAIN ||
  "puzzle-market.com";
const primaryHost =
  primaryDomain.startsWith("www.")
    ? primaryDomain
    : `www.${primaryDomain}`;

const languages = [
  {
    code: "en",
    host: primaryHost,
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

      if (session) {
        await supabase.auth.refreshSession();
      }

      window.location.assign(
        targetUrl
      );
    } catch {
      window.location.assign(
        targetUrl
      );
    }
  }

  return (
    <>
      {switchingTo && (
        <div
          className="notranslate fixed inset-0 z-[300] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          translate="no"
          data-no-translation="true"
          data-linguise-ignore="true"
        >
          <div className="rounded-2xl border border-cyan-400/30 bg-zinc-950 px-8 py-6 text-center shadow-2xl">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-cyan-400" />
            <p className="mt-4 font-black text-white">
              Switching language...
            </p>
          </div>
        </div>
      )}

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
    </>
  );
}
