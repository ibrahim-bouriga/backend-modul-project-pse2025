import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/orders/:orderNumber - Get order details

router.get('/:orderNumber', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: `No order found with number: ${orderNumber}`,
      });
    }
    
    res.json(order);
  } catch (error) {
    console.error('[Orders API] Error fetching order:', error);
    res.status(500).json({
      error: 'Failed to fetch order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
