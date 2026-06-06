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

export const BRAND_CATEGORIES = [
  "Automotive",
  "Beauty",
  "Electronics",
  "Entertainment",
  "Fashion",
  "Food & Drink",
  "Gaming",
  "Sports",
  "Technology",
  "Travel",
] as const;

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

  return BRAND_CATEGORIES.includes(
    normalized as (typeof BRAND_CATEGORIES)[number]
  )
    ? normalized
    : null;
}
