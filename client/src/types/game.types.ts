export type GameMode = 'flick' | 'tracking' | 'precision' | 'reaction' | 'stress' | 'personalized';
export type GameState = 'idle' | 'countdown' | 'playing' | 'paused' | 'results';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'elite';

export interface Target {
  id: string;
  x: number;
  y: number;
  radius: number;
  spawnTime: number;
  vx: number;
  vy: number;
  isAlive: boolean;
  color: string;
  maxLifetime: number;
}

export interface ClickEvent {
  targetId: string | null;
  clickX: number;
  clickY: number;
  targetX: number;
  targetY: number;
  hit: boolean;
  missDistance: number;
  reactionTime: number;
  mouseSpeedAtClick: number;
  flickAngle: number;
  overshoot: boolean;
  undershoot: boolean;
  correctionCount: number;
  pathSmoothness: number;
  timestamp: number;
}

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  duration: number;
  targetCount?: number;
  targetRadius?: { min: number; max: number };
  targetSpeed?: { min: number; max: number };
}
