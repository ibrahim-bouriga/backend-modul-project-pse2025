import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import positionRouter from './routes/position';
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

app.use('/api/position', positionRouter);

connectMqtt(); //subscriber.ts

app.listen(PORT, () => {
  console.log(`[World Drive] Service running on port ${PORT}`);
});