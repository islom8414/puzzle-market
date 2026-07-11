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
      "Collector Resale",
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
  "Category consistency checks passed."
);
