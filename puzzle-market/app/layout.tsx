import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Suspense } from "react";

import "./globals.css";

import ConditionalNavbar from "./components/ConditionalNavbar";
import EnableDynamicTranslation from "./components/EnableDynamicTranslation";
import GoogleAnalyticsRouteTracker from "./components/GoogleAnalyticsRouteTracker";
import LanguagePrompt from "./components/LanguagePrompt";
import LaunchOfferBanner from "./components/LaunchOfferBanner";
import LiveFeed from "./components/LiveFeed";
import LinguiseHead from "./components/LinguiseHead";
import LinguiseScript from "./components/LinguiseScript";
import OriginalPathGuard from "./components/OriginalPathGuard";
import SubscriptionGate from "./components/SubscriptionGate";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.puzzle-market.com"),
  title: "Puzzle Market — Buy, Own & Trade Collectible Puzzle Fragments",
  description:
    "Discover limited puzzle fragments, track verified ownership and trade with collectors on Puzzle Market.",
  alternates: {
    canonical: "https://www.puzzle-market.com",
  },
  openGraph: {
    title: "Puzzle Market — Buy, Own & Trade Collectible Puzzle Fragments",
    description:
      "Discover limited puzzle fragments, track verified ownership and trade with collectors on Puzzle Market.",
    url: "https://www.puzzle-market.com",
    siteName: "Puzzle Market",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Puzzle Market — Buy, Own & Trade Collectible Puzzle Fragments",
    description:
      "Discover limited puzzle fragments, track verified ownership and trade with collectors on Puzzle Market.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark notranslate"
      translate="no"
      data-no-translation="true"
      data-linguise-ignore="true"
      suppressHydrationWarning
    >
      <head>
        <LinguiseHead />
        <OriginalPathGuard />
      </head>

      <body
        className="notranslate bg-black text-white min-h-screen overflow-x-hidden antialiased"
        translate="no"
        data-no-translation="true"
        data-linguise-ignore="true"
        suppressHydrationWarning
      >
        <EnableDynamicTranslation />

        {/* GLOBAL BACKGROUND */}

        <div className="fixed inset-0 -z-10 overflow-hidden">

          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full"></div>

          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-3xl rounded-full"></div>

        </div>

        {/* NAVBAR */}

        <ConditionalNavbar />
        <LaunchOfferBanner />

        <LanguagePrompt />

        {/* LIVE FEED */}

        <LiveFeed />

        <LinguiseScript />

        <SubscriptionGate />

        {/* PAGE */}

        <main className="relative z-10">
          {children}
        </main>

        <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />
        <Suspense fallback={null}>
          <GoogleAnalyticsRouteTracker />
        </Suspense>
      </body>
    </html>
  );
}
