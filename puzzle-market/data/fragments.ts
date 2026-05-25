export type FragmentSeed = {
  id: number;
  slug: string;
  piece: number;
  title: string;
  image: string;
  owner: string;
  rarity: string;
  listed: boolean;
  price: number;
};

export const fragments: FragmentSeed[] = [];
