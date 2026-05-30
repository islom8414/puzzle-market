export type CatalogPuzzle = {
  id: string;
  slug: string;
  title: string;
  image_url: string;
  rows: number;
  columns: number;
  missing_piece_count: number;
  created_at?: string;
};

export function catalogToCard(
  puzzle: CatalogPuzzle
) {
  const total =
    puzzle.rows * puzzle.columns;

  return {
    slug: puzzle.slug,
    title: puzzle.title,
    image: puzzle.image_url,
    pieces: `${puzzle.missing_piece_count} / ${total}`,
    rows: puzzle.rows,
    columns: puzzle.columns,
  };
}
