import { BaseMode } from './BaseMode';

export class PrecisionMode extends BaseMode {
  private targetSpawned: boolean = false;

  start(): void {
    this.isRunning = true;
    this.score = 0;
    this.streak = 0;
    this.targetSpawned = false;
    this.metricsCollector.reset();
    this.targetManager.clearAll();
    this.spawnNext();
  }

  stop(): void {
    this.isRunning = false;
    this.targetManager.clearAll();
  }

  update(_dt: number, _now: number): void {
    if (!this.isRunning) return;
    if (this.targetManager.getAliveCount() === 0 && this.targetSpawned) {
      this.targetSpawned = false;
      setTimeout(() => {
        if (this.isRunning) this.spawnNext();
      }, 300);
    }
  }

  handleClick(x: number, y: number): void {
    if (!this.isRunning) return;

    const hit = this.targetManager.checkHit(x, y);
    if (hit) {
      // NOTE: do NOT reset targetSpawned here — update() needs it true to
      // detect the now-empty arena and schedule the next spawn.
      this.handleHit(hit, x, y);
    } else {
      const nearest = this.findNearestTarget(x, y);
      this.handleMiss(x, y, nearest);
    }
  }

  private spawnNext(): void {
    if (!this.isRunning) return;
    const mult = this.getDifficultyMultiplier();
    // Very small targets: 6-14px
    const radius = Math.max(4, Math.round((14 - (mult - 1) * 4) - Math.random() * 8));

    this.targetManager.spawnTarget({
      radius,
      color: '#00FF88',
      maxLifetime: 3000,
      vx: 0,
      vy: 0,
    });
    this.targetSpawned = true;
  }
}
