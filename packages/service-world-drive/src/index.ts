import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import telemetryRouter from './routes/telemetry';
import { connectMqtt } from './mqtt/subscriber';

const app = express();
const PORT = process.env.PORT ?? 4003;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'world-drive',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/telemetry', telemetryRouter);

connectMqtt(); //subscriber.ts

app.listen(PORT, () => {
  console.log(`[World Drive] Service running on port ${PORT}`);
});