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

const rows = 3;
const columns = 3;
const pieceSize = 130;
const tabSize = 28;
const snapDistance = 44;

const edgeSigns = [
  [1, -1],
  [-1, 1],
  [1, -1],
];

function tabPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  sign: number
) {
  const horizontal =
    startY === endY;

  const length =
    horizontal
      ? endX - startX
      : endY - startY;

  const third =
    length / 3;

  if (sign === 0) {
    return `L ${endX} ${endY}`;
  }

  if (horizontal) {
    const direction =
      Math.sign(length);

    return [
      `L ${startX + third} ${startY}`,
      `C ${startX + third * 1.1} ${startY - tabSize * sign}`,
      `${startX + third * 1.9} ${startY - tabSize * sign}`,
      `${startX + third * 2} ${startY}`,
      `L ${endX} ${endY}`,
    ].join(" ");
  }

  const direction =
    Math.sign(length);

  return [
    `L ${startX} ${startY + third}`,
    `C ${startX + tabSize * sign * direction} ${startY + third * 1.1}`,
    `${startX + tabSize * sign * direction} ${startY + third * 1.9}`,
    `${startX} ${startY + third * 2}`,
    `L ${endX} ${endY}`,
  ].join(" ");
}

function piecePath(
  index: number
) {
  const row =
    Math.floor(index / columns);

  const column =
    index % columns;

  const top =
    row === 0
      ? 0
      : -edgeSigns[row - 1][column];

  const right =
    column === columns - 1
      ? 0
      : edgeSigns[row][column];

  const bottom =
    row === rows - 1
      ? 0
      : edgeSigns[row][column];

  const left =
    column === 0
      ? 0
      : -edgeSigns[row][column - 1];

  const w =
    pieceSize;

  const h =
    pieceSize;

  return [
    `M 0 0`,
    tabPath(0, 0, w, 0, top),
    tabPath(w, 0, w, h, right),
    tabPath(w, h, 0, h, bottom),
    tabPath(0, h, 0, 0, left),
    "Z",
  ].join(" ");
}

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
        90 +
        (index % 3) * 86,
      y:
        18 +
        Math.floor(index / 3) *
          126,
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

  const missingIndex =
    puzzle.id % 9;

  const [pieces, setPieces] =
    useState<PieceState[]>(
      createInitialPieces
    );

  const [dragging, setDragging] =
    useState<DragState | null>(
      null
    );

  const [ownsMissing, setOwnsMissing] =
    useState(false);

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
          )
          .limit(1);

      setOwnsMissing(
        Boolean(data?.length)
      );
    }

    loadOwnership();
  }, [puzzle.slug]);

  const visiblePieces =
    useMemo(() => {
      return pieces.filter(
        (piece) =>
          ownsMissing ||
          piece.index !==
            missingIndex
      );
    }, [
      pieces,
      ownsMissing,
      missingIndex,
    ]);

  const placedCount =
    pieces.filter(
      (piece) =>
        piece.placed &&
        (ownsMissing ||
          piece.index !==
            missingIndex)
    ).length;

  const targetCount =
    ownsMissing
      ? rows * columns
      : rows * columns - 1;

  function resetPieces() {
    setPieces(
      createInitialPieces()
    );
  }

  function autoSolveOwned() {
    setPieces((current) =>
      current.map((piece) => {
        if (
          !ownsMissing &&
          piece.index ===
            missingIndex
        ) {
          return piece;
        }

        const slot =
          slotPosition(
            piece.index
          );

        return {
          ...piece,
          x: slot.x,
          y: slot.y,
          placed: true,
        };
      })
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
              Real Jigsaw Board
            </p>

            <h1 className="text-5xl md:text-7xl font-black mt-3">
              {puzzle.title}
            </h1>

            <p className="text-zinc-400 mt-4 max-w-2xl">
              Drag each unique puzzle piece into its matching slot. The missing market piece unlocks after purchase.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetPieces}
              className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl font-black"
            >
              Shuffle
            </button>

            <button
              onClick={autoSolveOwned}
              className="bg-cyan-400 text-black px-5 py-3 rounded-2xl font-black"
            >
              Preview Fit
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-[430px_1fr] gap-8">
          <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-6">
            <div className="aspect-square rounded-[28px] overflow-hidden border border-white/10">
              <img
                src={puzzle.image}
                alt={puzzle.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">
                  Progress
                </p>
                <h2 className="text-3xl font-black text-cyan-400 mt-2">
                  {placedCount}/{targetCount}
                </h2>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-2xl p-4">
                <p className="text-zinc-500 text-sm">
                  Missing Piece
                </p>
                <h2 className="text-3xl font-black text-yellow-300 mt-2">
                  #{missingIndex + 1}
                </h2>
              </div>
            </div>

            {!ownsMissing && (
              <Link
                href="/marketplace"
                className="mt-6 flex justify-center bg-green-400 text-black font-black py-4 rounded-2xl"
              >
                Buy Missing Piece
              </Link>
            )}
          </div>

          <div className="relative min-h-[560px] bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden">
            <div className="absolute left-6 top-6">
              <div
                className="relative"
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
                    !ownsMissing &&
                    index ===
                      missingIndex;

                  return (
                    <div
                      key={index}
                      className={`absolute border border-white/10 ${locked ? "bg-red-500/10" : "bg-white/[0.02]"}`}
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
                        <div className="w-full h-full flex items-center justify-center text-center text-xs font-black text-red-300 px-3">
                          Missing
                        </div>
                      )}
                    </div>
                  );
                })}

                {visiblePieces.map(
                  (piece) => (
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
                      className={`absolute touch-none select-none ${piece.placed ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
                      style={{
                        left: piece.x,
                        top: piece.y,
                        width:
                          pieceSize +
                          tabSize * 2,
                        height:
                          pieceSize +
                          tabSize * 2,
                        transform:
                          `translate(${-tabSize}px, ${-tabSize}px)`,
                        zIndex:
                          dragging?.index ===
                          piece.index
                            ? 50
                            : piece.placed
                              ? 20
                              : 30,
                      }}
                    >
                      <svg
                        viewBox={`${-tabSize} ${-tabSize} ${pieceSize + tabSize * 2} ${pieceSize + tabSize * 2}`}
                        className="drop-shadow-[0_14px_20px_rgba(0,0,0,0.65)]"
                      >
                        <defs>
                          <clipPath
                            id={`piece-${piece.index}`}
                          >
                            <path
                              d={piecePath(
                                piece.index
                              )}
                            />
                          </clipPath>
                        </defs>

                        <image
                          href={puzzle.image}
                          x={
                            -slotPosition(
                              piece.index
                            ).x
                          }
                          y={
                            -slotPosition(
                              piece.index
                            ).y
                          }
                          width={
                            columns *
                            pieceSize
                          }
                          height={
                            rows *
                            pieceSize
                          }
                          preserveAspectRatio="xMidYMid slice"
                          clipPath={`url(#piece-${piece.index})`}
                        />

                        <path
                          d={piecePath(
                            piece.index
                          )}
                          fill="none"
                          stroke="rgba(255,255,255,0.65)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="absolute right-6 top-6 w-64 rounded-3xl border border-cyan-400/20 bg-black/50 p-5">
              <p className="text-cyan-400 text-xs tracking-[0.25em] uppercase font-black">
                Loose Pieces
              </p>
              <p className="text-zinc-400 text-sm mt-3">
                Drag pieces from the right side into the board. Near the correct slot, they snap into place.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
