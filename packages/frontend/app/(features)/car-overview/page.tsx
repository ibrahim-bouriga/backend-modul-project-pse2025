import CarGrid from "./_components/CarGrid";

export const dynamic = "force-dynamic";

export default function CarOverviewPage() {
  return (
    <div className="max-w-6xl mx-auto px-8 py-16 space-y-10">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-zinc-500 mb-3">
          Feature Module
        </p>
        <h1 className="text-5xl font-black uppercase leading-none tracking-tight mb-4">
          Cars Overview
        </h1>
        <p className="text-zinc-400 text-base max-w-lg leading-relaxed">
          Browse every model in our lineup. Compare technical specs,
          available trims, and configurations to find the car that fits
          your ambitions.
        </p>
      </div>

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <CarGrid />

    </div>
  );
}
