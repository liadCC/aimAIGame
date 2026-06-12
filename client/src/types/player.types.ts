export type Rank = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Grandmaster';

export interface PlayerProfile {
  id: string;
  name: string;
  rank: Rank;
  xp: number;
  level: number;
  streak: number;
  lastPlayedAt: string | null;
  totalSessions: number;
  totalTimePlayed: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string | null;
}

export interface Recommendation {
  id: string;
  type: 'sensitivity' | 'training' | 'habit' | 'warmup';
  title: string;
  description: string;
  detail: string;
  confidence: number;
  currentValue?: string;
  recommendedValue?: string;
  gameSpecific?: { game: string; from: string; to: string }[];
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface WeaknessProfile {
  overflicking: number;
  underflicking: number;
  trackingDeviation: number;
  jitter: number;
  reactionSlowness: number;
  precisionIssues: number;
  speedSacrifice: number;
}
