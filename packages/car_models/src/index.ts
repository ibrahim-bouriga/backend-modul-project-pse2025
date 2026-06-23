import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './db.js';
import { seed } from './seed.js';

const app = express();
const PORT = process.env.PORT || 4001;
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000';
const BUCKET = 'car-models';

app.use(cors());
app.use(express.json());

app.get('/api/car-models', async (_req: Request, res: Response) => {
    const cars = await prisma.carModel.findMany({ orderBy: { year: 'desc' } });
    res.json(cars.map(car => ({
        ...car,
        imageUrl: `${MINIO_PUBLIC_URL}/${BUCKET}/${car.imageKey}`,
    })));
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'car_models' });
});

async function main() {
    await seed();
    app.listen(PORT, () => {
        console.log(`car_models service running on http://localhost:${PORT}`);
    });
}

main();

