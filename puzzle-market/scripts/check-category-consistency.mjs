import fs from "node:fs";

const checks = [
  {
    file: "lib/home-collections.ts",
    patterns: [
      "puzzle_catalog",
      "category",
      "item.category || \"Other\"",
    ],
  },
  {
    file: "lib/marketplace-listings.ts",
    patterns: [
      "puzzle_catalog!inner",
      "category",
      "catalog.category || \"Other\"",
    ],
  },
  {
    file: "lib/puzzle-detail.ts",
    patterns: [
      "puzzle_catalog",
      "category",
      "category?: string | null",
    ],
  },
  {
    file: "app/api/puzzle-market-listings/route.ts",
    patterns: [
      "catalog.category",
      "category:",
      "piece_trades",
      "Collector Resale",
    ],
  },
  {
    file: "lib/marketplace-listings.ts",
    patterns: [
      "piece_trades",
      "tradedPieceIds",
      "Primary Sale",
      "Collector Resale",
      "monthly_growth_percent:",
    ],
  },
  {
    file: "lib/puzzle-detail.ts",
    patterns: [
      "loadPuzzleDetail",
      "available_fragments",
      "piece_trades",
      "Collector Resale",
    ],
  },
  {
    file: "app/puzzle/[id]/page.tsx",
    patterns: [
      "generateMetadata",
      "Digital Collectible",
      "Explore Available Pieces",
      "application/ld+json",
      "loadPuzzleDetail",
      "displayPuzzle",
      "Puzzle Collection",
    ],
  },
  {
    file: "app/marketplace/MarketplaceClient.tsx",
    patterns: [
      "All Sale Types",
      "All Prices",
      "function categoryMatches",
      "function categoryKey",
      "const availableCategories",
      "Browse collectible puzzle fragments available from Puzzle Market and other collectors.",
    ],
  },
  {
    file: "app/components/LandingScrollReset.tsx",
    patterns: [
      "utm_source",
      "scrollRestoration",
      "window.scrollTo(0, 0)",
    ],
  },
  {
    file: "app/page.tsx",
    patterns: ["<LandingScrollReset />"],
  },
  {
    file: "app/login/page.tsx",
    patterns: [
      "Sign in to manage your collection",
      "New to Puzzle Market?",
      "Free registration.",
      "nextPath",
    ],
  },
  {
    file: "app/forgot-password/page.tsx",
    patterns: [
      "If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.",
      "cooldown",
      "resetPasswordForEmail",
    ],
  },
  {
    file: "app/api/purchase-listing/route.ts",
    patterns: [
      "purchase_piece_listing",
      "p_buyer_id",
      "listingId",
    ],
  },
];

const forbiddenChecks = [
  {
    file: "app/marketplace/MarketplaceClient.tsx",
    patterns: [
      "CategoryScroller",
      "Cloud Sync",
      "Status\n",
      "Scheduled Primary Price Adjustment",
      "Why it stands out",
    ],
  },
  {
    file: "app/page.tsx",
    patterns: [
      "Resale and profit are not guaranteed",
      "Is profit guaranteed?",
      "fixed inset-x-0 bottom-0",
    ],
  },
  {
    file: "app/profile/page.tsx",
    patterns: [
      "window.location.href =\n          \"/setup\"",
      "Change username",
    ],
  },
];

for (const check of checks) {
  const source = fs.readFileSync(
    check.file,
    "utf8"
  );

  for (const pattern of check.patterns) {
    if (!source.includes(pattern)) {
      throw new Error(
        `${check.file} is missing ${pattern}`
      );
    }
  }
}

for (const check of forbiddenChecks) {
  const source = fs.readFileSync(
    check.file,
    "utf8"
  );

  for (const pattern of check.patterns) {
    if (source.includes(pattern)) {
      throw new Error(
        `${check.file} still contains forbidden UI text/import: ${pattern}`
      );
    }
  }
}

console.log(
  "Marketplace consistency checks passed."
);
