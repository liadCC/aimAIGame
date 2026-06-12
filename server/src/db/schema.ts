import Database from 'better-sqlite3';

export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rank TEXT DEFAULT 'Bronze',
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      streak INTEGER DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      total_time_played INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_played_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT REFERENCES players(id),
      mode TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration INTEGER NOT NULL,
      score INTEGER NOT NULL,
      accuracy REAL,
      avg_reaction_time REAL,
      hits INTEGER,
      misses INTEGER,
      overshoot_rate REAL,
      undershoot_rate REAL,
      jitter_score REAL,
      fatigue_index REAL,
      metrics_json TEXT
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id TEXT PRIMARY KEY,
      player_id TEXT REFERENCES players(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      confidence REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
