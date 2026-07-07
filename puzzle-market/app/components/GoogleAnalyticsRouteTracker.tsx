"use client";

import { useEffect, useRef } from "react";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import { trackPageView } from "@/lib/analytics";

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
  }, [pathname, searchParams]);

  return null;
}
