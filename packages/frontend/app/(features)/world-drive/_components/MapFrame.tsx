"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { VehicleTelemetry, CarDisplayState } from "./Map";
import CarSelector, { type Car } from "./CarSelector";
import TripSidebar, { type Trip, formatDate, formatDuration } from "./TripSidebar";

const LeafletMap = dynamic(() => import("./Map"), { ssr: false });

const MAX_TRAIL   = 200;
const SPEED_ALPHA = 0.3; //EMA Berechnung

interface PerCarState {
  position: VehicleTelemetry | null;
  trail:    VehicleTelemetry[];
  speedKmh: number | null;
}


export default function MapFrame() {
  const [allCars,       setAllCars]       = useState<Car[]>([]);
  const [focusedCarId,  setFocusedCarId]  = useState<string | null>(null);
  const [liveData,      setLiveData]      = useState<Record<string, PerCarState>>({});
  const [initialCenter, setInitialCenter] = useState<[number, number] | null>(null);
  const [selectedTrip,  setSelectedTrip]  = useState<Trip | null>(null);

  const essRef            = useRef(new globalThis.Map<string, EventSource>());
  const prevPositionsRef  = useRef(new globalThis.Map<string, VehicleTelemetry>());
  const smoothedSpeedsRef = useRef(new globalThis.Map<string, number>()); //damit soll die Geschwindigkeit nicht bei jedem Schritt springen, um das ganze smoother zu machen
  const hasAutoSelected   = useRef(false);

  //Aufgerufen wenn ein SSE Event eintrifft
  const handleTelemetry = useCallback((carId: string, data: VehicleTelemetry) => {
    const prevPosition            = prevPositionsRef.current.get(carId) ?? null;
    const hasPositionChanged = prevPosition != null && (data.lat !== prevPosition.lat || data.lng !== prevPosition.lng);

    // Ermittlung der neuen Geschwindigkeit 
    let newSpeedKmh: number | null = null;
    if (hasPositionChanged && prevPosition) {
      const rawKmh: number | null = data.speed != null ? data.speed * 3.6 : null; // m/s → km/h
      if (rawKmh != null && rawKmh >= 0) {
        //Das folgende wird auf basis von EMA(Exponential Moving Average) berechnet
        //Darin wird der neuere Mittelwert stärker gewichtet als ältere für das angleichen von Geschwindigkeitsverläufen
        //Formel: neuerGlättungswert = α × neuerMesswert + (1-α) × letzterGlättungswert
        const prevSmoothed = smoothedSpeedsRef.current.get(carId) ?? null;
        const smoothed     = prevSmoothed == null
          ? rawKmh
          : SPEED_ALPHA * rawKmh + (1 - SPEED_ALPHA) * prevSmoothed;
        smoothedSpeedsRef.current.set(carId, smoothed);
        newSpeedKmh = Math.round(smoothed);
      }
    }
    prevPositionsRef.current.set(carId, data);

    setInitialCenter((c) => c ?? [data.lat, data.lng]);
    setLiveData((ld) => {
      const cur      = ld[carId];
      const curTrail = cur?.trail ?? [];
      const newTrail = hasPositionChanged && prevPosition
        ? [...curTrail.slice(-(MAX_TRAIL - 1)), prevPosition]
        : curTrail;
      return {
        ...ld,
        [carId]: { position: data, trail: newTrail, speedKmh: newSpeedKmh ?? (cur?.speedKmh ?? null) },
      };
    });
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadCars() {
      try {
        const res  = await fetch("/api/world-drive/cars");
        if (!res.ok || !alive) return;
        const data = (await res.json()) as Car[];
        setAllCars(data);

        if (!hasAutoSelected.current && data.length > 0) {
          const first = data.find((c) => c.isLive) ?? data[0];
          setFocusedCarId(first.id);
          hasAutoSelected.current = true;
        }

        const currentIds = new globalThis.Set(data.map((c) => c.id));
        for (const [id, es] of essRef.current) {
          if (!currentIds.has(id)) { es.close(); essRef.current.delete(id); }
        }
        for (const car of data) {
          if (essRef.current.has(car.id)) continue;
          const es = new EventSource(`/api/world-drive/cars/${car.id}/stream`);
          essRef.current.set(car.id, es);
          es.onmessage = (event) => {
            try { handleTelemetry(car.id, JSON.parse(event.data as string) as VehicleTelemetry); }
            catch { /* ignore */ }
          };
        }
      } catch { /* ignore */ }
    }

    loadCars();
    const t = setInterval(loadCars, 5000);
    return () => {
      alive = false;
      clearInterval(t);
      for (const es of essRef.current.values()) es.close();
      essRef.current.clear();
    };
  }, [handleTelemetry]);

  const carDisplayStates: CarDisplayState[] = allCars.map((car) => ({
    id:       car.id,
    color:    car.color,
    position: liveData[car.id]?.position ?? null,
    trail:    liveData[car.id]?.trail    ?? [],
  }));

  const focusedCar   = allCars.find((c) => c.id === focusedCarId) ?? null;
  const focusedSpeed = focusedCarId ? (liveData[focusedCarId]?.speedKmh ?? null) : null;
  const focusedLive  = focusedCar?.isLive ?? false;

  return (
    <div className="absolute inset-0">
      {/* Map */}
      {initialCenter ? (
        <LeafletMap
          initialCenter={initialCenter}
          cars={carDisplayStates}
          followCarId={focusedCarId}
          onCarSelect={(id) => { setFocusedCarId(id); setSelectedTrip(null); }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <p className="text-zinc-500 text-sm">Waiting for vehicle signal…</p>
        </div>
      )}

      {/* Top-left: car selector + trip sidebar */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <CarSelector
          cars={allCars}
          focusedCarId={focusedCarId}
          onFocus={(car) => { setFocusedCarId(car.id); setSelectedTrip(null); }}
        />
        <TripSidebar
          carId={focusedCarId}
          selectedTripId={selectedTrip?.id ?? null}
          onTripSelect={(trip) => setSelectedTrip(trip)}
        />
      </div>

      {/* Bottom-left HUD */}
      <div className="absolute bottom-6 left-6 z-[1000] flex items-end gap-3">
        {focusedLive && focusedSpeed !== null && (
          <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-xl px-4 py-3 text-right">
            <p className="text-3xl font-black tabular-nums leading-none" style={{ color: focusedCar?.color ?? "#f97316" }}>
              {focusedSpeed}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">km/h</p>
          </div>
        )}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${focusedLive ? "bg-green-400 animate-pulse" : "bg-yellow-400 animate-pulse"}`} />
          <p className="text-xs text-zinc-400">
            {focusedLive
              ? (liveData[focusedCarId ?? ""]?.position
                  ? `${liveData[focusedCarId ?? ""]!.position!.lat.toFixed(5)}, ${liveData[focusedCarId ?? ""]!.position!.lng.toFixed(5)}`
                  : "Live")
              : "Waiting for vehicle signal…"}
          </p>
        </div>
      </div>

      {/* Trip detail overlay */}
      {selectedTrip && (
        <div
          className="absolute inset-0 z-[1001] flex items-center justify-center bg-black/40 backdrop-blur-[3px]"
          onClick={() => setSelectedTrip(null)}
        >
          <div
            className="bg-zinc-900/95 border border-zinc-700 rounded-2xl shadow-2xl w-80 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: `2px solid ${focusedCar?.color ?? "#f97316"}` }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: focusedCar?.color ?? "#f97316" }} />
                <p className="text-white font-bold text-sm">{focusedCar?.name ?? "Car"}</p>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="text-zinc-500 hover:text-white transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Start</p>
                  <p className="text-white text-sm font-semibold">{formatDate(selectedTrip.startedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">End</p>
                  <p className="text-white text-sm font-semibold">{formatDate(selectedTrip.endedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-white text-sm font-semibold">{formatDuration(selectedTrip.startedAt, selectedTrip.endedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Waypoints</p>
                  <p className="text-white text-sm font-semibold">{selectedTrip._count.waypoints}</p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={() => setSelectedTrip(null)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
