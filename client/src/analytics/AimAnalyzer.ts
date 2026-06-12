import { SessionMetrics } from '../types/metrics.types';
import { WeaknessProfile } from '../types/player.types';
import { THRESHOLDS } from './patterns';

export class AimAnalyzer {
  analyzeSession(metrics: SessionMetrics): WeaknessProfile {
    const overshootRate = metrics.overshootRate || 0;
    const undershootRate = metrics.undershootRate || 0;
    const jitterScore = metrics.jitterScore || 0;
    const avgReactionTime = metrics.avgReactionTime || 0;
    const accuracy = metrics.accuracy || 0;
    const avgCorrectionCount = metrics.avgCorrectionCount || 0;
    const smoothnessScore = metrics.smoothnessScore || 0;
    const fatigueIndex = metrics.fatigueIndex || 0;

    // Overflicking: overshoot rate above mild threshold
    const overflicking = this.computeWeaknessScore(
      overshootRate,
      THRESHOLDS.overshoot.mild,
      THRESHOLDS.overshoot.severe
    );

    // Underflicking: undershoot rate above mild threshold
    const underflicking = this.computeWeaknessScore(
      undershootRate,
      THRESHOLDS.undershoot.mild,
      THRESHOLDS.undershoot.severe
    );

    // Tracking deviation: based on smoothness and correction count
    const trackingWeakness = (1 - smoothnessScore) * 0.6 +
      this.computeWeaknessScore(avgCorrectionCount, THRESHOLDS.correctionCount.clean, THRESHOLDS.correctionCount.excessive) * 0.4;
    const trackingDeviation = Math.min(100, trackingWeakness * 100);

    // Jitter: high-frequency oscillations
    const jitter = this.computeWeaknessScore(
      jitterScore,
      THRESHOLDS.jitter.mild,
      THRESHOLDS.jitter.severe
    ) * 100;

    // Reaction slowness
    const reactionSlowness = this.computeWeaknessScore(
      avgReactionTime,
      THRESHOLDS.reactionTime.normal,
      THRESHOLDS.reactionTime.verySlow
    ) * 100;

    // Precision issues: low accuracy despite potential speed
    const precisionIssues = Math.max(0, (1 - accuracy) * 100 - overflicking * 0.3 - underflicking * 0.3);

    // Speed sacrifice: high accuracy but very slow reaction (being overly careful)
    const isAccurate = accuracy > THRESHOLDS.accuracy.good;
    const isSlow = avgReactionTime > THRESHOLDS.reactionTime.slow;
    const speedSacrifice = isAccurate && isSlow
      ? this.computeWeaknessScore(avgReactionTime, THRESHOLDS.reactionTime.slow, THRESHOLDS.reactionTime.verySlow * 1.5) * 80 + fatigueIndex * 20
      : fatigueIndex * 30;

    return {
      overflicking: Math.min(100, Math.max(0, overflicking * 100)),
      underflicking: Math.min(100, Math.max(0, underflicking * 100)),
      trackingDeviation: Math.min(100, Math.max(0, trackingDeviation)),
      jitter: Math.min(100, Math.max(0, jitter)),
      reactionSlowness: Math.min(100, Math.max(0, reactionSlowness)),
      precisionIssues: Math.min(100, Math.max(0, precisionIssues)),
      speedSacrifice: Math.min(100, Math.max(0, speedSacrifice)),
    };
  }

  combineProfiles(sessionMetrics: SessionMetrics[]): WeaknessProfile {
    const last5 = sessionMetrics.slice(-5);
    if (last5.length === 0) {
      return {
        overflicking: 0,
        underflicking: 0,
        trackingDeviation: 0,
        jitter: 0,
        reactionSlowness: 0,
        precisionIssues: 0,
        speedSacrifice: 0,
      };
    }

    const profiles = last5.map(m => this.analyzeSession(m));
    const count = profiles.length;

    // Weighted average — more recent sessions have higher weight
    const weights = profiles.map((_, i) => i + 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const weighted = (key: keyof WeaknessProfile): number => {
      return profiles.reduce((sum, p, i) => sum + p[key] * weights[i], 0) / totalWeight;
    };

    return {
      overflicking: weighted('overflicking'),
      underflicking: weighted('underflicking'),
      trackingDeviation: weighted('trackingDeviation'),
      jitter: weighted('jitter'),
      reactionSlowness: weighted('reactionSlowness'),
      precisionIssues: weighted('precisionIssues'),
      speedSacrifice: weighted('speedSacrifice'),
    };
  }

  private computeWeaknessScore(value: number, mildThreshold: number, severeThreshold: number): number {
    if (value <= mildThreshold) return 0;
    if (value >= severeThreshold) return 1;
    return (value - mildThreshold) / (severeThreshold - mildThreshold);
  }

  getTopWeaknesses(profile: WeaknessProfile, count: number = 3): Array<{ key: keyof WeaknessProfile; value: number }> {
    const entries = Object.entries(profile) as Array<[keyof WeaknessProfile, number]>;
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([key, value]) => ({ key, value }));
  }

  computeOverallScore(profile: WeaknessProfile): number {
    const values = Object.values(profile);
    const avgWeakness = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.max(0, 100 - avgWeakness);
  }
}

export const aimAnalyzer = new AimAnalyzer();
