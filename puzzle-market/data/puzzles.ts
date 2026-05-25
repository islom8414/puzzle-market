export type PuzzleSeed = {
  id: number;
  slug: string;
  title: string;
  image: string;
  price: number;
  owner: string;
  rarity: string;
  category: string;
  pieces: string;
  views: string;
  likes: string;
  description: string;
};

export const puzzles: PuzzleSeed[] = [];
