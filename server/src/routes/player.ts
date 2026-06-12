import { Router, Request, Response } from 'express';
import { getPlayer, updatePlayer, getOrCreatePlayer } from '../services/playerService';

const router = Router();

router.get('/:id', (req: Request, res: Response) => {
  const player = getPlayer(req.params.id);
  if (!player) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(player);
});

router.post('/', (req: Request, res: Response) => {
  const { id, name } = req.body;
  if (!id || !name) {
    res.status(400).json({ error: 'id and name are required' });
    return;
  }
  const player = getOrCreatePlayer(id, name);
  res.json(player);
});

router.put('/:id', (req: Request, res: Response) => {
  const updated = updatePlayer(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Player not found' });
    return;
  }
  res.json(updated);
});

export default router;
