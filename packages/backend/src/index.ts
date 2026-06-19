import express, { Request, Response } from 'express';
import cors from 'cors';
import carsRouter from './routes/cars.js';
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
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});

