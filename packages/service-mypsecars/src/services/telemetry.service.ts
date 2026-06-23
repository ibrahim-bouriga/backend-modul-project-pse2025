export interface TelemetryState {
  fuel: number | null;
  position: { lat: number; lng: number } | null;
  updatedAt: string | null;
}

const state: TelemetryState = {
  fuel: null,
  position: null,
  updatedAt: null,
};

export function getTelemetry(): TelemetryState {
  return { ...state };
}

export function updateFuel(value: number): void {
  state.fuel = value;
  state.updatedAt = new Date().toISOString();
}

export function updatePosition(lat: number, lng: number): void {
  state.position = { lat, lng };
  state.updatedAt = new Date().toISOString();
}

// HTTP ingest from phone (fallback if MQTT not available)
export function ingestTelemetry(data: {
  fuel?: number;
  position?: { lat: number; lng: number };
}): void {
  if (typeof data.fuel === 'number') updateFuel(data.fuel);
  if (data.position?.lat !== undefined && data.position?.lng !== undefined) {
    updatePosition(data.position.lat, data.position.lng);
  }
}