'use client';

import { FuelGaugeProps } from './types';

function getFuelColor(level: number) {
  if (level <= 15) return '#ef4444';
  if (level <= 40) return '#f59e0b';
  return '#22c55e';
}

export default function FuelGauge({ level }: FuelGaugeProps) {
  const safeLevel = Math.max(0, Math.min(100, Number.isFinite(level) ? level : 0));
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeLevel / 100) * circumference;
  const stroke = getFuelColor(safeLevel);

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Fuel level
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">Tank status</h3>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ borderColor: stroke, color: stroke }}
        >
          {safeLevel <= 15 ? 'Low fuel' : safeLevel <= 40 ? 'Monitor' : 'Healthy'}
        </span>
      </div>

      <div className="flex items-center justify-center">
        <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-[0_0_30px_rgba(255,255,255,0.06)]">
          <defs>
            <linearGradient id="fuel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={stroke} stopOpacity="1" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.45" />
            </linearGradient>
          </defs>

          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="#27272a"
            strokeWidth="18"
          />
          <circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke="url(#fuel-gradient)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 110 110)"
          />

          <text x="110" y="104" textAnchor="middle" className="fill-white text-4xl font-bold">
            {Math.round(safeLevel)}%
          </text>
          <text x="110" y="130" textAnchor="middle" className="fill-zinc-400 text-sm uppercase tracking-[0.25em]">
            Remaining
          </text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-zinc-500">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-3">
          Reserve {'<'} 15%
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-3">Watch 15–40%</div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-3 py-3">
          Optimal {'>'} 40%
        </div>
      </div>
    </section>
  );
}
