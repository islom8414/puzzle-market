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
    ],
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

console.log(
  "Marketplace consistency checks passed."
);
