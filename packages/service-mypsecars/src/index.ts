import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import telemetryRouter from './routes/telemetry';
import { startHiveMqSubscriber } from './mqtt/hivemq-subscriber';
import { startLocalPublisher } from './mqtt/local-publisher';
import { swaggerSpec } from './swagger/swagger.config';

const app = express();
const PORT = process.env.PORT ?? 4004;

app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/telemetry', telemetryRouter);

app.get('/', (_req, res) => {
  res.json({
    service: 'service-mypsecars',
    endpoints: [
      { method: 'GET',  path: '/api/health' },
      { method: 'GET',  path: '/api/telemetry' },
      { method: 'POST', path: '/api/telemetry/ingest' },
    ],
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'service-mypsecars', timestamp: new Date().toISOString() });
});

// Phone → HiveMQ → here (external data)
startHiveMqSubscriber();

// Republish to local Mosquitto (for internal services)
startLocalPublisher();

app.listen(PORT, () => {
  console.log(`service-mypsecars running on http://localhost:${PORT}`);
});
