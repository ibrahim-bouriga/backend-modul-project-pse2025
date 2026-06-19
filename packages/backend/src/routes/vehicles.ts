import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/vehicles/:userId - Get user's vehicles
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const vehicles = await prisma.userVehicle.findMany({
      where: { userId },
      include: {
        status: {
          orderBy: { timestamp: 'desc' },
          take: 1, // Get only the latest status
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      userId,
      vehicles,
      total: vehicles.length,
    });
  } catch (error) {
    console.error('[Vehicles API] Error fetching user vehicles:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicles',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/vehicles/:id/status - Get latest vehicle status
router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // First check if vehicle exists
    const vehicle = await prisma.userVehicle.findUnique({
      where: { id },
    });
    
    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: `No vehicle found with ID: ${id}`,
      });
    }
    
    // Get the latest status
    const latestStatus = await prisma.vehicleStatus.findFirst({
      where: { vehicleId: id },
      orderBy: { timestamp: 'desc' },
    });
    
    if (!latestStatus) {
      return res.status(404).json({
        error: 'No status data available',
        message: 'This vehicle has no status records yet',
      });
    }
    
    res.json({
      vehicle: {
        id: vehicle.id,
        nickname: vehicle.nickname,
        vin: vehicle.vin,
      },
      status: latestStatus,
    });
  } catch (error) {
    console.error('[Vehicles API] Error fetching vehicle status:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/vehicles/:id/history - Get status history
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0', startDate, endDate } = req.query;
    
    // First check if vehicle exists
    const vehicle = await prisma.userVehicle.findUnique({
      where: { id },
    });
    
    if (!vehicle) {
      return res.status(404).json({
        error: 'Vehicle not found',
        message: `No vehicle found with ID: ${id}`,
      });
    }
    
    // Build where clause for date filtering
    const whereClause: any = { vehicleId: id };
    
    if (startDate || endDate) {
      whereClause.timestamp = {};
      if (startDate) {
        whereClause.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.timestamp.lte = new Date(endDate as string);
      }
    }
    
    // Get status history with pagination
    const [history, total] = await Promise.all([
      prisma.vehicleStatus.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.vehicleStatus.count({
        where: whereClause,
      }),
    ]);
    
    res.json({
      vehicle: {
        id: vehicle.id,
        nickname: vehicle.nickname,
        vin: vehicle.vin,
      },
      history,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + history.length < total,
      },
    });
  } catch (error) {
    console.error('[Vehicles API] Error fetching vehicle history:', error);
    res.status(500).json({
      error: 'Failed to fetch vehicle history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/vehicles - Register new vehicle
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, carId, nickname, vin, purchaseDate } = req.body;
    
    // Validate required fields
    if (!userId || !carId || !vin) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId, carId, and vin are required',
      });
    }
    
    // Check if VIN already exists
    const existingVehicle = await prisma.userVehicle.findUnique({
      where: { vin },
    });
    
    if (existingVehicle) {
      return res.status(409).json({
        error: 'Vehicle already registered',
        message: `A vehicle with VIN ${vin} is already registered`,
      });
    }
    
    // Check if car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
    });
    
    if (!car) {
      return res.status(404).json({
        error: 'Car model not found',
        message: `No car found with ID: ${carId}`,
      });
    }
    
    // Create the vehicle
    const vehicle = await prisma.userVehicle.create({
      data: {
        userId,
        carId,
        nickname: nickname || `${car.make} ${car.model}`,
        vin,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      },
    });
    
    res.status(201).json({
      message: 'Vehicle registered successfully',
      vehicle,
    });
  } catch (error) {
    console.error('[Vehicles API] Error registering vehicle:', error);
    res.status(500).json({
      error: 'Failed to register vehicle',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
