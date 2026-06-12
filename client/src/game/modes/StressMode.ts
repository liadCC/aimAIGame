import { BaseMode } from './BaseMode';

export class StressMode extends BaseMode {
  private targetCount: number = 3;
  private elapsedTime: number = 0;

  start(): void {
    this.isRunning = true;
    this.score = 0;
    this.streak = 0;
    this.elapsedTime = 0;
    this.targetCount = 3;
    this.metricsCollector.reset();
    this.targetManager.clearAll();

    for (let i = 0; i < this.targetCount; i++) {
      this.spawnTarget();
    }
  }

  stop(): void {
    this.isRunning = false;
    this.targetManager.clearAll();
  }

  update(dt: number, _now: number): void {
    if (!this.isRunning) return;

    this.elapsedTime += dt;

    // Escalate: add more targets over time (up to 6)
    const desiredCount = Math.min(6, 3 + Math.floor(this.elapsedTime * 0.3));
    if (desiredCount > this.targetCount) {
      this.targetCount = desiredCount;
    }

    // Keep target count at desired level
    const alive = this.targetManager.getAliveCount();
    if (alive < this.targetCount) {
      for (let i = alive; i < this.targetCount; i++) {
        this.spawnTarget();
      }
    }
  }

  handleClick(x: number, y: number): void {
    if (!this.isRunning) return;

    const hit = this.targetManager.checkHit(x, y);
    if (hit) {
      this.handleHit(hit, x, y);
      // Spawn a new one immediately to maintain pressure
      setTimeout(() => {
        if (this.isRunning) this.spawnTarget();
      }, 100);
    } else {
      const nearest = this.findNearestTarget(x, y);
      this.handleMiss(x, y, nearest);
    }
  }

  private spawnTarget(): void {
    const mult = this.getDifficultyMultiplier();
    const radius = Math.max(12, Math.round(28 / mult));
    const speed = (30 + Math.random() * 60) * mult;
    const angle = Math.random() * Math.PI * 2;

    this.targetManager.spawnTarget({
      radius,
      color: '#FF4444',
      maxLifetime: Math.round(4000 / mult),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
}
