export const THRESHOLDS = {
  overshoot: { mild: 0.25, moderate: 0.35, severe: 0.50 },
  undershoot: { mild: 0.25, moderate: 0.35, severe: 0.50 },
  jitter: { mild: 2.0, moderate: 3.5, severe: 5.0 },
  reactionTime: { fast: 250, normal: 400, slow: 600, verySlow: 800 },
  accuracy: { excellent: 0.85, good: 0.70, poor: 0.50 },
  correctionCount: { clean: 1.2, average: 2.0, excessive: 3.5 },
};

export const RANK_XP_THRESHOLDS: Record<string, number> = {
  Bronze: 0,
  Silver: 500,
  Gold: 1500,
  Platinum: 3500,
  Diamond: 7000,
  Master: 12000,
  Grandmaster: 20000,
};

export const MODE_COLORS: Record<string, string> = {
  flick: '#6C63FF',
  tracking: '#00D4FF',
  precision: '#00FF88',
  reaction: '#FFB800',
  stress: '#FF4444',
  personalized: '#FF6B9D',
};

export const MODE_DESCRIPTIONS: Record<string, string> = {
  flick: 'Train explosive flick shots with static targets',
  tracking: 'Follow and eliminate moving targets accurately',
  precision: 'Hit tiny targets with maximum accuracy',
  reaction: 'Pure reaction time — click before targets vanish',
  stress: 'Multi-target chaos to test switching speed',
  personalized: 'AI-designed training based on your weaknesses',
};
