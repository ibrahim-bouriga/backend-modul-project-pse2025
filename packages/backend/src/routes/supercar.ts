import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

/**
 * GET /api/supercar/location
 * Get current super car location (latest entry)
 */
router.get('/location', async (req, res) => {
  try {
    const supercar = await prisma.superCar.findFirst({
      where: { active: true },
      orderBy: { timestamp: 'desc' },
    });

    if (!supercar) {
      return res.status(404).json({
        error: 'No active super car found',
      });
    }

    res.json({
      id: supercar.id,
      name: supercar.name,
      latitude: supercar.latitude,
      longitude: supercar.longitude,
      speed: supercar.speed,
      heading: supercar.heading,
      timestamp: supercar.timestamp,
      active: supercar.active,
    });
  } catch (error) {
    console.error('Error fetching super car location:', error);
    res.status(500).json({
      error: 'Failed to fetch super car location',
    });
  }
});

/**
 * GET /api/supercar/history
 * Get super car location history
 * Query params:
 * - limit: number of records (default: 100, max: 1000)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 */
router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(
      parseInt(req.query.limit as string) || 100,
      1000
    );
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    // Build where clause
    const where: any = { active: true };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const history = await prisma.superCar.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        speed: true,
        heading: true,
        timestamp: true,
      },
    });

    res.json({
      count: history.length,
      limit,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      data: history,
    });
  } catch (error) {
    console.error('Error fetching super car history:', error);
    res.status(500).json({
      error: 'Failed to fetch super car history',
    });
  }
});

export default router;
