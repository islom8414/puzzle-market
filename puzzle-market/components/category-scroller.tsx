"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type CategoryScrollerProps = {
  items: readonly string[];
  value: string;
  allLabel?: string;
  className?: string;
  onChange: (value: string) => void;
};

export function CategoryScroller({
  items,
  value,
  allLabel = "All",
  className = "",
  onChange,
}: CategoryScrollerProps) {
  const scrollerRef =
    useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef(
    new Map<string, HTMLButtonElement>()
  );
  const [scrollState, setScrollState] =
    useState({
      canScrollLeft: false,
      canScrollRight: false,
    });

  const choices = useMemo(
    () => ["ALL", ...items],
    [items]
  );

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    const maxScroll =
      scroller.scrollWidth -
      scroller.clientWidth;

    setScrollState({
      canScrollLeft:
        scroller.scrollLeft > 6,
      canScrollRight:
        scroller.scrollLeft <
        maxScroll - 6,
    });
  }, []);

  const scrollByPage = useCallback(
    (direction: "left" | "right") => {
      const scroller = scrollerRef.current;

      if (!scroller) {
        return;
      }

      scroller.scrollTo({
        left:
          scroller.scrollLeft +
          scroller.clientWidth *
            (direction === "left"
              ? -0.82
              : 0.82),
        behavior: "smooth",
      });

      window.setTimeout(updateScrollState, 320);
    },
    [updateScrollState]
  );

  const selectCategory = useCallback(
    (item: string) => {
      onChange(item);

      buttonRefs.current
        .get(item)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });

      window.setTimeout(updateScrollState, 320);
    },
    [onChange, updateScrollState]
  );

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    updateScrollState();

    scroller.addEventListener(
      "scroll",
      updateScrollState,
      { passive: true }
    );

    const resizeObserver =
      new ResizeObserver(updateScrollState);

    resizeObserver.observe(scroller);

    return () => {
      scroller.removeEventListener(
        "scroll",
        updateScrollState
      );
      resizeObserver.disconnect();
    };
  }, [
    choices.length,
    updateScrollState,
  ]);

  useEffect(() => {
    buttonRefs.current
      .get(value)
      ?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });

    window.setTimeout(updateScrollState, 320);
  }, [updateScrollState, value]);

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
    >
      <button
        type="button"
        aria-label="Scroll categories left"
        onClick={() => scrollByPage("left")}
        disabled={!scrollState.canScrollLeft}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-white/10 bg-black/80 text-white shadow-[0_0_18px_rgba(34,211,238,0.12)] transition duration-200 hover:border-white/20 active:scale-95 disabled:opacity-25"
      >
        <span className="h-2.5 w-2.5 rotate-45 border-b-2 border-l-2 border-current" />
      </button>

      <div
        ref={scrollerRef}
        data-category-scroller="true"
        className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {choices.map((item) => {
          const selected = value === item;

          return (
            <button
              key={item}
              ref={(node) => {
                if (node) {
                  buttonRefs.current.set(item, node);
                } else {
                  buttonRefs.current.delete(item);
                }
              }}
              type="button"
              onClick={() =>
                selectCategory(item)
              }
              className={`min-h-11 shrink-0 snap-center whitespace-nowrap rounded-2xl border px-4 text-sm font-black transition duration-200 active:scale-[0.98] ${
                selected
                  ? "border-cyan-300 bg-cyan-400 text-black shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                  : "border-white/10 bg-zinc-950/90 text-white/80"
              }`}
            >
              {item === "ALL"
                ? allLabel
                : item}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Scroll categories right"
        onClick={() => scrollByPage("right")}
        disabled={!scrollState.canScrollRight}
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-cyan-300/30 bg-black/80 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)] transition duration-200 hover:border-cyan-200/50 active:scale-95 disabled:opacity-25"
      >
        <span className="h-2.5 w-2.5 rotate-45 border-r-2 border-t-2 border-current" />
      </button>
    </div>
  );
}
