import { trustStats } from "@/lib/site-links";

export function HomeTrustStats() {
  return (
    <div className="mt-14">
      <p className="text-zinc-500 text-sm font-semibold">
        Built around clear rules and real account ownership
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
        {trustStats.map((stat) => (
          <div
            key={stat.label}
            className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <h3
              className={`translate-safe-stat font-black ${stat.accent ? "text-cyan-400" : ""}`}
            >
              {stat.value}
            </h3>

            <p className="text-zinc-500 mt-2 text-sm [overflow-wrap:anywhere]">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
