import { Router, Request, Response } from 'express';
import { getTelemetry, ingestTelemetry } from '../services/telemetry.service';

const router = Router();

// GET /api/telemetry
router.get('/', (_req: Request, res: Response) => {
  res.json(getTelemetry());
});

// POST /api/telemetry/ingest 
router.post('/ingest', (req: Request, res: Response) => {
  ingestTelemetry(req.body);
  res.json({ ok: true });
});

export default router;