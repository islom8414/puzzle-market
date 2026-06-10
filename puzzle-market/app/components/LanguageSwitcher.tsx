"use client";

import { usePathname } from "next/navigation";
import {
  useEffect,
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
  const [restoring, setRestoring] =
    useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(
      window.location.hash.slice(1)
    );
    const token = hash.get(
      "pm-language-token"
    );

    if (!token) {
      return;
    }

    let active = true;

    async function restoreSession() {
      try {
        await Promise.resolve();

        if (active) {
          setRestoring(true);
        }

        const response = await apiFetch(
          "/api/auth/language-bridge",
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              token,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            "Language session expired"
          );
        }

        const data = (await response.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        const { error } =
          await supabase.auth.setSession({
            access_token:
              data.accessToken,
            refresh_token:
              data.refreshToken,
          });

        if (error) {
          throw error;
        }

        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.location.replace(cleanUrl);
      } catch {
        if (active) {
          setRestoring(false);
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`
          );
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

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
        targetUrl
      );
      bridgeUrl.hash = new URLSearchParams({
        "pm-language-token":
          data.token,
      }).toString();

      window.location.assign(
        bridgeUrl.toString()
      );
    } catch {
      setSwitchingTo(null);
    }
  }

  return (
    <>
      {(restoring || switchingTo) && (
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
