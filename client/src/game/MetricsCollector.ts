import { ClickEvent } from '../types/game.types';
import { SessionMetrics } from '../types/metrics.types';

export class MetricsCollector {
  private clickEvents: ClickEvent[] = [];
  private jitterSamples: number[] = [];
  private sessionStartTime: number = 0;

  reset(): void {
    this.clickEvents = [];
    this.jitterSamples = [];
    this.sessionStartTime = performance.now();
  }

  recordClick(event: ClickEvent): void {
    this.clickEvents.push(event);
  }

  recordJitterSample(jitter: number): void {
    this.jitterSamples.push(jitter);
    if (this.jitterSamples.length > 200) {
      this.jitterSamples.shift();
    }
  }

  computeMetrics(): SessionMetrics {
    const events = this.clickEvents;
    const hits = events.filter(e => e.hit);
    const misses = events.filter(e => !e.hit);

    const totalShots = events.length;
    const hitCount = hits.length;
    const missCount = misses.length;
    const accuracy = totalShots > 0 ? hitCount / totalShots : 0;

    const reactionTimes = hits.map(e => e.reactionTime).filter(rt => rt > 0 && rt < 5000);
    const avgReactionTime = reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0;
    const minReactionTime = reactionTimes.length > 0 ? Math.min(...reactionTimes) : 0;
    const maxReactionTime = reactionTimes.length > 0 ? Math.max(...reactionTimes) : 0;

    const speeds = events.map(e => e.mouseSpeedAtClick).filter(s => s >= 0);
    const avgMouseSpeed = speeds.length > 0
      ? speeds.reduce((a, b) => a + b, 0) / speeds.length
      : 0;

    const overshootCount = events.filter(e => e.overshoot).length;
    const undershootCount = events.filter(e => e.undershoot).length;
    const overshootRate = totalShots > 0 ? overshootCount / totalShots : 0;
    const undershootRate = totalShots > 0 ? undershootCount / totalShots : 0;

    const missDistances = misses.map(e => e.missDistance).filter(d => d > 0);
    const avgMissDistance = missDistances.length > 0
      ? missDistances.reduce((a, b) => a + b, 0) / missDistances.length
      : 0;

    const corrections = events.map(e => e.correctionCount);
    const avgCorrectionCount = corrections.length > 0
      ? corrections.reduce((a, b) => a + b, 0) / corrections.length
      : 0;

    const avgJitter = this.jitterSamples.length > 0
      ? this.jitterSamples.reduce((a, b) => a + b, 0) / this.jitterSamples.length
      : 0;

    const smoothnessValues = events.map(e => e.pathSmoothness).filter(s => s >= 0 && s <= 1);
    const smoothnessScore = smoothnessValues.length > 0
      ? smoothnessValues.reduce((a, b) => a + b, 0) / smoothnessValues.length
      : 0;

    // Consistency: standard deviation of reaction times (lower = more consistent)
    const consistencyScore = this.computeConsistency(reactionTimes);

    // Fatigue: compare first 20% vs last 20% of session accuracy
    const fatigueIndex = this.computeFatigueIndex(events);

    // Speed-accuracy balance: higher is better (means good speed AND accuracy)
    const speedAccuracyBalance = accuracy * (1 - Math.min(1, avgReactionTime / 1000));

    return {
      totalShots,
      hits: hitCount,
      misses: missCount,
      accuracy,
      avgReactionTime,
      minReactionTime,
      maxReactionTime,
      avgMouseSpeed,
      overshootCount,
      undershootCount,
      overshootRate,
      undershootRate,
      avgMissDistance,
      avgCorrectionCount,
      jitterScore: avgJitter,
      smoothnessScore,
      consistencyScore,
      fatigueIndex,
      speedAccuracyBalance,
      clickEvents: events,
    };
  }

  private computeConsistency(reactionTimes: number[]): number {
    if (reactionTimes.length < 2) return 1;
    const mean = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    const variance = reactionTimes.reduce((sum, rt) => sum + (rt - mean) ** 2, 0) / reactionTimes.length;
    const stdDev = Math.sqrt(variance);
    // Normalize: stdDev of 0 = 1.0, stdDev of 300ms = 0
    return Math.max(0, 1 - stdDev / 300);
  }

  private computeFatigueIndex(events: ClickEvent[]): number {
    if (events.length < 10) return 0;

    const fifth = Math.max(1, Math.floor(events.length * 0.2));
    const firstSegment = events.slice(0, fifth);
    const lastSegment = events.slice(events.length - fifth);

    const firstAccuracy = firstSegment.filter(e => e.hit).length / firstSegment.length;
    const lastAccuracy = lastSegment.filter(e => e.hit).length / lastSegment.length;

    // Positive = getting worse (fatigued), negative = improving (warming up)
    return Math.max(0, firstAccuracy - lastAccuracy);
  }

  getClickCount(): number {
    return this.clickEvents.length;
  }

  getHitCount(): number {
    return this.clickEvents.filter(e => e.hit).length;
  }

  getLiveAccuracy(): number {
    const total = this.clickEvents.length;
    if (total === 0) return 0;
    return this.clickEvents.filter(e => e.hit).length / total;
  }

  getCurrentStreak(): number {
    let streak = 0;
    for (let i = this.clickEvents.length - 1; i >= 0; i--) {
      if (this.clickEvents[i].hit) streak++;
      else break;
    }
    return streak;
  }
}
