import { v4 as uuidv4 } from 'uuid';
import { Target } from '../types/game.types';

interface DyingTarget {
  target: Target;
  deathTime: number;
  scale: number;
  alpha: number;
}

export class TargetManager {
  private targets: Target[] = [];
  private dyingTargets: DyingTarget[] = [];
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;
  private onMissCallback?: (target: Target) => void;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  onTargetMiss(callback: (target: Target) => void): void {
    this.onMissCallback = callback;
  }

  spawnTarget(options: Partial<Target> & { radius?: number; color?: string; maxLifetime?: number } = {}): Target {
    const radius = options.radius ?? 25;
    const margin = radius + 10;
    const target: Target = {
      id: uuidv4(),
      x: options.x ?? margin + Math.random() * (this.canvasWidth - margin * 2),
      y: options.y ?? margin + Math.random() * (this.canvasHeight - margin * 2),
      radius,
      spawnTime: performance.now(),
      vx: options.vx ?? 0,
      vy: options.vy ?? 0,
      isAlive: true,
      color: options.color ?? '#6C63FF',
      maxLifetime: options.maxLifetime ?? 3000,
    };
    this.targets.push(target);
    return target;
  }

  update(dt: number, now: number): void {
    // Update alive targets
    for (const target of this.targets) {
      if (!target.isAlive) continue;

      target.x += target.vx * dt;
      target.y += target.vy * dt;

      // Bounce off walls
      if (target.x - target.radius < 0) {
        target.x = target.radius;
        target.vx = Math.abs(target.vx);
      } else if (target.x + target.radius > this.canvasWidth) {
        target.x = this.canvasWidth - target.radius;
        target.vx = -Math.abs(target.vx);
      }

      if (target.y - target.radius < 0) {
        target.y = target.radius;
        target.vy = Math.abs(target.vy);
      } else if (target.y + target.radius > this.canvasHeight) {
        target.y = this.canvasHeight - target.radius;
        target.vy = -Math.abs(target.vy);
      }

      // Check lifetime expiry
      if (target.maxLifetime > 0 && now - target.spawnTime > target.maxLifetime) {
        if (this.onMissCallback) {
          this.onMissCallback(target);
        }
        this.killTarget(target.id, false);
      }
    }

    // Update dying targets
    const DEATH_DURATION = 300;
    for (const dying of this.dyingTargets) {
      const elapsed = now - dying.deathTime;
      const progress = elapsed / DEATH_DURATION;
      dying.scale = 1 + progress * 0.5;
      dying.alpha = Math.max(0, 1 - progress);
    }
    this.dyingTargets = this.dyingTargets.filter(d => now - d.deathTime < DEATH_DURATION);

    // Remove dead targets from main array
    this.targets = this.targets.filter(t => t.isAlive);
  }

  checkHit(clickX: number, clickY: number): Target | null {
    // Check from last spawned to first (top to bottom rendering order)
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const target = this.targets[i];
      if (!target.isAlive) continue;

      const dx = clickX - target.x;
      const dy = clickY - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= target.radius) {
        return target;
      }
    }
    return null;
  }

  killTarget(id: string, animate: boolean = true): void {
    const target = this.targets.find(t => t.id === id);
    if (!target) return;

    if (animate) {
      this.dyingTargets.push({
        target: { ...target },
        deathTime: performance.now(),
        scale: 1,
        alpha: 1,
      });
    }

    target.isAlive = false;
  }

  getTargets(): Target[] {
    return this.targets.filter(t => t.isAlive);
  }

  getAliveCount(): number {
    return this.targets.filter(t => t.isAlive).length;
  }

  clearAll(): void {
    this.targets = [];
    this.dyingTargets = [];
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw alive targets
    for (const target of this.targets) {
      if (!target.isAlive) continue;
      this.drawTarget(ctx, target, 1, 1);
    }

    // Draw dying targets
    for (const dying of this.dyingTargets) {
      this.drawTarget(ctx, dying.target, dying.scale, dying.alpha);
    }
  }

  private drawTarget(ctx: CanvasRenderingContext2D, target: Target, scale: number, alpha: number): void {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(target.x, target.y);
    ctx.scale(scale, scale);

    const r = target.radius;
    const color = target.color;

    // Outer ring
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.stroke();

    // Inner fill (semi-transparent)
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    const fillColor = this.hexToRgba(color, 0.15);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Middle ring
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha * 0.6;
    ctx.stroke();

    // Center dot
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fill();

    // Cross-hair lines
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    const crossSize = r * 0.3;
    ctx.beginPath();
    ctx.moveTo(-crossSize, 0);
    ctx.lineTo(crossSize, 0);
    ctx.moveTo(0, -crossSize);
    ctx.lineTo(0, crossSize);
    ctx.stroke();

    ctx.restore();
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
