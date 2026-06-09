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
  "Animals",
  "Anime",
  "Art",
  "Baseball",
  "Cars",
  "Fashion",
  "Food & Drink",
  "Football",
  "Flowers",
  "Gaming",
  "Golf",
  "Landmarks",
  "Movies",
  "Mountains",
  "Music",
  "Nature",
  "Space",
  "Sports",
  "Technology",
  "Travel",
  "Watches",
  "Other",
] as const;

export const BRAND_CATEGORIES = PUZZLE_CATEGORIES;

const CATEGORY_ALIASES: Record<string, (typeof PUZZLE_CATEGORIES)[number]> = {
  actors: "Movies",
  automotive: "Cars",
  baseball: "Baseball",
  basketball: "Sports",
  beauty: "Fashion",
  bloggers: "Other",
  cartoons: "Movies",
  celebration: "Other",
  celebrations: "Other",
  celebrities: "Movies",
  cities: "Travel",
  electronics: "Technology",
  entertainment: "Movies",
  football: "Football",
  golf: "Golf",
  history: "Landmarks",
  photography: "Art",
  singers: "Music",
};

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

export function normalizePuzzleCategory(value: string | null | undefined) {
  const normalized = value?.trim() || "";
  const direct = PUZZLE_CATEGORIES.find(
    (category) => category.toLowerCase() === normalized.toLowerCase()
  );

  if (direct) {
    return direct;
  }

  return CATEGORY_ALIASES[normalized.toLowerCase()] || "Other";
}

export function normalizeBrandCategory(value: string) {
  if (!value.trim()) {
    return null;
  }

  return normalizePuzzleCategory(value);
}
