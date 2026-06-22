"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { VehicleTelemetry } from "./Map";

const Map = dynamic(() => import("./Map"), { ssr: false });

const POLL_INTERVAL_LIVE_MS  = 100;
const POLL_INTERVAL_IDLE_MIN = 1_000;
const POLL_INTERVAL_IDLE_MAX = 8_000;
const MAX_TRAIL_LENGTH = 200;
const SPEED_ALPHA = 0.3; // EMA smoothing — lower = smoother, higher = more responsive

type Status = "connecting" | "live" | "error";

function haversineMeters(a: VehicleTelemetry, b: VehicleTelemetry): number {
  const R = 6_371_000;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) *
      Math.cos(b.lat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

export default function MapFrame() {
  const [serverPosition, setServerPosition] = useState<VehicleTelemetry | null>(null);
  const [trail, setTrail] = useState<VehicleTelemetry[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const [speedKmh, setSpeedKmh] = useState<number | null>(null);

  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);

  const prevPositionRef   = useRef<VehicleTelemetry | null>(null);
  const smoothedSpeedRef  = useRef<number | null>(null);
  const statusRef         = useRef<Status>("connecting");

  // Speed calculation + EMA smoothing on each new server position
  useEffect(() => {
    if (!serverPosition) return;

    const prev = prevPositionRef.current;
    if (prev && (serverPosition.lat !== prev.lat || serverPosition.lng !== prev.lng)) {
      let rawKmh: number | null = null;

      if (serverPosition.speed != null) {
        // GPS Doppler or simulation-calculated speed — authoritative
        rawKmh = serverPosition.speed * 3.6;
      } else {
        // Fallback: derive from position delta using payload timestamps
        const dtMs =
          new Date(serverPosition.timestamp).getTime() - new Date(prev.timestamp).getTime();
        if (dtMs > 0) {
          rawKmh = (haversineMeters(prev, serverPosition) / (dtMs / 1000)) * 3.6;
        }
      }

      if (rawKmh != null && rawKmh >= 0) {
        const prev = smoothedSpeedRef.current;
        const smoothed = prev == null ? rawKmh : SPEED_ALPHA * rawKmh + (1 - SPEED_ALPHA) * prev;
        smoothedSpeedRef.current = smoothed;
        setSpeedKmh(Math.round(smoothed));
      }

      // Add PREV (not current) so the confirmed trail always ends where the animation started.
      // The live segment in Map.tsx extends from the trail tip to the marker in real time.
      setTrail((t) => [...t.slice(-(MAX_TRAIL_LENGTH - 1)), prev]);
    }

    if (!initialCenter) setInitialCenter([serverPosition.lat, serverPosition.lng]);
    prevPositionRef.current = serverPosition;
  }, [serverPosition]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let idleDelay = POLL_INTERVAL_IDLE_MIN;

    async function fetchTelemetry() {
      try {
        const res = await fetch("/api/world-drive/telemetry");
        if (res.status === 404) {
          statusRef.current = "connecting";
          setStatus("connecting");
          setSpeedKmh(null);
          smoothedSpeedRef.current = null;
          idleDelay = Math.min(idleDelay * 2, POLL_INTERVAL_IDLE_MAX);
        } else if (!res.ok) {
          statusRef.current = "error";
          setStatus("error");
          idleDelay = POLL_INTERVAL_IDLE_MAX;
        } else {
          const data = (await res.json()) as VehicleTelemetry;
          setServerPosition(data);
          statusRef.current = "live";
          setStatus("live");
          idleDelay = POLL_INTERVAL_IDLE_MIN;
        }
      } catch {
        statusRef.current = "error";
        setStatus("error");
        idleDelay = POLL_INTERVAL_IDLE_MAX;
      }
      const delay = statusRef.current === "live" ? POLL_INTERVAL_LIVE_MS : idleDelay;
      timer = setTimeout(fetchTelemetry, delay);
    }

    fetchTelemetry();
    return () => clearTimeout(timer);
  }, []);

  const statusDot: Record<Status, string> = {
    live:       "bg-green-400 animate-pulse",
    connecting: "bg-yellow-400 animate-pulse",
    error:      "bg-red-500",
  };

  const statusText: Record<Status, string> = {
    live: serverPosition
      ? `${serverPosition.lat.toFixed(5)}, ${serverPosition.lng.toFixed(5)}`
      : "Live",
    connecting: "Waiting for vehicle signal…",
    error:      "Cannot reach World Drive service",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
            Live Position
          </h2>
          <p className="text-sm mt-1 text-zinc-400">
            {statusText[status]}
            {status === "live" && (
              <span className="ml-2 text-zinc-600">· {trail.length} pts</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status === "live" && speedKmh !== null && (
            <div className="text-right">
              <p className="text-2xl font-black text-white tabular-nums leading-none">
                {speedKmh}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">km/h</p>
            </div>
          )}
          <span className={`w-3 h-3 rounded-full ${statusDot[status]}`} title={status} />
        </div>
      </div>
      {initialCenter ? (
        <Map initialCenter={initialCenter} position={serverPosition} follow={serverPosition} trail={trail} />
      ) : (
        <div className="flex items-center justify-center bg-zinc-800 rounded-xl border border-zinc-700" style={{ height: "70vh", minHeight: "500px" }}>
          <p className="text-zinc-500 text-sm">Waiting for vehicle signal…</p>
        </div>
      )}
    </div>
  );
}
