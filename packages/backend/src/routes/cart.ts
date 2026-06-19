import { Router, Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../db.js';

const router = Router();

// Validation Schemas

const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

const CreateOrderSchema = z.object({
  customerEmail: z.string().email().optional(),
  customerName: z.string().min(1).optional(),
});

// GET /api/cart/:sessionId - Get cart

router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }
    
    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);
    
    res.json({
      cart,
      summary: {
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: subtotal.toFixed(2),
      },
    });
  } catch (error) {
    console.error('[Cart API] Error fetching cart:', error);
    res.status(500).json({
      error: 'Failed to fetch cart',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/cart/:sessionId - Add item to cart

router.post('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const data = AddToCartSchema.parse(req.body);
    
    // Verify product exists and is available
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: `No product found with id: ${data.productId}`,
      });
    }
    
    if (!product.available) {
      return res.status(400).json({
        error: 'Product not available',
        message: 'This product is currently unavailable',
      });
    }
    
    if (product.stock < data.quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Only ${product.stock} items available`,
      });
    }
    
    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
      });
    }
    
    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: data.productId,
        },
      },
    });
    
    let cartItem;
    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + data.quantity;
      
      if (product.stock < newQuantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Only ${product.stock} items available`,
        });
      }
      
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          quantity: data.quantity,
        },
        include: { product: true },
      });
    }
    
    res.status(201).json({
      message: 'Item added to cart',
      cartItem,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.issues,
      });
    }
    
    console.error('[Cart API] Error adding to cart:', error);
    res.status(500).json({
      error: 'Failed to add item to cart',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// PUT /api/cart/:sessionId/:itemId - Update cart item quantity

router.put('/:sessionId/:itemId', async (req: Request, res: Response) => {
  try {
    const { sessionId, itemId } = req.params;
    const data = UpdateCartItemSchema.parse(req.body);
    
    // Verify cart exists
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
    });
    
    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found',
      });
    }
    
    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });
    
    if (!cartItem || cartItem.cartId !== cart.id) {
      return res.status(404).json({
        error: 'Cart item not found',
      });
    }
    
    // Check stock
    if (cartItem.product.stock < data.quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        message: `Only ${cartItem.product.stock} items available`,
      });
    }
    
    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: data.quantity },
      include: { product: true },
    });
    
    res.json({
      message: 'Cart item updated',
      cartItem: updatedItem,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.issues,
      });
    }
    
    console.error('[Cart API] Error updating cart item:', error);
    res.status(500).json({
      error: 'Failed to update cart item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/cart/:sessionId/:itemId - Remove item from cart

router.delete('/:sessionId/:itemId', async (req: Request, res: Response) => {
  try {
    const { sessionId, itemId } = req.params;
    
    // Verify cart exists
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
    });
    
    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found',
      });
    }
    
    // Verify cart item belongs to this cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    
    if (!cartItem || cartItem.cartId !== cart.id) {
      return res.status(404).json({
        error: 'Cart item not found',
      });
    }
    
    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    });
    
    res.json({
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('[Cart API] Error removing cart item:', error);
    res.status(500).json({
      error: 'Failed to remove cart item',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/cart/:sessionId - Clear cart

router.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Delete all cart items (cart will remain)
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
    });
    
    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found',
      });
    }
    
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    
    res.json({
      message: 'Cart cleared',
    });
  } catch (error) {
    console.error('[Cart API] Error clearing cart:', error);
    res.status(500).json({
      error: 'Failed to clear cart',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/cart/:sessionId/checkout - Create order from cart

router.post('/:sessionId/checkout', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const data = CreateOrderSchema.parse(req.body);
    
    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    
    if (!cart) {
      return res.status(404).json({
        error: 'Cart not found',
      });
    }
    
    if (cart.items.length === 0) {
      return res.status(400).json({
        error: 'Cart is empty',
        message: 'Cannot checkout with an empty cart',
      });
    }
    
    // Verify stock for all items
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          error: 'Insufficient stock',
          message: `Product "${item.product.name}" has insufficient stock`,
        });
      }
    }
    
    // Calculate total
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (Number(item.product.price) * item.quantity);
    }, 0);
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          sessionId,
          totalAmount,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      
      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
      
      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      
      return newOrder;
    });
    
    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.issues,
      });
    }
    
    console.error('[Cart API] Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
