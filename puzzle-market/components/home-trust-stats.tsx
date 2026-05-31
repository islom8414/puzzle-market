import { trustStats } from "@/lib/site-links";

export function HomeTrustStats() {
  return (
    <div className="mt-14">
      <p className="text-zinc-500 text-sm font-semibold">
        Trusted by collectors worldwide
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
        {trustStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <h3
              className={`text-3xl md:text-4xl font-black ${stat.accent ? "text-cyan-400" : ""}`}
            >
              {stat.value}
            </h3>

            <p className="text-zinc-500 mt-2 text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
