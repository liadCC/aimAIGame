import { BaseMode } from './BaseMode';

export class TrackingMode extends BaseMode {
  private elapsedTime: number = 0;
  private speedMultiplier: number = 1;

  start(): void {
    this.isRunning = true;
    this.score = 0;
    this.streak = 0;
    this.elapsedTime = 0;
    this.speedMultiplier = 1;
    this.metricsCollector.reset();
    this.targetManager.clearAll();

    const mult = this.getDifficultyMultiplier();
    const baseSpeed = 80 * mult;
    const angle = Math.random() * Math.PI * 2;

    this.targetManager.spawnTarget({
      radius: 20,
      color: '#00D4FF',
      maxLifetime: 0, // never expires
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
    });
  }

  stop(): void {
    this.isRunning = false;
    this.targetManager.clearAll();
  }

  update(dt: number, now: number): void {
    if (!this.isRunning) return;

    this.elapsedTime += dt;
    // Speed increases over time
    const newMultiplier = 1 + this.elapsedTime * 0.05;
    if (newMultiplier > this.speedMultiplier + 0.05) {
      this.speedMultiplier = newMultiplier;
      const targets = this.targetManager.getTargets();
      for (const target of targets) {
        const speed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
        const newSpeed = speed * 1.02;
        const len = Math.max(0.001, speed);
        target.vx = (target.vx / len) * newSpeed;
        target.vy = (target.vy / len) * newSpeed;
      }
    }

    // Occasionally change direction randomly
    if (Math.random() < 0.002) {
      const targets = this.targetManager.getTargets();
      for (const target of targets) {
        const speed = Math.sqrt(target.vx * target.vx + target.vy * target.vy);
        const newAngle = Math.atan2(target.vy, target.vx) + (Math.random() - 0.5) * Math.PI;
        target.vx = Math.cos(newAngle) * speed;
        target.vy = Math.sin(newAngle) * speed;
      }
    }
  }

  handleClick(x: number, y: number): void {
    if (!this.isRunning) return;

    const hit = this.targetManager.checkHit(x, y);
    if (hit) {
      this.handleHit(hit, x, y);
      // Respawn immediately for tracking — continuous target
      const mult = this.getDifficultyMultiplier();
      const baseSpeed = (80 + this.elapsedTime * 5) * mult;
      const angle = Math.random() * Math.PI * 2;
      this.targetManager.spawnTarget({
        radius: 20,
        color: '#00D4FF',
        maxLifetime: 0,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
      });
    } else {
      const nearest = this.findNearestTarget(x, y);
      this.handleMiss(x, y, nearest);
    }
  }
}
