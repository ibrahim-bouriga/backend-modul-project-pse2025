import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/categories

router.get('/', async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
        });

        res.json(categories);
    } catch (error) {
        console.error('[Categories API] Error fetching categories:', error);
        res.status(500).json({
            error: 'Failed to fetch categories',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;