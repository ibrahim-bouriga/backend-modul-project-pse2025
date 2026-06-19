import { Router, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../db.js';

const router = Router();

// Validation Schemas

const CarFiltersSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().int().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  available: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

const CreateConfigurationSchema = z.object({
  configuration: z.object({
    colorId: z.string().min(1),
    wheelsId: z.string().min(1),
    interiorId: z.string().min(1),
    extraIds: z.array(z.string()).optional().default([]),
  }),
  totalPrice: z.number().positive(),
  modelUrl: z.string().url().optional(),
});

// GET /api/cars - List all cars with filters and pagination

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = CarFiltersSchema.parse(req.query);
    
    // Build where clause
    const where: any = {};
    
    if (filters.make) {
      where.make = { contains: filters.make, mode: 'insensitive' };
    }
    
    if (filters.model) {
      where.model = { contains: filters.model, mode: 'insensitive' };
    }
    
    if (filters.year) {
      where.year = filters.year;
    }
    
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters.minPrice !== undefined) {
        where.basePrice.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.basePrice.lte = filters.maxPrice;
      }
    }
    
    if (filters.available !== undefined) {
      where.available = filters.available;
    }
    
    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;
    
    // Get total count for pagination
    const total = await prisma.car.count({ where });
    
    // Get cars with pagination
    const cars = await prisma.car.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [
        { make: 'asc' },
        { model: 'asc' },
      ],
      include: {
        _count: {
          select: { configurations: true },
        },
      },
    });
    
    res.json({
      data: cars,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.issues,
      });
    }
    
    console.error('[Cars API] Error listing cars:', error);
    res.status(500).json({
      error: 'Failed to fetch cars',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/cars/:id - Get single car details

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const car = await prisma.car.findUnique({
      where: { id },
      include: {
        configurations: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Limit to 10 most recent configurations
        },
      },
    });
    
    if (!car) {
      return res.status(404).json({
        error: 'Car not found',
        message: `No car found with id: ${id}`,
      });
    }
    
    res.json(car);
  } catch (error) {
    console.error('[Cars API] Error fetching car:', error);
    res.status(500).json({
      error: 'Failed to fetch car',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/cars/:id/configs - Get available configurations for a car

router.get('/:id/configs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verify car exists
    const car = await prisma.car.findUnique({
      where: { id },
      select: { id: true },
    });
    
    if (!car) {
      return res.status(404).json({
        error: 'Car not found',
        message: `No car found with id: ${id}`,
      });
    }
    
    // Get all configurations for this car
    const configurations = await prisma.carConfiguration.findMany({
      where: { carId: id },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      carId: id,
      configurations,
      total: configurations.length,
    });
  } catch (error) {
    console.error('[Cars API] Error fetching configurations:', error);
    res.status(500).json({
      error: 'Failed to fetch configurations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/cars/:id/configs - Create custom configuration

router.post('/:id/configs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verify car exists
    const car = await prisma.car.findUnique({
      where: { id },
      select: { id: true, available: true },
    });
    
    if (!car) {
      return res.status(404).json({
        error: 'Car not found',
        message: `No car found with id: ${id}`,
      });
    }
    
    if (!car.available) {
      return res.status(400).json({
        error: 'Car not available',
        message: 'This car is not currently available for configuration',
      });
    }
    
    // Validate request body
    const configData = CreateConfigurationSchema.parse(req.body);
    
    // Create configuration
    const configuration = await prisma.carConfiguration.create({
      data: {
        carId: id,
        color: configData.configuration.colorId,
        wheels: configData.configuration.wheelsId,
        interior: configData.configuration.interiorId,
        extras: { extraIds: configData.configuration.extraIds } as any,
        price: configData.totalPrice,
        modelUrl: configData.modelUrl,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      configurationId: configuration.id,
      totalPrice: configuration.price,
      configuration,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid configuration data',
        details: error.issues,
      });
    }
    
    console.error('[Cars API] Error creating configuration:', error);
    res.status(500).json({
      error: 'Failed to create configuration',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
