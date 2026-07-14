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
    const delays = [50, 150, 400, 900, 1500];
    const timers = delays.map((delay) =>
      window.setTimeout(resetScroll, delay)
    );

    return () => {
      timers.forEach((timer) => {
        window.clearTimeout(timer);
      });
    };
  }, []);

  return null;
}
