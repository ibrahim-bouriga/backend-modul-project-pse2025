import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { sessionMiddleware } from './middleware/session.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import categoriesRouter from './routes/categories.js';
import { startCartCleanupJob } from './jobs/cleanupExpiredCarts.js';
import { connectRedis } from './redis.js';
import { seed } from './seed.js';
import { swaggerSpec } from './swagger/swagger.config.js';

const app = express();
const PORT = Number(process.env.PORT) || 4003;

//blockiert standardmäßig Requests anderer Origin
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
//parst eingehende Json-Bodies & cookies
app.use(express.json());
app.use(cookieParser());
//Middelware
app.use(sessionMiddleware);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/categories', categoriesRouter);


//ENDPOINTS
// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Webshop backend is running!',
        timestamp: new Date().toISOString()
    });
});

// API info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to the AutoDrive Webshop API',
        version: '1.0.0',
        endpoints: [
            { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
            { path: '/api', method: 'GET', description: 'API information' },
            { path: '/api/products', method: 'GET', description: 'List all products with filters' },
            { path: '/api/products/:slug', method: 'GET', description: 'Get product details' },
            { path: '/api/cart', method: 'GET', description: 'Get shopping cart' },
            { path: '/api/cart/items', method: 'POST', description: 'Add item to cart' },
            { path: '/api/cart/items/:itemId', method: 'PATCH', description: 'Update cart item quantity' },
            { path: '/api/cart/items/:itemId', method: 'DELETE', description: 'Remove item from cart' },
            { path: '/api/cart', method: 'DELETE', description: 'Clear cart' },
            { path: '/api/cart/checkout', method: 'POST', description: 'Checkout and create order' },
            { path: '/api/orders/:orderNumber', method: 'GET', description: 'Get order details' },
            { path: '/api/categories', method: 'GET', description: 'List all categories' },
        ]
    });
});

app.listen(PORT, async () => {
    console.log(`Webshop Backend läuft auf http://localhost:${PORT}`);
    console.log(`API verfügbar unter http://localhost:${PORT}/api`);
    await connectRedis();
    await seed();
    startCartCleanupJob();
});

