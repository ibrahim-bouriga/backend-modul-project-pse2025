/*
routes for products
*/

import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/products
router.get('/', async (req: Request, res: Response) => {
    const { category, sort } = req.query;

    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            ...(category ? { category: { slug: category as string } } : {}),
        },
        include: {
            category: true,
            variants: true,
        },
        orderBy:

            sort === 'price_asc' ? { basePrice: 'asc' }
            : sort === 'price_desc' ? { basePrice: 'desc' }
            : { id: 'asc' },
    });

    res.json(products);
});

// GET /api/products/:slug
router.get('/:slug', async (req: Request, res: Response) => {
    const product = await prisma.product.findUnique({
        where: { slug: req.params.slug },
        include: {
            category: true,
            variants: true,
        },
    });

    if (!product) {
        res.status(404).json({ error: 'Produkt nicht gefunden' });
        return;
    }

    res.json(product);
});

export default router;