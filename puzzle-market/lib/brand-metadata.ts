export const BRAND_COUNTRIES = [
  { code: "UZ", label: "Uzbekistan" },
  { code: "US", label: "United States" },
  { code: "JP", label: "Japan" },
  { code: "CN", label: "China" },
  { code: "KR", label: "South Korea" },
  { code: "KZ", label: "Kazakhstan" },
  { code: "IN", label: "India" },
  { code: "GB", label: "United Kingdom" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "TR", label: "Turkey" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SG", label: "Singapore" },
  { code: "GLOBAL", label: "Global / Multiple countries" },
  { code: "OTHER", label: "Other country" },
] as const;

export const PUZZLE_CATEGORIES = [
  "Actors",
  "Animals",
  "Anime",
  "Art",
  "Automotive",
  "Baseball",
  "Basketball",
  "Beauty",
  "Bloggers",
  "Cars",
  "Cartoons",
  "Celebrities",
  "Cities",
  "Electronics",
  "Entertainment",
  "Fashion",
  "Food & Drink",
  "Football",
  "Flowers",
  "Gaming",
  "History",
  "Landmarks",
  "Movies",
  "Mountains",
  "Music",
  "Nature",
  "Photography",
  "Singers",
  "Space",
  "Sports",
  "Technology",
  "Travel",
  "Watches",
  "Other",
] as const;

export const BRAND_CATEGORIES = PUZZLE_CATEGORIES;

export function normalizeBrandName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80);
}

export function normalizeBrandCountry(value: string) {
  const normalized = value.trim().toUpperCase();

  return normalized === "GLOBAL" ||
    /^[A-Z]{2}$/.test(normalized)
    ? normalized
    : null;
}

export function normalizeBrandCategory(value: string) {
  const normalized = value.trim();

  return PUZZLE_CATEGORIES.includes(
    normalized as (typeof PUZZLE_CATEGORIES)[number]
  )
    ? normalized
    : null;
}
