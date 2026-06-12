import { Router, Request, Response } from 'express';
import { createSession, getSessionsByPlayer } from '../services/sessionService';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  try {
    const session = createSession(req.body);
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.get('/:playerId', (req: Request, res: Response) => {
  const sessions = getSessionsByPlayer(req.params.playerId);
  res.json(sessions);
});

export default router;
