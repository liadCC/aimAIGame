import { BaseMode } from './BaseMode';

export class FlickMode extends BaseMode {
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

  update(dt: number, now: number): void {
    if (!this.isRunning) return;
    if (this.targetManager.getAliveCount() === 0 && this.targetSpawned) {
      this.targetSpawned = false;
      setTimeout(() => {
        if (this.isRunning) this.spawnNext();
      }, 150);
    }
  }

  handleClick(x: number, y: number): void {
    if (!this.isRunning) return;

    const hit = this.targetManager.checkHit(x, y);
    if (hit) {
      this.targetSpawned = false;
      this.handleHit(hit, x, y);
    } else {
      const nearest = this.findNearestTarget(x, y);
      this.handleMiss(x, y, nearest);
    }
  }

  private spawnNext(): void {
    if (!this.isRunning) return;
    const mult = this.getDifficultyMultiplier();
    const minR = Math.round(35 / mult);
    const maxR = Math.round(20 / mult) + minR;
    const radius = minR + Math.random() * (maxR - minR);

    this.targetManager.spawnTarget({
      radius: Math.max(8, radius),
      color: '#6C63FF',
      maxLifetime: Math.round(4000 / mult),
      vx: 0,
      vy: 0,
    });
    this.targetSpawned = true;
  }
}
