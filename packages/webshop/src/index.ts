import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        message: 'Backend server is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/api', (req: Request, res: Response) => {
    res.json({
        message: 'Welcome to the Backend API',
        version: '1.0.0',
        endpoints: [
            { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
            { path: '/api', method: 'GET', description: 'API information' }
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});

