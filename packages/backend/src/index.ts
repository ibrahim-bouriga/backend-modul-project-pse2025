import express, { Request, Response } from 'express';
import cors from 'cors';
import carsRouter from './routes/cars.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import vehiclesRouter from './routes/vehicles.js';
import { setupSwagger } from './swagger.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

// API Routes
app.use('/api/cars', carsRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/vehicles', vehiclesRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Backend server is running!',
        timestamp: new Date().toISOString()
    });
});

// API info
app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to the Backend API',
        version: '1.0.0',
        endpoints: [
            { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
            { path: '/api', method: 'GET', description: 'API information' },
            { path: '/api/cars', method: 'GET', description: 'List all cars with filters' },
            { path: '/api/cars/:id', method: 'GET', description: 'Get car details' },
            { path: '/api/cars/:id/configs', method: 'GET', description: 'Get car configurations' },
            { path: '/api/cars/:id/configs', method: 'POST', description: 'Create car configuration' },
            { path: '/api/products', method: 'GET', description: 'List all products with filters' },
            { path: '/api/products/:id', method: 'GET', description: 'Get product details' },
            { path: '/api/cart/:sessionId', method: 'GET', description: 'Get shopping cart' },
            { path: '/api/cart/:sessionId', method: 'POST', description: 'Add item to cart' },
            { path: '/api/cart/:sessionId/:itemId', method: 'PUT', description: 'Update cart item quantity' },
            { path: '/api/cart/:sessionId/:itemId', method: 'DELETE', description: 'Remove item from cart' },
            { path: '/api/cart/:sessionId', method: 'DELETE', description: 'Clear cart' },
            { path: '/api/cart/:sessionId/checkout', method: 'POST', description: 'Checkout and create order' },
            { path: '/api/orders/:orderNumber', method: 'GET', description: 'Get order details' },
            { path: '/api/vehicles/:userId', method: 'GET', description: 'Get user vehicles' },
            { path: '/api/vehicles/:id/status', method: 'GET', description: 'Get latest vehicle status' },
            { path: '/api/vehicles/:id/history', method: 'GET', description: 'Get vehicle status history' },
            { path: '/api/vehicles', method: 'POST', description: 'Register new vehicle' },
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});

