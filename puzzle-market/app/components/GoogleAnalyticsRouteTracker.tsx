"use client";

import { useEffect, useRef } from "react";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  captureCampaignAttribution,
  sendGAEvent,
  trackPageView,
} from "@/lib/analytics";

export default function GoogleAnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didMount = useRef(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (!didMount.current) {
      didMount.current = true;
      captureCampaignAttribution();
      sendGAEvent("landing_view", {
        page_path:
          window.location.pathname +
          window.location.search,
        page_title: document.title,
      });
      return;
    }

    const queryString =
      searchParams.toString();
    const pagePath = queryString
      ? `${pathname}?${queryString}`
      : pathname;

    trackPageView(
      pagePath,
      document.title
    );
    sendGAEvent("view_page", {
      page_path: pagePath,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}
