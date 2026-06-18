import { Router } from 'express';
import { getPosition } from '../positionStore';

const router = Router();

router.get('/', (_req, res) => {
  const position = getPosition();

  if (!position) {
    res.status(404).json({ error: 'No position data received yet' });
    return;
  }

  res.json(position);
});

export default router;
