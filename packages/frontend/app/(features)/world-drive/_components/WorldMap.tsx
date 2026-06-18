"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { CarPosition } from "./LeafletMap";

// SSR must be disabled — Leaflet accesses browser APIs (window, document)
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const WORLD_DRIVE_URL =
  process.env.NEXT_PUBLIC_WORLD_DRIVE_URL ?? "http://localhost:4001";

const POLL_INTERVAL_MS = 1000;
const MAX_TRAIL_LENGTH = 200;

type Status = "connecting" | "live" | "error";

export default function WorldMap() {
  const [position, setPosition] = useState<CarPosition | null>(null);
  const [trail, setTrail] = useState<CarPosition[]>([]);
  const [status, setStatus] = useState<Status>("connecting");

  useEffect(() => {
    async function fetchPosition() {
      try {
        const res = await fetch(`${WORLD_DRIVE_URL}/api/position`);
        if (res.status === 404) {
          setStatus("connecting");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as CarPosition;
        setPosition(data);
        setTrail((prev) => [...prev.slice(-(MAX_TRAIL_LENGTH - 1)), data]);
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
    live: position
      ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)} — updated ${new Date(position.timestamp).toLocaleTimeString()}`
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
          <p className="text-sm mt-1 text-zinc-400">{statusText[status]}</p>
        </div>
        <span
          className={`w-3 h-3 rounded-full ${statusDot[status]}`}
          title={status}
        />
      </div>
      <LeafletMap position={position} trail={trail} />
    </div>
  );
}
