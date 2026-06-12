import { ClickEvent } from './game.types';

export interface SessionMetrics {
  totalShots: number;
  hits: number;
  misses: number;
  accuracy: number;
  avgReactionTime: number;
  minReactionTime: number;
  maxReactionTime: number;
  avgMouseSpeed: number;
  overshootCount: number;
  undershootCount: number;
  overshootRate: number;
  undershootRate: number;
  avgMissDistance: number;
  avgCorrectionCount: number;
  jitterScore: number;
  smoothnessScore: number;
  consistencyScore: number;
  fatigueIndex: number;
  speedAccuracyBalance: number;
  clickEvents: ClickEvent[];
}

export interface MouseSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  acceleration: number;
  timestamp: number;
}
