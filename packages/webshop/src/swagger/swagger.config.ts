import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Webshop API',
      version: '1.0.0',
      description: 'AutoDrive Webshop API - E-commerce backend for merchandise products',
      contact: {
        name: 'API Support',
        email: 'support@autodrive.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:4003',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and service information endpoints',
      },
      {
        name: 'Products',
        description: 'Product catalog management',
      },
      {
        name: 'Categories',
        description: 'Product category management',
      },
      {
        name: 'Cart',
        description: 'Shopping cart operations',
      },
      {
        name: 'Orders',
        description: 'Order management and retrieval',
      },
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'MyPSECar Hoodie Fleece',
            },
            slug: {
              type: 'string',
              description: 'URL-friendly product identifier',
              example: 'mypsecar-hoodie-fleece',
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'Comfortable fleece hoodie with MyPSECar branding',
            },
            basePrice: {
              type: 'number',
              format: 'decimal',
              description: 'Base price of the product',
              example: 59.99,
            },
            imageUrl: {
              type: 'string',
              description: 'Product image URL',
              example: '/products/mypsecar-hoodie-fleece.png',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the product is active',
              example: true,
            },
            categoryId: {
              type: 'integer',
              description: 'Category ID',
              example: 1,
            },
            category: {
              $ref: '#/components/schemas/Category',
            },
            variants: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ProductVariant',
              },
            },
          },
        },
        ProductVariant: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Variant ID',
              example: 1,
            },
            productId: {
              type: 'integer',
              description: 'Product ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Variant name (e.g., size, color)',
              example: 'Small',
            },
            sku: {
              type: 'string',
              description: 'Stock keeping unit',
              example: 'HOODIE-S',
            },
            priceDelta: {
              type: 'number',
              format: 'decimal',
              description: 'Price difference from base price',
              example: 0,
            },
            stock: {
              type: 'integer',
              description: 'Available stock',
              example: 50,
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the variant is active',
              example: true,
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Category ID',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Apparel',
            },
            slug: {
              type: 'string',
              description: 'URL-friendly category identifier',
              example: 'apparel',
            },
          },
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Cart ID',
              example: 1,
            },
            sessionId: {
              type: 'string',
              description: 'Session identifier',
              example: 'abc123',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem',
              },
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Cart expiration timestamp',
              example: '2024-12-31T23:59:59Z',
            },
          },
        },
        CartItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Cart item ID',
              example: 1,
            },
            cartId: {
              type: 'integer',
              description: 'Cart ID',
              example: 1,
            },
            variantId: {
              type: 'integer',
              description: 'Product variant ID',
              example: 1,
            },
            quantity: {
              type: 'integer',
              description: 'Item quantity',
              example: 2,
            },
            variant: {
              $ref: '#/components/schemas/ProductVariant',
            },
          },
        },
        CartResponse: {
          type: 'object',
          properties: {
            cart: {
              $ref: '#/components/schemas/Cart',
            },
            summary: {
              type: 'object',
              properties: {
                itemCount: {
                  type: 'integer',
                  description: 'Total number of items',
                  example: 2,
                },
                subtotal: {
                  type: 'string',
                  description: 'Subtotal amount',
                  example: '119.98',
                },
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Order ID',
              example: 1,
            },
            orderNumber: {
              type: 'string',
              description: 'Unique order number',
              example: 'ORD-1234567890-ABC123',
            },
            sessionId: {
              type: 'string',
              description: 'Session identifier',
              example: 'abc123',
            },
            totalAmount: {
              type: 'number',
              format: 'decimal',
              description: 'Total order amount',
              example: 119.98,
            },
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'Customer email',
              example: 'customer@example.com',
            },
            customerName: {
              type: 'string',
              description: 'Customer name',
              example: 'John Doe',
            },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'completed', 'cancelled'],
              description: 'Order status',
              example: 'pending',
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Order creation timestamp',
              example: '2024-12-31T23:59:59Z',
            },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Order item ID',
              example: 1,
            },
            orderId: {
              type: 'integer',
              description: 'Order ID',
              example: 1,
            },
            variantId: {
              type: 'integer',
              description: 'Product variant ID',
              example: 1,
            },
            quantity: {
              type: 'integer',
              description: 'Item quantity',
              example: 2,
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Price at time of order',
              example: 59.99,
            },
            variant: {
              $ref: '#/components/schemas/ProductVariant',
            },
          },
        },
        AddToCartRequest: {
          type: 'object',
          required: ['variantId'],
          properties: {
            variantId: {
              type: 'integer',
              description: 'Product variant ID',
              example: 1,
            },
            quantity: {
              type: 'integer',
              description: 'Quantity to add',
              default: 1,
              example: 2,
            },
          },
        },
        UpdateCartItemRequest: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: {
              type: 'integer',
              description: 'New quantity',
              example: 3,
            },
          },
        },
        CheckoutRequest: {
          type: 'object',
          properties: {
            customerEmail: {
              type: 'string',
              format: 'email',
              description: 'Customer email address',
              example: 'customer@example.com',
            },
            customerName: {
              type: 'string',
              description: 'Customer name',
              example: 'John Doe',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Resource not found',
            },
            message: {
              type: 'string',
              description: 'Detailed error description',
              example: 'The requested resource could not be found',
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Validation error details',
            },
          },
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
            },
            message: {
              type: 'string',
              example: 'Webshop backend is running!',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-12-31T23:59:59Z',
            },
          },
        },
        ApiInfo: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Welcome to the AutoDrive Webshop API',
            },
            version: {
              type: 'string',
              example: '1.0.0',
            },
            endpoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: {
                    type: 'string',
                  },
                  method: {
                    type: 'string',
                  },
                  description: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/swagger/*.docs.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

