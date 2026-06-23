"use client";

interface FuelGaugeProps {
  level: number | null; // 0–100
}

export default function FuelGauge({ level }: FuelGaugeProps) {
  const pct = level ?? 0;

  const color =
    pct > 50 ? "bg-green-500" : pct > 20 ? "bg-yellow-500" : "bg-red-500";

  const label =
    level === null
      ? "—"
      : pct > 50
        ? "OK"
        : pct > 20
          ? "Low"
          : "Critical";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400 uppercase tracking-widest text-xs font-semibold">
          Fuel
        </span>
        <span className="font-black text-white text-lg">
          {level === null ? "—" : `${pct}%`}
        </span>
      </div>

      <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={`text-xs font-semibold tracking-widest uppercase
        ${pct > 50 ? "text-green-400" : pct > 20 ? "text-yellow-400" : "text-red-400"}
        ${level === null ? "text-zinc-600" : ""}
      `}>
        {label}
      </p>
    </div>
  );
}