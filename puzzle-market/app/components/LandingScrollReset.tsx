"use client";

import { useEffect } from "react";

const campaignKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
];

export default function LandingScrollReset() {
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );
    const isCampaignVisit = campaignKeys.some(
      (key) => params.has(key)
    );

    if (!isCampaignVisit || window.location.hash) {
      return;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      window.scrollTo(0, 0);
    };

    resetScroll();
    const shortDelay = window.setTimeout(resetScroll, 100);
    const renderDelay = window.setTimeout(resetScroll, 600);

    return () => {
      window.clearTimeout(shortDelay);
      window.clearTimeout(renderDelay);
    };
  }, []);

  return null;
}
