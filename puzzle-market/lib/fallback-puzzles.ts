import type { CatalogPuzzle } from "@/lib/puzzle-catalog";

export const fallbackPuzzles: CatalogPuzzle[] = [
  {
    id: "starter-castle",
    slug: "starter-castle",
    title: "Castle Vault",
    image_url: "/castle.jpg",
    rows: 5,
    columns: 5,
    missing_piece_count: 1,
    missing_piece_index: 7,
    rarity: "Legendary",
    category: "Landmarks",
  },
  {
    id: "starter-sunset",
    slug: "starter-sunset",
    title: "Sunset Fragment",
    image_url: "/sunset.jpg",
    rows: 5,
    columns: 5,
    missing_piece_count: 1,
    missing_piece_index: 12,
    rarity: "Rare",
    category: "Nature",
  },
  {
    id: "starter-gallery",
    slug: "starter-gallery",
    title: "Collector Gallery",
    image_url: "/image.jpg",
    rows: 5,
    columns: 5,
    missing_piece_count: 1,
    missing_piece_index: 18,
    rarity: "Epic",
    category: "Art",
  },
];

export function findFallbackPuzzle(slug: string) {
  return fallbackPuzzles.find(
    (puzzle) => puzzle.slug === slug || puzzle.id === slug
  );
}
