import { Router } from 'express';
import { getTelemetry } from '../services/telemetry.service';

const router = Router();

router.get('/', (_req, res) => {
  const telemetry = getTelemetry();

  if (!telemetry) {
    res.status(204).json({info: 'No telemetry data received yet' });
    return;
  }

  res.json(telemetry);
});

export default router;
