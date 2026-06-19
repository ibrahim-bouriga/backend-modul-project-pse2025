'use client';

import { VehicleStatsProps } from './types';

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) {
    return 'Waiting for telemetry';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid timestamp';
  }

  return new Intl.DateTimeFormat('en-DE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

function getConnectionLabel(connectionState: VehicleStatsProps['connectionState']) {
  switch (connectionState) {
    case 'connected':
      return 'Live';
    case 'connecting':
      return 'Connecting';
    case 'error':
      return 'Error';
    default:
      return 'Offline';
  }
}

function getConnectionColor(connectionState: VehicleStatsProps['connectionState']) {
  switch (connectionState) {
    case 'connected':
      return 'bg-green-500';
    case 'connecting':
      return 'bg-amber-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-zinc-500';
  }
}

export default function VehicleStats({
  speed,
  timestamp,
  fuelLevel,
  latitude,
  longitude,
  connectionState,
}: VehicleStatsProps) {
  const cards = [
    {
      label: 'Speed',
      value: speed !== null ? `${Math.round(speed)} km/h` : '—',
    },
    {
      label: 'Last update',
      value: formatTimestamp(timestamp),
    },
    {
      label: 'Coordinates',
      value:
        latitude !== null && longitude !== null
          ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          : 'Waiting for GPS',
    },
    {
      label: 'Fuel reserve',
      value: fuelLevel !== null ? `${Math.round(fuelLevel)}%` : '—',
    },
  ];

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Vehicle stats
          </p>
          <h3 className="mt-2 text-xl font-bold text-white">Telemetry overview</h3>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
          <span className={`h-2.5 w-2.5 rounded-full ${getConnectionColor(connectionState)}`} />
          {getConnectionLabel(connectionState)}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {card.label}
            </p>
            <p className="mt-3 text-base font-semibold text-white break-words">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
