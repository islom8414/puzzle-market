"use client";

import {
  PointerEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import { puzzles } from "@/data/puzzles";
import { supabase } from "@/lib/supabase";

type PieceState = {
  index: number;
  x: number;
  y: number;
  placed: boolean;
};

type DragState = {
  index: number;
  offsetX: number;
  offsetY: number;
};

const rows = 5;
const columns = 5;
const pieceSize = 78;
const snapDistance = 34;

function slotPosition(
  index: number
) {
  return {
    x:
      (index % columns) *
      pieceSize,
    y:
      Math.floor(index / columns) *
      pieceSize,
  };
}

function getMissingIndexes(
  puzzleId: number
) {
  const first =
    (puzzleId * 7) %
    (rows * columns);

  const second =
    (first + 11) %
    (rows * columns);

  return puzzleId % 2 === 0
    ? [first, second]
    : [first];
}

function createInitialPieces() {
  return Array.from(
    {
      length:
        rows * columns,
    },
    (_, index) => ({
      index,
      x:
        columns * pieceSize +
        70 +
        (index % 5) * 86,
      y:
        18 +
        Math.floor(index / 5) *
          92,
      placed: false,
    })
  );
}

export default function PuzzlePage() {
  const params =
    useParams();

  const slug =
    String(params.id);

  const puzzle =
    puzzles.find(
      (item) =>
        item.slug === slug ||
        String(item.id) === slug
    ) || puzzles[0];

  const missingIndexes =
    useMemo(
      () =>
        getMissingIndexes(
          Number(puzzle.id)
        ),
      [puzzle.id]
    );

  const [pieces, setPieces] =
    useState<PieceState[]>(
      createInitialPieces
    );

  const [dragging, setDragging] =
    useState<DragState | null>(
      null
    );

  const [ownedMissingCount, setOwnedMissingCount] =
    useState(0);

  useEffect(() => {
    async function loadOwnership() {
      const username =
        localStorage.getItem(
          "puzzle-username"
        );

      if (!username) return;

      const {
        data,
      } =
        await supabase
          .from("inventory")
          .select("id")
          .eq(
            "user_email",
            username
          )
          .eq(
            "fragment_id",
            puzzle.slug
          );

      setOwnedMissingCount(
        Math.min(
          data?.length || 0,
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

  const visiblePieces =
    useMemo(() => {
      return pieces.filter(
        (piece) =>
          !lockedMissingIndexes.includes(
            piece.index
          )
      );
    }, [
      pieces,
      lockedMissingIndexes,
    ]);

  const placedCount =
    visiblePieces.filter(
      (piece) => piece.placed
    ).length;

  const targetCount =
    visiblePieces.length;

  function resetPieces() {
    setPieces(
      createInitialPieces()
    );
  }

  function startDrag(
    event: PointerEvent,
    piece: PieceState
  ) {
    if (piece.placed) return;

    const target =
      event.currentTarget as HTMLElement;

    target.setPointerCapture(
      event.pointerId
    );

    setDragging({
      index: piece.index,
      offsetX:
        event.clientX - piece.x,
      offsetY:
        event.clientY - piece.y,
    });
  }

  function moveDrag(
    event: PointerEvent
  ) {
    if (!dragging) return;

    setPieces((current) =>
      current.map((piece) =>
        piece.index ===
        dragging.index
          ? {
              ...piece,
              x:
                event.clientX -
                dragging.offsetX,
              y:
                event.clientY -
                dragging.offsetY,
            }
          : piece
      )
    );
  }

  function endDrag() {
    if (!dragging) return;

    setPieces((current) =>
      current.map((piece) => {
        if (
          piece.index !==
          dragging.index
        ) {
          return piece;
        }

        const slot =
          slotPosition(
            piece.index
          );

        const distance =
          Math.hypot(
            piece.x - slot.x,
            piece.y - slot.y
          );

        if (
          distance <
          snapDistance
        ) {
          return {
            ...piece,
            x: slot.x,
            y: slot.y,
            placed: true,
          };
        }

        return piece;
      })
    );

    setDragging(null);
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <Link
              href="/collection"
              className="text-cyan-400 font-black"
            >
              Back to Collection
            </Link>

            <p className="text-cyan-400 text-xs tracking-[0.35em] uppercase font-black mt-8">
              Hidden Puzzle Board
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-3">
              {puzzle.title}
            </h1>

            <p className="text-zinc-400 mt-4 max-w-2xl">
              The full image is hidden. Build the picture from small pieces and unlock the missing market pieces through trading.
            </p>
          </div>

          <button
            onClick={resetPieces}
            className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl font-black"
          >
            Shuffle
          </button>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">
          <aside className="bg-white/[0.03] border border-white/10 rounded-[32px] p-6">
            <div className="rounded-[28px] border border-cyan-400/20 bg-black/60 p-6">
              <p className="text-cyan-400 text-xs tracking-[0.3em] uppercase font-black">
                Puzzle Status
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <p className="text-zinc-500 text-sm">
                    Progress
                  </p>
                  <h2 className="text-3xl font-black text-cyan-400 mt-2">
                    {placedCount}/{targetCount}
                  </h2>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                  <p className="text-zinc-500 text-sm">
                    Missing
                  </p>
                  <h2 className="text-3xl font-black text-yellow-300 mt-2">
                    {lockedMissingIndexes.length}
                  </h2>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Only small pieces are visible. There is no full preview, so players discover the image while assembling it.
                </p>
              </div>

              {lockedMissingIndexes.length > 0 && (
                <Link
                  href="/marketplace"
                  className="mt-6 flex justify-center bg-green-400 text-black font-black py-4 rounded-2xl"
                >
                  Buy Missing Piece
                </Link>
              )}
            </div>
          </aside>

          <section className="relative min-h-[650px] bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden">
            <div
              className="absolute left-6 top-6"
              style={{
                width:
                  columns * pieceSize,
                height:
                  rows * pieceSize,
              }}
            >
              {Array.from({
                length:
                  rows * columns,
              }).map((_, index) => {
                const slot =
                  slotPosition(index);

                const locked =
                  lockedMissingIndexes.includes(
                    index
                  );

                return (
                  <div
                    key={index}
                    className={`absolute border ${locked ? "border-red-400/30 bg-red-500/10" : "border-white/10 bg-white/[0.02]"}`}
                    style={{
                      left: slot.x,
                      top: slot.y,
                      width:
                        pieceSize,
                      height:
                        pieceSize,
                    }}
                  >
                    {locked && (
                      <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-red-300">
                        MISSING
                      </div>
                    )}
                  </div>
                );
              })}

              {visiblePieces.map(
                (piece) => {
                  const slot =
                    slotPosition(
                      piece.index
                    );

                  return (
                    <div
                      key={piece.index}
                      onPointerDown={(event) =>
                        startDrag(
                          event,
                          piece
                        )
                      }
                      onPointerMove={
                        moveDrag
                      }
                      onPointerUp={
                        endDrag
                      }
                      onPointerCancel={
                        endDrag
                      }
                      className={`absolute touch-none select-none border border-white/40 bg-black bg-cover shadow-[0_12px_22px_rgba(0,0,0,0.55)] ${piece.placed ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
                      style={{
                        left: piece.x,
                        top: piece.y,
                        width:
                          pieceSize,
                        height:
                          pieceSize,
                        backgroundImage:
                          `url(${puzzle.image})`,
                        backgroundSize:
                          `${columns * pieceSize}px ${rows * pieceSize}px`,
                        backgroundPosition:
                          `-${slot.x}px -${slot.y}px`,
                        zIndex:
                          dragging?.index ===
                          piece.index
                            ? 50
                            : piece.placed
                              ? 20
                              : 30,
                      }}
                    />
                  );
                }
              )}
            </div>

            <div className="absolute right-6 top-6 w-72 rounded-3xl border border-cyan-400/20 bg-black/60 p-5">
              <p className="text-cyan-400 text-xs tracking-[0.25em] uppercase font-black">
                Loose Pieces
              </p>
              <p className="text-zinc-400 text-sm mt-3 leading-relaxed">
                Drag the small squares into the board. When a piece is near the correct cell, it snaps exactly into place.
              </p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
