import { MouseSnapshot } from '../types/metrics.types';

export class MouseTracker {
  private snapshots: MouseSnapshot[] = [];
  private readonly WINDOW_SIZE = 20;
  private readonly WINDOW_MS = 100;
  private x: number = 0;
  private y: number = 0;
  private vx: number = 0;
  private vy: number = 0;
  private prevSpeed: number = 0;
  private usePointerLock: boolean = false;

  constructor() {
    this.x = 0;
    this.y = 0;
  }

  setPosition(x: number, y: number): void {
    const now = performance.now();
    const last = this.snapshots[this.snapshots.length - 1];

    if (last) {
      const dt = (now - last.timestamp) / 1000;
      if (dt > 0) {
        this.vx = (x - last.x) / dt;
        this.vy = (y - last.y) / dt;
      }
    }

    this.x = x;
    this.y = y;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const lastSpeed = this.prevSpeed;
    const dt2 = last ? (now - last.timestamp) / 1000 : 0.016;
    const acceleration = dt2 > 0 ? (speed - lastSpeed) / dt2 : 0;
    this.prevSpeed = speed;

    const snapshot: MouseSnapshot = {
      x,
      y,
      vx: this.vx,
      vy: this.vy,
      speed,
      acceleration,
      timestamp: now,
    };

    this.snapshots.push(snapshot);

    // Keep window within 100ms
    const cutoff = now - this.WINDOW_MS;
    while (this.snapshots.length > this.WINDOW_SIZE || (this.snapshots.length > 1 && this.snapshots[0].timestamp < cutoff)) {
      this.snapshots.shift();
    }
  }

  applyDelta(dx: number, dy: number, canvasWidth: number, canvasHeight: number): void {
    const newX = Math.max(0, Math.min(canvasWidth, this.x + dx));
    const newY = Math.max(0, Math.min(canvasHeight, this.y + dy));
    this.setPosition(newX, newY);
    this.usePointerLock = true;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getVelocity(): { vx: number; vy: number } {
    return { vx: this.vx, vy: this.vy };
  }

  getSpeed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  getLastNSnapshots(n: number): MouseSnapshot[] {
    return this.snapshots.slice(-n);
  }

  getCurrentSnapshot(): MouseSnapshot {
    const now = performance.now();
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      speed,
      acceleration: 0,
      timestamp: now,
    };
  }

  computePathSmoothness(): number {
    const snaps = this.snapshots;
    if (snaps.length < 3) return 1;

    let totalAngleChange = 0;
    for (let i = 1; i < snaps.length - 1; i++) {
      const dx1 = snaps[i].x - snaps[i - 1].x;
      const dy1 = snaps[i].y - snaps[i - 1].y;
      const dx2 = snaps[i + 1].x - snaps[i].x;
      const dy2 = snaps[i + 1].y - snaps[i].y;

      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (len1 < 0.01 || len2 < 0.01) continue;

      const dot = (dx1 * dx2 + dy1 * dy2) / (len1 * len2);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
      totalAngleChange += angle;
    }

    const avgAngleChange = totalAngleChange / Math.max(1, snaps.length - 2);
    return Math.max(0, 1 - avgAngleChange / Math.PI);
  }

  computeJitterScore(): number {
    const snaps = this.getLastNSnapshots(20);
    if (snaps.length < 3) return 0;

    const angles: number[] = [];
    for (let i = 1; i < snaps.length - 1; i++) {
      const dx1 = snaps[i].x - snaps[i - 1].x;
      const dy1 = snaps[i].y - snaps[i - 1].y;
      const dx2 = snaps[i + 1].x - snaps[i].x;
      const dy2 = snaps[i + 1].y - snaps[i].y;

      const angle = Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1);
      angles.push(angle);
    }

    if (angles.length === 0) return 0;

    const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const variance = angles.reduce((sum, a) => sum + (a - mean) ** 2, 0) / angles.length;
    return Math.sqrt(variance) * (180 / Math.PI);
  }

  computeCorrectionCount(targetX: number, targetY: number): number {
    const snaps = this.snapshots;
    if (snaps.length < 4) return 0;

    let reversals = 0;
    for (let i = 1; i < snaps.length - 1; i++) {
      // Distance to target changes direction
      const prevDist = Math.sqrt((snaps[i - 1].x - targetX) ** 2 + (snaps[i - 1].y - targetY) ** 2);
      const currDist = Math.sqrt((snaps[i].x - targetX) ** 2 + (snaps[i].y - targetY) ** 2);
      const nextDist = Math.sqrt((snaps[i + 1].x - targetX) ** 2 + (snaps[i + 1].y - targetY) ** 2);

      const wasApproaching = currDist < prevDist;
      const nowReceding = nextDist > currDist;

      if (wasApproaching && nowReceding) {
        reversals++;
      }
    }

    return reversals;
  }

  detectOvershoot(targetX: number, targetY: number, targetRadius: number): { overshoot: boolean; undershoot: boolean } {
    const snaps = this.getLastNSnapshots(5);
    if (snaps.length < 2) return { overshoot: false, undershoot: false };

    const clickPos = { x: this.x, y: this.y };
    const clickDist = Math.sqrt((clickPos.x - targetX) ** 2 + (clickPos.y - targetY) ** 2);

    // Get approach vector from last few frames
    const first = snaps[0];
    const dx = this.x - first.x;
    const dy = this.y - first.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len < 0.01) return { overshoot: false, undershoot: false };

    const approachDirX = dx / len;
    const approachDirY = dy / len;

    // Vector from target to click position
    const toClickX = clickPos.x - targetX;
    const toClickY = clickPos.y - targetY;

    // Project click offset onto approach direction
    const projection = toClickX * approachDirX + toClickY * approachDirY;

    const overshoot = projection > targetRadius * 0.5;
    const undershoot = projection < -targetRadius * 0.5 && clickDist > targetRadius;

    return { overshoot, undershoot };
  }

  reset(): void {
    this.snapshots = [];
    this.vx = 0;
    this.vy = 0;
    this.prevSpeed = 0;
  }
}
