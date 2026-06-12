import { Router, Request, Response } from 'express';
import { getAggregatedStats } from '../services/sessionService';

const router = Router();

router.get('/:playerId', (req: Request, res: Response) => {
  const stats = getAggregatedStats(req.params.playerId);
  res.json(stats);
});

export default router;
