"use client";
import { useEffect, useState } from "react";

export interface Trip {
  id:        string;
  startedAt: string;
  endedAt:   string;
  _count:    { waypoints: number };
}

interface Props {
  carId:          string | null;
  onTripSelect:   (trip: Trip) => void;
  selectedTripId: string | null;
}

export function formatDuration(startedAt: string, endedAt: string): string {
  const ms  = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const min = Math.floor(ms / 60_000);
  const sec = Math.floor((ms % 60_000) / 1000);
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function TripSidebar({ carId, onTripSelect, selectedTripId }: Props) {
  const [open,    setOpen]    = useState(false);
  const [trips,   setTrips]   = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!carId || !open) return;
    setLoading(true);
    fetch(`/api/world-drive/cars/${carId}/trips`)
      .then((r) => r.json())
      .then((data: Trip[]) => setTrips(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [carId, open]);

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-lg hover:bg-zinc-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Trips {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-lg w-64 overflow-hidden">
          {loading && <p className="text-xs text-zinc-500 px-4 py-3">Loading…</p>}
          {!loading && trips.length === 0 && (
            <p className="text-xs text-zinc-500 px-4 py-3">No completed trips yet.</p>
          )}
          {trips.map((trip) => (
            <button
              key={trip.id}
              onClick={() => onTripSelect(trip)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800 last:border-0 hover:bg-zinc-800 transition-colors ${
                selectedTripId === trip.id ? "bg-zinc-800" : ""
              }`}
            >
              <p className="text-xs font-semibold text-white">{formatDate(trip.startedAt)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {formatDuration(trip.startedAt, trip.endedAt)} · {trip._count.waypoints} pts
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
