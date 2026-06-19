import { Router, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../db.js';

const router = Router();

// Validation Schemas

const ProductFiltersSchema = z.object({
  category: z.string().optional(),
  available: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// GET /api/products - List all products with filters and pagination

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = ProductFiltersSchema.parse(req.query);
    
    // Build where clause
    const where: any = {};
    
    if (filters.category) {
      where.category = { contains: filters.category, mode: 'insensitive' };
    }
    
    if (filters.available !== undefined) {
      where.available = filters.available;
    }
    
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }
    
    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit;
    
    // Get total count for pagination
    const total = await prisma.product.count({ where });
    
    // Get products with pagination
    const products = await prisma.product.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
    
    res.json({
      data: products,
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
    
    console.error('[Products API] Error listing products:', error);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/products/:id - Get single product details

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `No product found with id: ${id}`,
      });
    }
    
    res.json(product);
  } catch (error) {
    console.error('[Products API] Error fetching product:', error);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
