"use client";

import { useEffect, useState } from "react";

const waveOneDeadline =
  new Date("2026-08-31T23:59:59Z").getTime();

function getRemaining() {
  const remaining = Math.max(
    0,
    waveOneDeadline - Date.now()
  );

  const totalSeconds = Math.floor(
    remaining / 1000
  );

  const days = Math.floor(
    totalSeconds / 86400
  );

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

type GiveawayCountdownProps = {
  compact?: boolean;
};

export default function GiveawayCountdown({
  compact = false,
}: GiveawayCountdownProps) {
  const [remaining, setRemaining] =
    useState(getRemaining);

  useEffect(() => {
    const timer = window.setInterval(
      () => setRemaining(getRemaining()),
      1000
    );

    return () =>
      window.clearInterval(timer);
  }, []);

  const items = [
    ["Days", remaining.days],
    ["Hours", remaining.hours],
    ["Min", remaining.minutes],
    ["Sec", remaining.seconds],
  ] as const;

  return (
    <div
      className={`grid grid-cols-4 gap-2 ${
        compact ? "text-center" : ""
      }`}
    >
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-amber-200/20 bg-black/45 px-2 py-2"
        >
          <p className="text-base font-black text-amber-200 md:text-xl">
            {String(value).padStart(
              2,
              "0"
            )}
          </p>
          <p className="mt-0.5 text-[10px] font-black uppercase text-zinc-400 md:text-[11px]">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
