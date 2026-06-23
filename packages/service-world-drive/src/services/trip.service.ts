import prisma from '../db';
import type { VehicleTelemetry } from '../types';

const INACTIVITY_MS = 30_000;
const MIN_SPEED_MS  = 0.5 / 3.6; // 0.5 km/h in m/s

interface CarState {
  activeTripId:    string | null;
  inactivityTimer: ReturnType<typeof setTimeout> | null;
}

const carStates = new Map<string, CarState>();

function getOrCreateState(carId: string): CarState {
  if (!carStates.has(carId)) {
    carStates.set(carId, { activeTripId: null, inactivityTimer: null });
  }
  return carStates.get(carId)!;
}

async function closeTrip(carId: string): Promise<void> {
  const state = carStates.get(carId);
  if (!state?.activeTripId) return;

  await prisma.trip.update({
    where: { id: state.activeTripId },
    data:  { endedAt: new Date() },
  });

  state.activeTripId    = null;
  state.inactivityTimer = null;
}

export async function handleTelemetry(carId: string, telemetry: VehicleTelemetry): Promise<void> {
  const state    = getOrCreateState(carId);
  const isMoving = telemetry.speed == null || telemetry.speed >= MIN_SPEED_MS;

  if (state.inactivityTimer) clearTimeout(state.inactivityTimer);
  state.inactivityTimer = setTimeout(() => closeTrip(carId), INACTIVITY_MS);

  if (!state.activeTripId && isMoving) {
    const trip = await prisma.trip.create({ data: { carId } });
    state.activeTripId = trip.id;
  }

  if (state.activeTripId) {
    await prisma.waypoint.create({
      data: {
        tripId:    state.activeTripId,
        lat:       telemetry.lat,
        lng:       telemetry.lng,
        speed:     telemetry.speed,
        timestamp: new Date(telemetry.timestamp),
      },
    });
  }
}
