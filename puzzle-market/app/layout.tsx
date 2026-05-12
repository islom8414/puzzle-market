import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import ConditionalNavbar from "./components/ConditionalNavbar";
import LiveFeed from "./components/LiveFeed";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Puzzle Market",
  description: "Premium Puzzle Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >

      <body className="bg-black text-white min-h-screen overflow-x-hidden antialiased">

        {/* GLOBAL BACKGROUND */}

        <div className="fixed inset-0 -z-10 overflow-hidden">

          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyan-500/10 blur-3xl rounded-full"></div>

          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 blur-3xl rounded-full"></div>

        </div>

        {/* NAVBAR */}

        <ConditionalNavbar />

        {/* LIVE FEED */}

        <LiveFeed />

        {/* PAGE */}

        <main className="relative z-10">
          {children}
        </main>

      </body>

    </html>
  );
}