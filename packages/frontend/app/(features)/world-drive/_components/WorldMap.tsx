"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { CarPosition } from "./LeafletMap";

// SSR must be disabled — Leaflet accesses browser APIs (window, document)
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const WORLD_DRIVE_URL =
  process.env.NEXT_PUBLIC_WORLD_DRIVE_URL ?? "http://localhost:4003";

const POLL_INTERVAL_MS = 200;
const ANIM_DURATION_MS = 1000;
const MAX_TRAIL_LENGTH = 200;

type Status = "connecting" | "live" | "error";

export default function WorldMap() {
  const [serverPosition, setServerPosition] = useState<CarPosition | null>(null);
  const [displayPosition, setDisplayPosition] = useState<CarPosition | null>(null);
  const [trail, setTrail] = useState<CarPosition[]>([]);
  const [status, setStatus] = useState<Status>("connecting");

  const fromRef = useRef<CarPosition | null>(null);
  const toRef = useRef<CarPosition | null>(null);
  const animatedRef = useRef<CarPosition | null>(null);
  const animStartRef = useRef<number>(0);

  useEffect(() => {
    let frame: number;

    function loop(now: number) {
      const from = fromRef.current;
      const to = toRef.current;

      if (from && to && animStartRef.current > 0) {
        const t = Math.min((now - animStartRef.current) / ANIM_DURATION_MS, 1);
        const interpolated: CarPosition = {
          lat: from.lat + (to.lat - from.lat) * t,
          lng: from.lng + (to.lng - from.lng) * t,
          timestamp: to.timestamp,
        };
        animatedRef.current = interpolated;
        setDisplayPosition(interpolated);
      }

      frame = requestAnimationFrame(loop);
    }

    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []); // empty deps — runs once for the lifetime of the component

  useEffect(() => {
    if (!serverPosition) return;

    if (!toRef.current) {
      fromRef.current = serverPosition;
      toRef.current = serverPosition;
      animatedRef.current = serverPosition;
      animStartRef.current = performance.now();
      setDisplayPosition(serverPosition);
      setTrail([serverPosition]);
      return;
    }

    if (
      serverPosition.lat === toRef.current.lat &&
      serverPosition.lng === toRef.current.lng
    ) return;

    fromRef.current = animatedRef.current ?? serverPosition;
    toRef.current = serverPosition;
    animStartRef.current = performance.now();
    setTrail((prev) => [...prev.slice(-(MAX_TRAIL_LENGTH - 1)), serverPosition]);
  }, [serverPosition]);

  // Poll the service for the latest GPS position
  useEffect(() => {
    async function fetchPosition() {
      try {
        const res = await fetch(`${WORLD_DRIVE_URL}/api/position`);
        if (res.status === 404) { setStatus("connecting"); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as CarPosition;
        setServerPosition(data);
        setStatus("live");
      } catch {
        setStatus("error");
      }
    }

    fetchPosition();
    const interval = setInterval(fetchPosition, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const statusDot: Record<Status, string> = {
    live: "bg-green-400 animate-pulse",
    connecting: "bg-yellow-400 animate-pulse",
    error: "bg-red-500",
  };

  const statusText: Record<Status, string> = {
    live: displayPosition
      ? `${displayPosition.lat.toFixed(5)}, ${displayPosition.lng.toFixed(5)} — updated ${new Date(displayPosition.timestamp).toLocaleTimeString()}`
      : "Live",
    connecting: "Waiting for vehicle signal…",
    error: "Cannot reach World Drive service",
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
        <span className={`w-3 h-3 rounded-full ${statusDot[status]}`} title={status} />
      </div>
      <LeafletMap position={displayPosition} trail={trail} />
    </div>
  );
}
