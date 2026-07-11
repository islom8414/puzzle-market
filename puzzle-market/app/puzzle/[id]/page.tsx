import { loadPuzzleDetail } from "@/lib/puzzle-detail";

import PuzzleClient from "./PuzzleClient";

export const dynamic =
  "force-dynamic";

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialPuzzle =
    await loadPuzzleDetail(id);

  return (
    <PuzzleClient
      initialSlug={id}
      initialCatalogPuzzle={initialPuzzle}
    />
  );
}
