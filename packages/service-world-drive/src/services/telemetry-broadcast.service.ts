import type { Response } from 'express';
import type { VehicleTelemetry } from '../types';

// Zuletzt bekannte Telemetry Daten eines Autos
const latest = new Map<string, VehicleTelemetry>();

// SSE clients je Auto
const sseClients = new Map<string, Set<Response>>();

/**
 * Haversine Formel um Luftlinie zwischen 2 Punkten zu ermitteln (inkl. Erdkrümmung)
 * Wird als Fallback genutzt wenn speed = null
 */
function haversineMeters(a: VehicleTelemetry, b: VehicleTelemetry): number {
  const R    = 6_371_000;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLng = (b.lng - a.lng) * (Math.PI / 180);
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) * Math.cos(b.lat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sin2), Math.sqrt(1 - sin2));
}

// Stores telemetry and fills in missing speed via haversine if needed.
// Returns the (possibly enriched) telemetry that was stored.
export function updateLatest(carId: string, telemetry: VehicleTelemetry): VehicleTelemetry {
  let enriched = telemetry;
  if (telemetry.speed == null) {
    const prev = latest.get(carId);
    if (prev) {
      const dtMs = new Date(telemetry.timestamp).getTime() - new Date(prev.timestamp).getTime();
      if (dtMs > 0) {
        enriched = { ...telemetry, speed: haversineMeters(prev, telemetry) / (dtMs / 1000) };
      }
    }
  }
  latest.set(carId, enriched);
  return enriched;
}

export function getLatest(carId: string): VehicleTelemetry | null {
  return latest.get(carId) ?? null;
}

export function getActiveCars(): string[] {
  return Array.from(latest.keys());
}

export function addSseClient(carId: string, res: Response): void {
  if (!sseClients.has(carId)) sseClients.set(carId, new Set());
  sseClients.get(carId)!.add(res);
}

export function removeSseClient(carId: string, res: Response): void {
  sseClients.get(carId)?.delete(res);
}

export function pushToSseClients(carId: string, telemetry: VehicleTelemetry): void {
  const clients = sseClients.get(carId);
  if (!clients?.size) return;
  const frame = `data: ${JSON.stringify(telemetry)}\n\n`;
  for (const res of clients) res.write(frame);
}
