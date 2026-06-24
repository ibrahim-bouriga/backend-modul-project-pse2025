"use client";

import { useEffect, useState } from "react";
import { SERVICE_MYPSECARS_URL } from "../_lib/api";
import FuelGauge from "./FuelGauge";

interface Telemetry {
  fuel: number | null;
  position: { lat: number; lng: number } | null;
  updatedAt: string | null;
}

export default function TelemetryPanel() {
  const [data, setData] = useState<Telemetry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchTelemetry() {
    try {
      const res = await fetch(`${SERVICE_MYPSECARS_URL}/api/telemetry`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: Telemetry = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTelemetry();
    const id = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          Live Telemetry
        </h2>
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              error ? "bg-red-500" : "bg-green-500 animate-pulse"
            }`}
          />
          <span className="text-xs text-zinc-500 tracking-widest uppercase">
            {error ? "Offline" : "Live"}
          </span>
        </div>
      </div>

      {loading && (
        <p className="text-zinc-500 text-sm animate-pulse">Connecting…</p>
      )}

      {error && !loading && (
        <p className="text-red-400 text-sm">
          Could not reach service-mypsecars ({error}). Make sure it is running
          on port 4004.
        </p>
      )}

      {data && !error && (
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Fuel */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <FuelGauge level={data.fuel} />
          </div>

          {/* Position */}
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-3">
            <p className="text-zinc-400 uppercase tracking-widest text-xs font-semibold">
              Position
            </p>
            {data.position ? (
              <>
                <p className="font-black text-white text-lg font-mono">
                  {data.position.lat.toFixed(5)}, {data.position.lng.toFixed(5)}
                </p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${data.position.lat}&mlon=${data.position.lng}&zoom=14`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white underline"
                >
                  Open on map →
                </a>
              </>
            ) : (
              <p className="text-zinc-600 text-sm">No signal yet</p>
            )}
          </div>
        </div>
      )}

      {/* Last update */}
      {data?.updatedAt && (
        <p className="text-zinc-600 text-xs">
          Last update: {new Date(data.updatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
