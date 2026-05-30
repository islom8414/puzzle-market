"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { puzzles } from "@/data/puzzles";
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
};

const defaultRows = 5;
const defaultColumns = 5;
const pieceSize = 66;

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
  columns: number
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
    useState<{
      title: string;
      image_url: string;
      rows: number;
      columns: number;
      missing_piece_index: number | null;
      rarity: string | null;
    } | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      const { data } =
        await supabase
          .from("puzzle_catalog")
          .select(
            "title,image_url,rows,columns,missing_piece_index,rarity"
          )
          .eq("slug", slug)
          .maybeSingle();

      if (data) {
        setCatalogPuzzle(data);
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
          rarity: "Legendary",
          category: "official",
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
    `puzzle-progress-${puzzle.slug}`;

  const [board, setBoard] =
    useState<Array<number | null>>(
      Array(totalPieces).fill(null)
    );

  const [tray, setTray] =
    useState<number[]>(() =>
      shuffledPieces(totalPieces)
    );

  useEffect(() => {
    setBoard(
      Array(totalPieces).fill(null)
    );
    setTray(
      shuffledPieces(totalPieces)
    );
  }, [slug, totalPieces]);

  const [selected, setSelected] =
    useState<Selection | null>(
      null
    );

  const [ownedMissingCount, setOwnedMissingCount] =
    useState(0);

  useEffect(() => {
    async function loadOwnership() {
      const {
        data: {
          user,
        },
      } =
        await supabase.auth
          .getUser();

      if (!user) {
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
            puzzle.slug
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
    }

    loadOwnership();
  }, [
    puzzle.slug,
    missingIndexes.length,
  ]);

  const lockedMissingIndexes =
    missingIndexes.slice(
      ownedMissingCount
    );

  useEffect(() => {
    const saved =
      localStorage.getItem(
        storageKey
      );

    if (!saved) {
      setBoard(
        Array(totalPieces).fill(null)
      );
      setTray(shuffledPieces(totalPieces));
      return;
    }

    try {
      const parsed =
        JSON.parse(saved) as
          SavedProgress;

      if (
        parsed.board?.length ===
          totalPieces &&
        Array.isArray(
          parsed.tray
        )
      ) {
        setBoard(parsed.board);
        setTray(parsed.tray);
      }
    } catch {
      setBoard(
        Array(totalPieces).fill(null)
      );
      setTray(shuffledPieces(totalPieces));
    }
  }, [storageKey]);

  useEffect(() => {
    const lockedSet =
      new Set(
        lockedMissingIndexes
      );

    setBoard((currentBoard) => {
      const nextBoard =
        currentBoard.map(
          (piece, cell) =>
            lockedSet.has(cell)
              ? null
              : piece
        );

      setTray((currentTray) => {
        const used =
          new Set(
            nextBoard.filter(
              (
                piece
              ): piece is number =>
                piece !== null
            )
          );

        const currentSet =
          new Set(
            currentTray
          );

        const cleanedTray =
          currentTray.filter(
            (piece) =>
              !lockedSet.has(piece) &&
              !used.has(piece)
          );

        const restoredPieces =
          shuffledPieces(totalPieces).filter(
            (piece) =>
              !lockedSet.has(piece) &&
              !used.has(piece) &&
              !currentSet.has(piece)
          );

        return [
          ...cleanedTray,
          ...restoredPieces,
        ];
      });

      return nextBoard;
    });
  }, [
    lockedMissingIndexes.join(","),
  ]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        board,
        tray,
      })
    );
  }, [
    board,
    tray,
    storageKey,
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

  if (!foundPuzzle) {
    return (
      <main className="min-h-screen bg-black text-white px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-zinc-950 p-8">
          <Link
            href="/"
            className="text-cyan-400 font-black"
          >
            Back Home
          </Link>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.3em] text-cyan-400">
            Hidden Puzzle Board
          </p>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Puzzle removed
          </h1>

          <p className="mt-4 text-zinc-400">
            This test collection was cleaned before launch. New real puzzle collections will appear here after the platform owner adds them.
          </p>

          <Link
            href="/marketplace"
            className="mt-8 inline-flex rounded-2xl bg-cyan-400 px-8 py-4 font-black text-black"
          >
            Open Marketplace
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-3 py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">
          <div>
            <Link
              href="/"
              className="text-cyan-400 font-black"
            >
              Back Home
            </Link>

            <p className="text-cyan-400 text-xs tracking-[0.3em] uppercase font-black mt-6">
              Hidden Puzzle Board
            </p>

            <h1 className="text-4xl md:text-6xl font-black mt-2 leading-none">
              {puzzle.title}
            </h1>

            <p className="text-zinc-400 mt-3 max-w-2xl">
              Choose a piece, then choose a cell. Pieces snap perfectly into the grid and can be swapped anytime.
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
              <Link
                href={`/marketplace?puzzle=${puzzle.slug}&piece=${lockedMissingIndexes[0]}`}
                className="mt-5 flex justify-center bg-green-400 text-black font-black py-4 rounded-2xl"
              >
                Buy Missing Piece
              </Link>
            )}
          </aside>

          <section className="bg-white/[0.03] border border-white/10 rounded-[28px] p-4 md:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5 items-start">
              <div
                className="grid rounded-2xl border border-white/10 bg-black/50 overflow-hidden"
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
                            columns
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
                          columns
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
