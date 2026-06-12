import { v4 as uuidv4 } from 'uuid';
import { SessionMetrics } from '../types/metrics.types';
import { PlayerProfile, Recommendation, WeaknessProfile } from '../types/player.types';
import { THRESHOLDS } from './patterns';

function computeConfidence(sampleSize: number, severity: number, consistency: number): number {
  const sampleStrength = Math.min(1, sampleSize / 50);
  return Math.min(95, sampleStrength * 40 + severity * 50 + consistency * 10);
}

export function generateRecommendations(
  weaknesses: WeaknessProfile,
  metrics: SessionMetrics,
  playerProfile: PlayerProfile
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const now = new Date().toISOString();
  const totalShots = metrics.totalShots || 1;
  const sampleSize = totalShots;

  // Sensitivity too high (overflicking)
  if (weaknesses.overflicking > 30) {
    const overshootRate = metrics.overshootRate || 0;
    const delta = Math.round((overshootRate - THRESHOLDS.overshoot.mild) * 100);
    const severity = weaknesses.overflicking / 100;
    const adjustment = Math.min(0.25, severity * 0.3);
    const confidence = computeConfidence(sampleSize, severity, 0.7);

    recommendations.push({
      id: uuidv4(),
      type: 'sensitivity',
      title: 'Sensitivity May Be Too High',
      description: `You overshot targets ${Math.round(overshootRate * 100)}% of shots — ${delta}% above baseline.`,
      detail: 'Your flicks consistently carry past the target center, indicating your sensitivity causes too much cursor travel per movement unit. Try reducing your sensitivity by 10-20% and practice controlled flicks.',
      confidence,
      currentValue: 'Current sensitivity',
      recommendedValue: `Reduce by ~${Math.round(adjustment * 100)}%`,
      gameSpecific: [
        { game: 'Valorant', from: '0.32', to: String((0.32 * (1 - adjustment)).toFixed(2)) },
        { game: 'CS2', from: '1.2', to: String((1.2 * (1 - adjustment)).toFixed(2)) },
        { game: 'Apex', from: '1800', to: String(Math.round(1800 * (1 - adjustment))) },
      ],
      priority: overshootRate > THRESHOLDS.overshoot.severe ? 'high' : 'medium',
      createdAt: now,
    });
  }

  // Sensitivity too low (underflicking)
  if (weaknesses.underflicking > 30) {
    const undershootRate = metrics.undershootRate || 0;
    const delta = Math.round((undershootRate - THRESHOLDS.undershoot.mild) * 100);
    const severity = weaknesses.underflicking / 100;
    const adjustment = Math.min(0.25, severity * 0.3);
    const confidence = computeConfidence(sampleSize, severity, 0.7);

    recommendations.push({
      id: uuidv4(),
      type: 'sensitivity',
      title: 'Sensitivity May Be Too Low',
      description: `You undershot targets ${Math.round(undershootRate * 100)}% of shots — ${delta}% above baseline.`,
      detail: 'Your flicks consistently stop short of the target, suggesting your sensitivity requires too much physical movement to traverse the screen. Try increasing sensitivity by 10-20% for more efficient cursor travel.',
      confidence,
      currentValue: 'Current sensitivity',
      recommendedValue: `Increase by ~${Math.round(adjustment * 100)}%`,
      gameSpecific: [
        { game: 'Valorant', from: '0.32', to: String((0.32 * (1 + adjustment)).toFixed(2)) },
        { game: 'CS2', from: '1.2', to: String((1.2 * (1 + adjustment)).toFixed(2)) },
        { game: 'Apex', from: '1800', to: String(Math.round(1800 * (1 + adjustment))) },
      ],
      priority: undershootRate > THRESHOLDS.undershoot.severe ? 'high' : 'medium',
      createdAt: now,
    });
  }

  // Jitter detected
  if (weaknesses.jitter > 35) {
    const severity = weaknesses.jitter / 100;
    const confidence = computeConfidence(sampleSize, severity, 0.6);

    recommendations.push({
      id: uuidv4(),
      type: 'training',
      title: 'Unstable Aim / Jitter Detected',
      description: `Your mouse path shows high-frequency oscillations (jitter score: ${metrics.jitterScore.toFixed(1)}).`,
      detail: 'Jitter often stems from tense grip, unstable wrist placement, or fatigue. Try a relaxed claw grip, rest your wrist on the mousepad edge, and do slow precision training to build muscle memory stability. Consider a heavier mouse if you\'re using an ultra-light model.',
      confidence,
      priority: weaknesses.jitter > 65 ? 'high' : 'medium',
      createdAt: now,
    });
  }

  // Tracking issues
  if (weaknesses.trackingDeviation > 40) {
    const severity = weaknesses.trackingDeviation / 100;
    const confidence = computeConfidence(sampleSize, severity, 0.65);
    const flickScore = 100 - ((weaknesses.overflicking + weaknesses.underflicking) / 2);
    const trackingVsFlick = flickScore > 60 && weaknesses.trackingDeviation > 40;

    recommendations.push({
      id: uuidv4(),
      type: 'training',
      title: trackingVsFlick ? 'Tracking Needs Work (Flick is Strong)' : 'Improve Target Tracking',
      description: trackingVsFlick
        ? 'Your flick accuracy is strong but tracking deviation is high — focus on smooth follow-through.'
        : `Your tracking deviation is above average. Consistent target following needs improvement.`,
      detail: 'Practice Tracking mode daily. Focus on matching target velocity rather than constantly correcting position. Use a lower sensitivity for smoother micro-adjustments. Kovaak\'s "Close Long Strafes" is an excellent drill.',
      confidence,
      priority: weaknesses.trackingDeviation > 70 ? 'high' : 'medium',
      createdAt: now,
    });
  }

  // Reaction time slowness
  if (weaknesses.reactionSlowness > 40) {
    const avgRT = metrics.avgReactionTime;
    const severity = weaknesses.reactionSlowness / 100;
    const confidence = computeConfidence(sampleSize, severity, 0.8);

    recommendations.push({
      id: uuidv4(),
      type: 'training',
      title: 'Work on Reaction Speed',
      description: `Your average reaction time is ${Math.round(avgRT)}ms — ${avgRT > THRESHOLDS.reactionTime.slow ? 'significantly' : 'slightly'} above optimal.`,
      detail: 'Reaction time improves with consistent training and pre-aiming. Always pre-aim common angles. Practice Reaction mode 5-10 minutes before gaming sessions to prime your neural pathways. Ensure you\'re well-rested — fatigue adds 50-100ms to reaction time.',
      confidence,
      priority: avgRT > THRESHOLDS.reactionTime.verySlow ? 'high' : 'low',
      createdAt: now,
    });
  }

  // Speed sacrifice (accurate but slow)
  if (weaknesses.speedSacrifice > 40) {
    const severity = weaknesses.speedSacrifice / 100;
    const confidence = computeConfidence(sampleSize, severity, 0.6);

    recommendations.push({
      id: uuidv4(),
      type: 'training',
      title: 'Build Click Confidence',
      description: `You achieve high accuracy but target acquisition is slow — you\'re sacrificing speed for precision.`,
      detail: 'This often means you\'re over-correcting before committing to shots. Practice committing to flicks faster. Set a 1-second time limit drill: if you haven\'t clicked in 1 second, force yourself to click regardless. Gradually reduce this to 400ms.',
      confidence,
      priority: 'medium',
      createdAt: now,
    });
  }

  // Precision issues
  if (weaknesses.precisionIssues > 45) {
    const severity = weaknesses.precisionIssues / 100;
    const confidence = computeConfidence(sampleSize, severity, 0.65);

    recommendations.push({
      id: uuidv4(),
      type: 'training',
      title: 'Precision Needs Improvement',
      description: `Miss distance is above average — shots are landing away from target centers.`,
      detail: 'Practice Precision mode with small targets. Focus on your arm\'s range of motion and ensure your elbow is resting comfortably. Consider a larger mousepad for full arm aiming which generally provides more precision.',
      confidence,
      priority: weaknesses.precisionIssues > 65 ? 'high' : 'medium',
      createdAt: now,
    });
  }

  // Warmup recommendation (always useful)
  const level = playerProfile.level;
  if (level > 1) {
    recommendations.push({
      id: uuidv4(),
      type: 'warmup',
      title: 'Daily Warmup Routine',
      description: '5 minutes of warmup before gaming reduces reaction time by up to 15%.',
      detail: 'Do 2 minutes of Flick mode (easy), 2 minutes of Tracking mode (medium), and 1 minute of Reaction mode. This primes your neuromuscular system and establishes muscle memory before competitive play.',
      confidence: 88,
      priority: 'low',
      createdAt: now,
    });
  }

  // Habit recommendation for low streak
  if (playerProfile.streak < 3 && playerProfile.totalSessions > 2) {
    recommendations.push({
      id: uuidv4(),
      type: 'habit',
      title: 'Build a Daily Practice Habit',
      description: 'Consistent daily practice of 10-15 minutes outperforms occasional long sessions.',
      detail: 'Aim training follows the same principles as motor skill learning — short, frequent sessions build stronger neural pathways than infrequent long ones. Even 10 minutes per day will show measurable improvement within 2 weeks.',
      confidence: 92,
      priority: 'medium',
      createdAt: now,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 6);
}
