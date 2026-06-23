import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import carsRouter         from './routes/cars';
import { connectMqtt }    from './mqtt/subscriber';
import prisma             from './db';
import { runSeed }        from '../scripts/seed';
import { startSimulator } from '../scripts/simulate';

const app  = express();
const PORT = process.env.PORT ?? 4003;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'world-drive', timestamp: new Date().toISOString() });
});

app.use('/api/cars', carsRouter);

async function bootstrap() {
  await prisma.$connect();
  await runSeed(prisma);
  if (process.env.ENABLE_SIMULATOR === 'true') await startSimulator();
  connectMqtt();
  app.listen(PORT, () => console.log(`[World Drive] Service running on port ${PORT}`));
}

bootstrap().catch((err) => {
  console.error('[World Drive] Startup failed', err);
  process.exit(1);
});
