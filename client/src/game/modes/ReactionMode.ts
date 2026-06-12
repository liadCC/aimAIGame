import { BaseMode } from './BaseMode';

export class ReactionMode extends BaseMode {
  private waitTimer: ReturnType<typeof setTimeout> | null = null;
  private targetVisible: boolean = false;
  private falseStartPenalty: boolean = false;

  start(): void {
    this.isRunning = true;
    this.score = 0;
    this.streak = 0;
    this.targetVisible = false;
    this.metricsCollector.reset();
    this.targetManager.clearAll();
    this.scheduleNext();
  }

  stop(): void {
    this.isRunning = false;
    if (this.waitTimer) {
      clearTimeout(this.waitTimer);
      this.waitTimer = null;
    }
    this.targetManager.clearAll();
  }

  update(_dt: number, _now: number): void {
    if (!this.isRunning) return;
    // Check if target expired (250ms window)
    if (this.targetVisible && this.targetManager.getAliveCount() === 0) {
      this.targetVisible = false;
      this.streak = 0;
      this.events.onMiss();
      setTimeout(() => {
        if (this.isRunning) this.scheduleNext();
      }, 400);
    }
  }

  handleClick(x: number, y: number): void {
    if (!this.isRunning) return;

    if (!this.targetVisible) {
      // False start / clicked before target appeared
      this.falseStartPenalty = true;
      this.particles.spawnMissFlash(x, y);
      this.streak = 0;
      return;
    }

    const hit = this.targetManager.checkHit(x, y);
    if (hit) {
      this.targetVisible = false;
      this.handleHit(hit, x, y);
      setTimeout(() => {
        if (this.isRunning) this.scheduleNext();
      }, 300);
    } else {
      const nearest = this.findNearestTarget(x, y);
      this.handleMiss(x, y, nearest);
    }
  }

  private scheduleNext(): void {
    if (!this.isRunning) return;
    this.falseStartPenalty = false;
    const delay = 300 + Math.random() * 1200;
    this.waitTimer = setTimeout(() => {
      if (!this.isRunning) return;
      this.targetVisible = true;
      const mult = this.getDifficultyMultiplier();
      this.targetManager.spawnTarget({
        radius: Math.max(12, Math.round(28 / mult)),
        color: '#FFB800',
        maxLifetime: Math.round(600 / mult), // 250-600ms window
        vx: 0,
        vy: 0,
      });
    }, delay);
  }
}
