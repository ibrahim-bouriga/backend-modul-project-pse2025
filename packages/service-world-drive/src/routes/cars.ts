import { Router } from 'express';
import prisma from '../db';

type Car = { id: string; name: string; color: string; topic: string };
import { getLatest, addSseClient, removeSseClient } from '../services/telemetry-broadcast.service';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const cars = await prisma.car.findMany({ orderBy: { name: 'asc' } });

    const carsWithLive = (cars as Car[]).map((car) => ({ ...car, isLive: getLatest(car.id) !== null }));
    const result       = carsWithLive.filter((car) => car.id !== 'gps' || car.isLive);

    res.json(result);
  } catch (err) {
    console.error('[Cars] Failed to fetch cars:', (err as Error).message);
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
