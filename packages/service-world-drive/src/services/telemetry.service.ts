export interface VehicleTelemetry {
  lat: number;
  lng: number;
  speed: number | null; // m/s — null if unavailable
  timestamp: string;
}

let current: VehicleTelemetry | null = null;

export function updateTelemetry(telemetry: VehicleTelemetry): void {
  current = telemetry;
}

export function getTelemetry(): VehicleTelemetry | null {
  return current;
}

export function clearTelemetry(): void {
  current = null;
}
