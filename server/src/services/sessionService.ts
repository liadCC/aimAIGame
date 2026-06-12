import { getDatabase } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

export interface SessionRow {
  id: string;
  player_id: string;
  mode: string;
  difficulty: string;
  timestamp: string;
  duration: number;
  score: number;
  accuracy: number | null;
  avg_reaction_time: number | null;
  hits: number | null;
  misses: number | null;
  overshoot_rate: number | null;
  undershoot_rate: number | null;
  jitter_score: number | null;
  fatigue_index: number | null;
  metrics_json: string | null;
}

export interface CreateSessionInput {
  player_id: string;
  mode: string;
  difficulty: string;
  duration: number;
  score: number;
  accuracy?: number;
  avg_reaction_time?: number;
  hits?: number;
  misses?: number;
  overshoot_rate?: number;
  undershoot_rate?: number;
  jitter_score?: number;
  fatigue_index?: number;
  metrics_json?: string;
}

export function createSession(input: CreateSessionInput): SessionRow {
  const db = getDatabase();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO sessions (
      id, player_id, mode, difficulty, duration, score,
      accuracy, avg_reaction_time, hits, misses,
      overshoot_rate, undershoot_rate, jitter_score, fatigue_index, metrics_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.player_id, input.mode, input.difficulty,
    input.duration, input.score,
    input.accuracy ?? null, input.avg_reaction_time ?? null,
    input.hits ?? null, input.misses ?? null,
    input.overshoot_rate ?? null, input.undershoot_rate ?? null,
    input.jitter_score ?? null, input.fatigue_index ?? null,
    input.metrics_json ?? null
  );
  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow;
}

export function getSessionsByPlayer(playerId: string, limit: number = 50): SessionRow[] {
  const db = getDatabase();
  return db.prepare(
    'SELECT * FROM sessions WHERE player_id = ? ORDER BY timestamp DESC LIMIT ?'
  ).all(playerId, limit) as SessionRow[];
}

export function getAggregatedStats(playerId: string) {
  const db = getDatabase();
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_sessions,
      AVG(accuracy) as avg_accuracy,
      AVG(avg_reaction_time) as avg_reaction_time,
      SUM(duration) as total_time,
      MAX(score) as best_score,
      AVG(jitter_score) as avg_jitter,
      AVG(fatigue_index) as avg_fatigue
    FROM sessions
    WHERE player_id = ?
  `).get(playerId) as Record<string, number>;

  const byMode = db.prepare(`
    SELECT mode, COUNT(*) as count, AVG(accuracy) as avg_accuracy, MAX(score) as best_score
    FROM sessions
    WHERE player_id = ?
    GROUP BY mode
  `).all(playerId) as Array<{ mode: string; count: number; avg_accuracy: number; best_score: number }>;

  return { ...stats, byMode };
}
