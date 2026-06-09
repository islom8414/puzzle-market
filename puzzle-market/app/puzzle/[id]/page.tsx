"use client";

/* eslint-disable react-hooks/immutability, react-hooks/exhaustive-deps */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { puzzles } from "@/data/puzzles";
import { apiFetch } from "@/lib/api-client";
import { normalizePuzzleCategory } from "@/lib/brand-metadata";
import { fetchMyProfile } from "@/lib/client-profile";
import { CHOOSE_PUZZLE_HREF } from "@/lib/site-links";
import { supabase } from "@/lib/supabase";

type Selection =
  | {
      source: "tray";
      piece: number;
    }
  | {
      source: "board";
      cell: number;
      piece: number;
    };

type SavedProgress = {
  board: Array<number | null>;
  tray: number[];
  totalPieces: number;
};

function normalizeProgress(
  board: Array<number | null>,
  tray: number[],
  totalPieces: number,
  lockedCells: number[]
) {
  const lockedSet =
    new Set(lockedCells);

  const nextBoard =
    Array.from(
      { length: totalPieces },
      (_, cell) => {
        if (lockedSet.has(cell)) {
          return null;
        }

        const piece =
          board[cell] ?? null;

        if (
          piece !== null &&
          lockedSet.has(piece)
        ) {
          return null;
        }

        return piece;
      }
    );

  const onBoard =
    new Set(
      nextBoard.filter(
        (
          piece
        ): piece is number =>
          piece !== null
      )
    );

  const nextTray =
    tray.filter(
      (piece) =>
        !lockedSet.has(piece) &&
        !onBoard.has(piece)
    );

  for (
    let piece = 0;
    piece < totalPieces;
    piece += 1
  ) {
    if (
      lockedSet.has(piece) ||
      onBoard.has(piece) ||
      nextTray.includes(piece)
    ) {
      continue;
    }

    nextTray.push(piece);
  }

  return {
    board: nextBoard,
    tray: nextTray,
  };
}

function readSavedProgress(
  storageKey: string,
  totalPieces: number
) {
  const saved =
    localStorage.getItem(storageKey);

  if (!saved) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(saved) as SavedProgress;

    if (
      parsed.totalPieces !==
        totalPieces ||
      parsed.board?.length !==
        totalPieces ||
      !Array.isArray(parsed.tray)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

type CatalogPuzzle = {
  title: string;
  image_url: string;
  rows: number;
  columns: number;
  missing_piece_index: number | null;
  rarity: string | null;
  brand_name?: string | null;
  brand_country_code?: string | null;
  category?: string | null;
};

type PlayPrompt =
  | "login"
  | "profile"
  | "subscription"
  | null;

const defaultRows = 5;
const defaultColumns = 5;
const defaultPieceSize = 66;

function getMissingIndexes(
  puzzleId: number,
  totalPieces: number
) {
  const first =
    (puzzleId * 7) %
    totalPieces;

  const second =
    (first + 11) %
    totalPieces;

  return puzzleId % 2 === 0
    ? [first, second]
    : [first];
}

function shuffledPieces(
  totalPieces: number
) {
  return Array.from(
    {
      length: totalPieces,
    },
    (_, index) => index
  ).sort(
    (a, b) =>
      ((a * 17 + 9) %
        totalPieces) -
      ((b * 17 + 9) %
        totalPieces)
  );
}

function pieceStyle(
  image: string,
  piece: number,
  rows: number,
  columns: number,
  pieceSize: number
) {
  const col =
    piece % columns;

  const row =
    Math.floor(piece / columns);

  return {
    width: pieceSize,
    height: pieceSize,
    backgroundImage:
      `url(${image})`,
    backgroundSize:
      `${columns * pieceSize}px ${rows * pieceSize}px`,
    backgroundPosition:
      `-${col * pieceSize}px -${row * pieceSize}px`,
  };
}

export default function PuzzlePage() {
  const params =
    useParams();

  const slug =
    String(params.id);

  const [catalogPuzzle, setCatalogPuzzle] =
    useState<CatalogPuzzle | null>(null);

  const [catalogLoading, setCatalogLoading] =
    useState(true);

  const [playUnlocked, setPlayUnlocked] =
    useState(false);

  const [playPrompt, setPlayPrompt] =
    useState<PlayPrompt>(null);

  const [checkingAccess, setCheckingAccess] =
    useState(false);

  useEffect(() => {
    async function loadCatalog() {
      setCatalogLoading(true);
      setOwnershipReady(false);
      setOwnedMissingCount(0);
      setProgressReady(false);
      hydratedSlugRef.current = null;
      previousLockedRef.current = [];

      try {
        const response =
          await apiFetch(
            `/api/puzzle/${encodeURIComponent(slug)}`
          );

        const payload =
          (await response.json()) as {
            puzzle?: CatalogPuzzle;
          };

        if (response.ok && payload.puzzle) {
          setCatalogPuzzle(payload.puzzle);
        } else {
          setCatalogPuzzle(null);
        }
      } catch {
        setCatalogPuzzle(null);
      } finally {
        setCatalogLoading(false);
      }
    }

    loadCatalog();
  }, [slug]);

  const foundPuzzle =
    puzzles.find(
      (item) =>
        item.slug === slug ||
        String(item.id) === slug
    );

  const rows =
    catalogPuzzle?.rows || defaultRows;

  const columns =
    catalogPuzzle?.columns ||
    defaultColumns;

  const totalPieces =
    rows * columns;

  const [pieceSize, setPieceSize] =
    useState(defaultPieceSize);

  useEffect(() => {
    function updatePieceSize() {
      const sidePadding = 48;
      const maxBoardWidth =
        Math.min(
          window.innerWidth - sidePadding,
          420
        );
      const nextSize =
        Math.floor(
          maxBoardWidth / columns
        );

      setPieceSize(
        Math.max(
          44,
          Math.min(
            defaultPieceSize,
            nextSize
          )
        )
      );
    }

    updatePieceSize();
    window.addEventListener(
      "resize",
      updatePieceSize
    );

    return () => {
      window.removeEventListener(
        "resize",
        updatePieceSize
      );
    };
  }, [columns]);

  const puzzle =
    catalogPuzzle
      ? {
          id: 1,
          slug,
          title: catalogPuzzle.title,
          image:
            catalogPuzzle.image_url,
          price: 0,
          owner: "Puzzle Market Vault",
          rarity:
            catalogPuzzle.rarity ||
            "Rare",
          category:
            normalizePuzzleCategory(
              catalogPuzzle.category
            ),
          pieces: `${totalPieces} / ${totalPieces}`,
          views: "0",
          likes: "0",
          description:
            "Official uploaded puzzle collection.",
        }
      : foundPuzzle || {
          id: 0,
          slug,
          title: "Puzzle Not Available",
          image: "",
          price: 0,
          owner: "Puzzle Market Vault",
          rarity: "PRIVATE",
          category: "private",
          pieces: "0 / 0",
          views: "0",
          likes: "0",
          description:
            "This puzzle was not found in the catalog.",
        };

  const missingIndexes =
    useMemo(() => {
      if (catalogPuzzle) {
        const missingIndex =
          catalogPuzzle.missing_piece_index ??
          0;

        return [missingIndex];
      }

      return getMissingIndexes(
        Number(puzzle.id),
        totalPieces
      );
    }, [
      catalogPuzzle,
      puzzle.id,
      totalPieces,
    ]);

  const storageKey =
    `puzzle-progress-${slug}`;

  const [board, setBoard] =
    useState<Array<number | null>>(
      []
    );

  const [tray, setTray] =
    useState<number[]>([]);

  const [progressReady, setProgressReady] =
    useState(false);

  const hydratedSlugRef =
    useRef<string | null>(null);

  const previousLockedRef =
    useRef<number[]>([]);

  const [selected, setSelected] =
    useState<Selection | null>(
      null
    );

  const [ownedMissingCount, setOwnedMissingCount] =
    useState(0);

  const [ownershipReady, setOwnershipReady] =
    useState(false);

  useEffect(() => {
    async function loadOwnership() {
      setOwnershipReady(false);

      try {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth
            .getUser();

        if (!user) {
          setOwnedMissingCount(0);
          return;
        }

        let exactOwnedCount = 0;

        const {
          data: catalog,
        } =
          await supabase
            .from(
              "puzzle_catalog"
            )
            .select("id")
            .eq(
              "slug",
              slug
            )
            .maybeSingle();

        if (catalog) {
          const {
            data: pieces,
          } =
            await supabase
              .from(
                "puzzle_pieces"
              )
              .select("id,piece_index")
              .eq(
                "puzzle_id",
                catalog.id
              )
              .in(
                "piece_index",
                missingIndexes
              );

          const pieceIds =
            pieces?.map(
              (piece) => piece.id
            ) || [];

          if (pieceIds.length > 0) {
            const {
              data: ownership,
            } =
              await supabase
                .from(
                  "piece_ownership"
                )
                .select("piece_id")
                .in(
                  "piece_id",
                  pieceIds
                )
                .eq(
                  "owner_user_id",
                  user.id
                );

            exactOwnedCount =
              ownership?.length || 0;
          }
        }

        setOwnedMissingCount(
          Math.min(
            exactOwnedCount,
            missingIndexes.length
          )
        );
      } finally {
        setOwnershipReady(true);
      }
    }

    if (!catalogLoading) {
      loadOwnership();
    }
  }, [
    slug,
    catalogLoading,
    missingIndexes.join(","),
  ]);

  const lockedMissingIndexes =
    missingIndexes.slice(
      ownedMissingCount
    );

  const lockedKey =
    lockedMissingIndexes.join(",");

  const hasPlayablePuzzle =
    !!foundPuzzle || !!catalogPuzzle;

  useEffect(() => {
    if (catalogLoading) {
      return;
    }

    if (!hasPlayablePuzzle || totalPieces < 1) {
      return;
    }

    if (
      catalogPuzzle &&
      !ownershipReady
    ) {
      return;
    }

    if (hydratedSlugRef.current === slug) {
      return;
    }

    hydratedSlugRef.current = slug;

    const saved =
      readSavedProgress(
        storageKey,
        totalPieces
      );

    const freshTray =
      shuffledPieces(totalPieces).filter(
        (piece) =>
          !lockedMissingIndexes.includes(
            piece
          )
      );

    const base =
      saved
        ? normalizeProgress(
            saved.board,
            saved.tray,
            totalPieces,
            lockedMissingIndexes
          )
        : normalizeProgress(
            Array(totalPieces).fill(
              null
            ),
            freshTray,
            totalPieces,
            lockedMissingIndexes
          );

    setBoard(base.board);
    setTray(base.tray);
    previousLockedRef.current =
      [...lockedMissingIndexes];
    setProgressReady(true);
  }, [
    slug,
    catalogLoading,
    ownershipReady,
    hasPlayablePuzzle,
    totalPieces,
    storageKey,
    lockedKey,
    catalogPuzzle,
  ]);

  useEffect(() => {
    if (!progressReady) {
      return;
    }

    const previous =
      previousLockedRef.current;

    const currentSet =
      new Set(lockedMissingIndexes);

    const unlockedCells =
      previous.filter(
        (cell) =>
          !currentSet.has(cell)
      );

    if (unlockedCells.length === 0) {
      previousLockedRef.current =
        [...lockedMissingIndexes];
      return;
    }

    setBoard((currentBoard) => {
      const nextBoard =
        [...currentBoard];

      for (const cell of unlockedCells) {
        nextBoard[cell] = null;
      }

      const onBoard =
        new Set(
          nextBoard.filter(
            (
              piece
            ): piece is number =>
              piece !== null
          )
        );

      setTray((currentTray) => {
        const nextTray =
          currentTray.filter(
            (piece) =>
              !unlockedCells.includes(
                piece
              )
          );

        for (const cell of unlockedCells) {
          if (
            !onBoard.has(cell) &&
            !nextTray.includes(cell)
          ) {
            nextTray.push(cell);
          }
        }

        return nextTray;
      });

      return nextBoard;
    });

    previousLockedRef.current =
      [...lockedMissingIndexes];
  }, [lockedKey, progressReady]);

  useEffect(() => {
    if (!progressReady) {
      return;
    }

    const payload: SavedProgress = {
      board,
      tray,
      totalPieces,
    };

    localStorage.setItem(
      storageKey,
      JSON.stringify(payload)
    );
  }, [
    board,
    tray,
    storageKey,
    totalPieces,
    progressReady,
  ]);

  const solvedCount =
    board.filter(
      (piece, cell) =>
        piece === cell
    ).length;

  const targetCount =
    totalPieces -
    lockedMissingIndexes.length;

  function resetPuzzle() {
    localStorage.removeItem(
      storageKey
    );

    setBoard(
      Array(totalPieces).fill(null)
    );

    setTray(
      shuffledPieces(totalPieces).filter(
        (piece) =>
          !lockedMissingIndexes.includes(
            piece
          )
      )
    );

    setSelected(null);
  }

  async function requestPlayAccess() {
    setCheckingAccess(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPlayPrompt("login");
        return;
      }

      const profile =
        await fetchMyProfile();

      if (!profile?.profileComplete) {
        setPlayPrompt("profile");
        return;
      }

      if (!profile.hasActiveSubscription) {
        setPlayPrompt("subscription");
        return;
      }

      setPlayPrompt(null);
      setPlayUnlocked(true);
    } finally {
      setCheckingAccess(false);
    }
  }

  function selectTrayPiece(
    piece: number
  ) {
    setSelected({
      source: "tray",
      piece,
    });
  }

  function selectBoardCell(
    cell: number
  ) {
    const cellPiece =
      board[cell];

    if (
      lockedMissingIndexes.includes(
        cell
      )
    ) {
      return;
    }

    if (!selected) {
      if (cellPiece !== null) {
        setSelected({
          source: "board",
          cell,
          piece: cellPiece,
        });
      }

      return;
    }

    if (selected.source === "tray") {
      setBoard((current) => {
        const next = [...current];
        next[cell] = selected.piece;
        return next;
      });

      setTray((current) => {
        const next =
          current.filter(
            (piece) =>
              piece !==
              selected.piece
          );

        if (cellPiece !== null) {
          next.push(cellPiece);
        }

        return next;
      });
    }

    if (selected.source === "board") {
      setBoard((current) => {
        const next = [...current];
        next[selected.cell] =
          cellPiece;
        next[cell] =
          selected.piece;
        return next;
      });
    }

    setSelected(null);
  }

  function removeFromBoard(
    cell: number
  ) {
    const cellPiece =
      board[cell];

    if (cellPiece === null) {
      return;
    }

    setBoard((current) => {
      const next = [...current];
      next[cell] = null;
      return next;
    });

    setTray((current) => [
      ...current,
      cellPiece,
    ]);

    setSelected(null);
  }

  if (
    catalogLoading ||
    ((!!foundPuzzle || !!catalogPuzzle) &&
      puzzle.image &&
      !progressReady)
  ) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading puzzle board...
      </main>
    );
  }

  if (!hasPlayablePuzzle || !puzzle.image) {
    return (
      <main className="min-h-screen bg-black text-white px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-zinc-950 p-8">
          <Link
            href={CHOOSE_PUZZLE_HREF}
            className="text-cyan-400 font-black"
          >
            Choose A Puzzle
          </Link>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
            Puzzle Board
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Puzzle not found
          </h1>

          <p className="mt-4 text-zinc-400">
            This puzzle is not in the catalog yet. Choose another collection on the homepage.
          </p>

          <Link
            href={CHOOSE_PUZZLE_HREF}
            className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-8 py-4 font-black text-black"
          >
            Choose A Puzzle
          </Link>
        </div>
      </main>
    );
  }

  if (!playUnlocked) {
    const promptCopy =
      playPrompt === "login"
        ? {
            title: "Sign in to start playing",
            body: "You can browse every puzzle for free. Sign in when you are ready to assemble this one.",
            href: `/login?next=${encodeURIComponent(`/puzzle/${slug}`)}`,
            action: "Sign in",
          }
        : playPrompt === "profile"
          ? {
              title: "Finish your collector profile",
              body: "Choose your public username before starting your first puzzle.",
              href: "/setup",
              action: "Finish profile",
            }
          : {
              title: "Starter unlocks puzzle play",
              body: "Keep browsing for free. Starter is only required when you begin assembling, buying, or reselling pieces.",
              href: "/subscribe",
              action: "View Starter",
            };

    return (
      <main className="min-h-[calc(100svh-4rem)] bg-black px-4 py-8 text-white md:px-6 md:py-12">
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-5">
          <Link
            href={CHOOSE_PUZZLE_HREF}
            className="inline-flex w-fit rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-black transition hover:border-cyan-400"
          >
            Browse Puzzles
          </Link>

          <div className="grid w-full overflow-hidden rounded-[24px] border border-white/10 bg-zinc-950 shadow-2xl lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <div className="relative aspect-[16/10] min-h-[280px] bg-black lg:aspect-auto lg:min-h-[560px]">
              <img
                src={puzzle.image}
                alt={puzzle.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-black/10 lg:to-zinc-950/70" />
            </div>

            <div className="flex min-h-[360px] flex-col justify-center p-6 sm:p-9 lg:p-12">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                Puzzle Preview
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                {puzzle.title}
              </h1>

              <p className="mt-4 text-zinc-400">
                {puzzle.rarity} collection / {rows} x {columns} board / one hidden market piece
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
                  {puzzle.category}
                </span>

                {catalogPuzzle?.brand_name && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-zinc-200">
                    {catalogPuzzle.brand_name}
                    {catalogPuzzle.brand_country_code
                      ? ` / ${catalogPuzzle.brand_country_code}`
                      : ""}
                  </span>
                )}
              </div>

              <p className="mt-6 leading-relaxed text-zinc-300">
                Look through the artwork first. Your subscription is checked only when you decide to start assembling it.
              </p>

              <button
                type="button"
                onClick={requestPlayAccess}
                disabled={checkingAccess}
                className="mt-8 flex min-h-14 w-full items-center justify-center rounded-2xl bg-cyan-400 px-6 py-4 text-lg font-black text-black transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {checkingAccess
                  ? "Checking access..."
                  : "Start Playing"}
              </button>

              <Link
                href={`/marketplace?puzzle=${encodeURIComponent(slug)}`}
                className="mt-3 flex min-h-12 items-center justify-center rounded-2xl border border-white/10 px-5 py-3 font-black text-zinc-200 transition hover:border-cyan-400"
              >
                View Missing Pieces
              </Link>
            </div>
          </div>
        </section>

        {playPrompt && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-md">
            <section className="w-full max-w-md rounded-[24px] border border-cyan-400/25 bg-zinc-950 p-6 shadow-2xl sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">
                Ready When You Are
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight">
                {promptCopy.title}
              </h2>

              <p className="mt-4 leading-relaxed text-zinc-400">
                {promptCopy.body}
              </p>

              <a
                href={promptCopy.href}
                className="mt-7 flex min-h-13 w-full items-center justify-center rounded-2xl bg-cyan-400 px-5 py-4 font-black text-black"
              >
                {promptCopy.action}
              </a>

              <button
                type="button"
                onClick={() => setPlayPrompt(null)}
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/10 px-5 py-3 font-black"
              >
                Keep Browsing
              </button>
            </section>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-3 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
          <div>
            <Link
              href={CHOOSE_PUZZLE_HREF}
              className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 font-black text-black"
            >
              Choose A Puzzle
            </Link>

            <p className="text-cyan-400 text-xs tracking-[0.3em] uppercase font-black mt-6">
              Assemble The Puzzle
            </p>

            <h1 className="text-4xl md:text-6xl font-black mt-2 leading-none">
              {puzzle.title}
            </h1>

            <p className="text-zinc-400 mt-3 max-w-2xl">
              Place all pieces on the board. One cell stays missing — buy that exact fragment on the marketplace to complete the image.
            </p>
          </div>

          <button
            onClick={resetPuzzle}
            className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl font-black"
          >
            Shuffle
          </button>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
          <aside className="bg-white/[0.03] border border-white/10 rounded-[28px] p-5">
            <p className="text-cyan-400 text-xs tracking-[0.3em] uppercase font-black">
              Puzzle Status
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">
                  Correct
                </p>
                <h2 className="text-3xl font-black text-cyan-400 mt-2">
                  {solvedCount}/{targetCount}
                </h2>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">
                  Missing
                </p>
                <h2 className="text-3xl font-black text-yellow-300 mt-2">
                  {lockedMissingIndexes.length}
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-zinc-400 text-sm leading-relaxed">
                The final image is hidden. Your progress is saved on this device, so returning after purchase keeps your board.
              </p>
            </div>

            {lockedMissingIndexes.length > 0 && (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-zinc-400">
                  Missing piece #{lockedMissingIndexes[0] + 1} is marked in red on the board.
                </p>

                <Link
                  href={`/marketplace?puzzle=${encodeURIComponent(puzzle.slug)}&piece=${lockedMissingIndexes[0]}`}
                  className="flex justify-center bg-green-400 text-black font-black py-4 rounded-2xl"
                >
                  Buy Missing Piece
                </Link>
              </div>
            )}
          </aside>

          <section className="bg-white/[0.03] border border-white/10 rounded-[28px] p-4 md:p-5 overflow-x-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5 items-start min-w-0">
              <div
                className="grid rounded-2xl border border-white/10 bg-black/50 overflow-hidden mx-auto lg:mx-0"
                style={{
                  gridTemplateColumns:
                    `repeat(${columns}, ${pieceSize}px)`,
                  width:
                    columns * pieceSize,
                }}
              >
                {Array.from({
                  length: totalPieces,
                }).map((_, cell) => {
                  const piece =
                    board[cell];

                  const locked =
                    lockedMissingIndexes.includes(
                      cell
                    );

                  const correct =
                    piece === cell;

                  const selectedCell =
                    selected?.source ===
                      "board" &&
                    selected.cell === cell;

                  return (
                    <button
                      key={cell}
                      onClick={() =>
                        selectBoardCell(cell)
                      }
                      onDoubleClick={() =>
                        removeFromBoard(cell)
                      }
                      className={`relative border border-white/10 ${locked ? "bg-red-500/10" : "bg-white/[0.02]"} ${selectedCell ? "ring-2 ring-cyan-400 z-10" : ""}`}
                      style={{
                        width: pieceSize,
                        height: pieceSize,
                      }}
                    >
                      {locked && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-red-300">
                          MISSING
                        </span>
                      )}

                      {piece !== null && (
                        <span
                          className={`absolute inset-0 bg-cover ${correct ? "outline outline-2 outline-green-400/70" : ""}`}
                          style={pieceStyle(
                            puzzle.image,
                            piece,
                            rows,
                            columns,
                            pieceSize
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-black/50 p-4">
                <p className="text-cyan-400 text-xs tracking-[0.25em] uppercase font-black">
                  Loose Pieces
                </p>

                <div
                  className="mt-4 grid gap-2"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(58px, 1fr))",
                  }}
                >
                  {tray.map((piece) => {
                    const selectedPiece =
                      selected?.piece ===
                        piece &&
                      selected.source ===
                        "tray";

                    return (
                      <button
                        key={piece}
                        onClick={() =>
                          selectTrayPiece(piece)
                        }
                        className={`border border-white/30 bg-cover shadow-[0_8px_14px_rgba(0,0,0,0.45)] ${selectedPiece ? "ring-2 ring-cyan-400" : ""}`}
                        style={pieceStyle(
                          puzzle.image,
                          piece,
                          rows,
                          columns,
                          pieceSize
                        )}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
