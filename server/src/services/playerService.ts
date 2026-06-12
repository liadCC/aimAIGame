import { getDatabase } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export interface PlayerRow {
  id: string;
  name: string;
  rank: string;
  xp: number;
  level: number;
  streak: number;
  total_sessions: number;
  total_time_played: number;
  created_at: string;
  last_played_at: string | null;
}

export function getPlayer(id: string): PlayerRow | undefined {
  const db = getDatabase();
  return db.prepare('SELECT * FROM players WHERE id = ?').get(id) as PlayerRow | undefined;
}

export function createPlayer(name: string): PlayerRow {
  const db = getDatabase();
  const id = uuidv4();
  db.prepare(
    'INSERT INTO players (id, name) VALUES (?, ?)'
  ).run(id, name);
  return getPlayer(id)!;
}

export function updatePlayer(id: string, updates: Partial<Omit<PlayerRow, 'id' | 'created_at'>>): PlayerRow | undefined {
  const db = getDatabase();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  if (fields.length === 0) return getPlayer(id);
  db.prepare(`UPDATE players SET ${fields} WHERE id = ?`).run(...values, id);
  return getPlayer(id);
}

export function getOrCreatePlayer(id: string, name: string = 'AimCoach Player'): PlayerRow {
  const existing = getPlayer(id);
  if (existing) return existing;
  return createPlayer(name);
}
