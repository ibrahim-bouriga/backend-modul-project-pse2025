import { Router } from 'express';
import { randomUUID } from 'crypto';
import prisma from '../db';
import { getLatest, addSseClient, removeSseClient } from '../services/telemetry-broadcast.service';

type Car = { id: string; name: string; color: string; topic: string; source: string };

const router = Router();

const GPS_INACTIVE_MS = 5 * 60_000; // hide GPS cars inactive for more than 5 minutes

function isRecentlyActive(carId: string): boolean {
  const latest = getLatest(carId);
  if (!latest) return false;
  return Date.now() - new Date(latest.timestamp).getTime() < GPS_INACTIVE_MS;
}

router.get('/', async (_req, res) => {
  try {
    const cars = await prisma.car.findMany({ orderBy: { name: 'asc' } });

    const result = (cars as Car[])
      .filter((car) => car.source === 'simulator' || isRecentlyActive(car.id))
      .map((car) => ({ ...car, isLive: getLatest(car.id) !== null }));

    res.json(result);
  } catch (err) {
    console.error('[Cars] Failed to fetch cars:', (err as Error).message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { color } = req.body as { color?: string };
    if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      res.status(400).json({ error: 'color must be a valid hex value (e.g. #f97316)' });
      return;
    }

    const existing = await prisma.car.findMany({ select: { name: true } });
    const usedLetters = new Set(
      existing.map((c: { name: string }) => c.name.match(/^Car ([A-Z])$/)?.[1]).filter(Boolean),
    );
    let letter = 'C';
    for (let code = 67; code <= 90; code++) {
      const l = String.fromCharCode(code);
      if (!usedLetters.has(l)) { letter = l; break; }
    }

    const id    = `gps-${randomUUID().slice(0, 8)}`;
    const name  = `Car ${letter}`;
    const topic = `psecars/worlddrive/${id}/telemetry`;

    const car = await prisma.car.create({ data: { id, name, color, topic, source: 'gps' } });
    res.status(201).json(car);
  } catch (err) {
    console.error('[Cars] Failed to register GPS car:', (err as Error).message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cars/:carId/stream — SSE live telemetry stream
router.get('/:carId/stream', (req, res) => {
  const { carId } = req.params;

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  // Send last known position immediately so the client doesn't wait for the next MQTT message
  const lastKnown = getLatest(carId);
  if (lastKnown) res.write(`data: ${JSON.stringify(lastKnown)}\n\n`);

  addSseClient(carId, res);
  req.on('close', () => removeSseClient(carId, res));
});

// GET /api/cars/:carId/trips — last 5 completed trips for a car
router.get('/:carId/trips', async (req, res) => {
  try {
    const { carId } = req.params;

    const trips = await prisma.trip.findMany({
      where:   { carId, endedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
      take:    5,
      select: {
        id:        true,
        startedAt: true,
        endedAt:   true,
        _count:    { select: { waypoints: true } },
      },
    });

    res.json(trips);
  } catch (err) {
    console.error('[Cars] Failed to fetch trips:', (err as Error).message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
