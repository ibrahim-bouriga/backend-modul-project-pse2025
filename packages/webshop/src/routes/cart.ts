import { Router, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../db.js';
import type { Prisma } from '../generated/prisma/client.js';
import { redis, safeRedisDel } from '../redis.js';

const router = Router();

// Validation Schemas

const AddToCartSchema = z.object({
    variantId: z.number().int().positive(),
    quantity: z.number().int().positive().default(1),
});

const UpdateCartItemSchema = z.object({
    quantity: z.number().int().positive(),
});

const CheckoutSchema = z.object({
    customerEmail: z.string().email().optional(),
    customerName: z.string().min(1).optional(),
});

// GET /api/cart - Warenkorb laden

router.get('/', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const cacheKey = `cart:${sessionId}`;

        // Erst im Cache nachschauen, aber: Redis-Fehler dürfen den Request nicht blockieren, falls Redis ncith erreichbar
        let cached: string | null = null;
        try {
            cached = await redis.get(cacheKey);
        } catch (redisError) {
            console.error('[Cart API] Redis unavailable, falling back to database:', redisError);
        }

if (cached) {
    res.json(JSON.parse(cached));
    return;
}
        //wenn nicht im Cache, dann aus der DB laden
        const cart = await prisma.cart.findUnique({
            where: { sessionId },
            include: {
                items: {
                    include: {
                        variant: { include: { product: true } },
                    },
                },
            },
        });

        if (!cart) {
            res.json({ items: [], summary: { itemCount: 0, subtotal: '0.00' } });
            return;
        }

        const subtotal = cart.items.reduce((sum: number, item: typeof cart.items[number]) => {
            const price = Number(item.variant.product.basePrice) + Number(item.variant.priceDelta);
            return sum + price * item.quantity;
        }, 0);

        const itemCount = cart.items.reduce((sum: number, item: typeof cart.items[number]) => sum + item.quantity, 0);

        const responseBody = {
            cart,
            summary: {
                itemCount,
                subtotal: subtotal.toFixed(2),
            },
        };

        //Cache befüllen (passend zur Cart-Lebensdauer); aber: ohne Request zu blockieren, falls Redis nciht erreichbar
        try {
            await redis.set(cacheKey, JSON.stringify(responseBody), { EX: 300 });
        } catch (redisError) {
            console.error('[Cart API] Failed to write to Redis cache:', redisError);
        }

res.json(responseBody);

    } catch (error) {
        console.error('[Cart API] Error fetching cart:', error);
        res.status(500).json({
            error: 'Failed to fetch cart',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/cart/items - Produkt-Variante hinzufügen

router.post('/items', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const data = AddToCartSchema.parse(req.body);

        const variant = await prisma.productVariant.findUnique({
            where: { id: data.variantId },
            include: { product: true },
        });

        if (!variant) {
            res.status(404).json({
                error: 'Variant not found',
                message: `No variant found with id: ${data.variantId}`,
            });
            return;
        }

        if (!variant.product.isActive) {
            res.status(400).json({
                error: 'Product not available',
                message: 'This product is currently unavailable',
            });
            return;
        }

        if (variant.stock < data.quantity) {
            res.status(400).json({
                error: 'Insufficient stock',
                message: `Only ${variant.stock} items available`,
            });
            return;
        }

        let cart = await prisma.cart.findUnique({ where: { sessionId } });
        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    sessionId,
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });
        }

        const existingItem = await prisma.cartItem.findUnique({
            where: { cartId_variantId: { cartId: cart.id, variantId: data.variantId } },
        });

        let cartItem;
        if (existingItem) {
            const newQuantity = existingItem.quantity + data.quantity;

            if (variant.stock < newQuantity) {
                res.status(400).json({
                    error: 'Insufficient stock',
                    message: `Only ${variant.stock} items available`,
                });
                return;
            }

            cartItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
                include: { variant: { include: { product: true } } },
            });
        } else {
            cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    variantId: data.variantId,
                    quantity: data.quantity,
                },
                include: { variant: { include: { product: true } } },
            });
        }

        await safeRedisDel(`cart:${sessionId}`);

        res.status(201).json({
            message: 'Item added to cart',
            cartItem,
        });

    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Invalid request data',
                details: error.issues,
            });
            return;
        }

        console.error('[Cart API] Error adding to cart:', error);
        res.status(500).json({
            error: 'Failed to add item to cart',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// PATCH /api/cart/items/:itemId - Menge ändern

router.patch('/items/:itemId', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const itemId = Number(req.params.itemId);
        const data = UpdateCartItemSchema.parse(req.body);

        const cart = await prisma.cart.findUnique({ where: { sessionId } });
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { variant: true },
        });

        if (!cartItem || cartItem.cartId !== cart.id) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        if (cartItem.variant.stock < data.quantity) {
            res.status(400).json({
                error: 'Insufficient stock',
                message: `Only ${cartItem.variant.stock} items available`,
            });
            return;
        }

        const updatedItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: data.quantity },
            include: { variant: { include: { product: true } } },
        });

        await safeRedisDel(`cart:${sessionId}`);
        res.json({ message: 'Cart item updated', cartItem: updatedItem });

    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Invalid request data',
                details: error.issues,
            });
            return;
        }

        console.error('[Cart API] Error updating cart item:', error);
        res.status(500).json({
            error: 'Failed to update cart item',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// DELETE /api/cart/items/:itemId - Item entfernen

router.delete('/items/:itemId', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const itemId = Number(req.params.itemId);

        const cart = await prisma.cart.findUnique({ where: { sessionId } });
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        const cartItem = await prisma.cartItem.findUnique({ where: { id: itemId } });

        if (!cartItem || cartItem.cartId !== cart.id) {
            res.status(404).json({ error: 'Cart item not found' });
            return;
        }

        await prisma.cartItem.delete({ where: { id: itemId } });

        await safeRedisDel(`cart:${sessionId}`);

        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        console.error('[Cart API] Error removing cart item:', error);
        res.status(500).json({
            error: 'Failed to remove cart item',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// DELETE /api/cart - Warenkorb komplett leeren

router.delete('/', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;

        const cart = await prisma.cart.findUnique({ where: { sessionId } });
        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        await safeRedisDel(`cart:${sessionId}`);
        res.json({ message: 'Cart cleared' });

    } catch (error) {
        console.error('[Cart API] Error clearing cart:', error);
        res.status(500).json({
            error: 'Failed to clear cart',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/cart/checkout - Bestellung aus Warenkorb erzeugen

router.post('/checkout', async (req: Request, res: Response) => {
    try {
        const sessionId = (req as any).sessionId;
        const data = CheckoutSchema.parse(req.body);

        const cart = await prisma.cart.findUnique({
            where: { sessionId },
            include: {
                items: {
                    include: { variant: { include: { product: true } } },
                },
            },
        });

        if (!cart) {
            res.status(404).json({ error: 'Cart not found' });
            return;
        }

        if (cart.items.length === 0) {
            res.status(400).json({
                error: 'Cart is empty',
                message: 'Cannot checkout with an empty cart',
            });
            return;
        }

        for (const item of cart.items) {
            if (item.variant.stock < item.quantity) {
                res.status(400).json({
                    error: 'Insufficient stock',
                    message: `Product "${item.variant.product.name}" has insufficient stock`,
                });
                return;
            }
        }

        const totalAmount = cart.items.reduce((sum: number, item: typeof cart.items[number]) => {
            const price = Number(item.variant.product.basePrice) + Number(item.variant.priceDelta);
            return sum + price * item.quantity;
        }, 0);

        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

        const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    sessionId,
                    totalAmount,
                    customerEmail: data.customerEmail,
                    customerName: data.customerName,
                    items: {
                        create: cart.items.map((item: typeof cart.items[number]) => ({
                            variantId: item.variantId,
                            quantity: item.quantity,
                            price: Number(item.variant.product.basePrice) + Number(item.variant.priceDelta),
                        })),
                    },
                },
                include: {
                    items: { include: { variant: { include: { product: true } } } },
                },
            });

            for (const item of cart.items) {
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

            return newOrder;
        });

        await safeRedisDel(`cart:${sessionId}`);
        res.status(201).json({ message: 'Order created successfully', order });

    } catch (error) {
        if (error instanceof ZodError) {
            res.status(400).json({
                error: 'Invalid request data',
                details: error.issues,
            });
            return;
        }

        console.error('[Cart API] Error creating order:', error);
        res.status(500).json({
            error: 'Failed to create order',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;