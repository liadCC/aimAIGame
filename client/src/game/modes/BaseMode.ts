import { GameConfig, ClickEvent, Target } from '../../types/game.types';
import { TargetManager } from '../TargetManager';
import { MetricsCollector } from '../MetricsCollector';
import { MouseTracker } from '../MouseTracker';
import { ParticleSystem } from '../effects/ParticleSystem';

export interface ModeEvents {
  onScore: (points: number, streak: number) => void;
  onMiss: () => void;
  onComplete: () => void;
}

export abstract class BaseMode {
  protected config: GameConfig;
  protected targetManager: TargetManager;
  protected metricsCollector: MetricsCollector;
  protected mouseTracker: MouseTracker;
  protected particles: ParticleSystem;
  protected events: ModeEvents;
  protected score: number = 0;
  protected streak: number = 0;
  protected startTime: number = 0;
  protected isRunning: boolean = false;
  protected canvasWidth: number = 800;
  protected canvasHeight: number = 600;

  constructor(
    config: GameConfig,
    targetManager: TargetManager,
    metricsCollector: MetricsCollector,
    mouseTracker: MouseTracker,
    particles: ParticleSystem,
    events: ModeEvents
  ) {
    this.config = config;
    this.targetManager = targetManager;
    this.metricsCollector = metricsCollector;
    this.mouseTracker = mouseTracker;
    this.particles = particles;
    this.events = events;
  }

  setCanvasSize(w: number, h: number): void {
    this.canvasWidth = w;
    this.canvasHeight = h;
  }

  abstract start(): void;
  abstract update(dt: number, now: number): void;
  abstract handleClick(x: number, y: number): void;
  abstract stop(): void;

  protected computeScore(reactionTime: number): number {
    const base = 100;
    const speedBonus = Math.min(500, (1000 / Math.max(50, reactionTime)) * 10);
    const streakMultiplier = Math.min(3, 1 + this.streak * 0.1);
    return Math.round((base + speedBonus) * streakMultiplier);
  }

  protected handleHit(target: Target, clickX: number, clickY: number): void {
    const now = performance.now();
    const reactionTime = now - target.spawnTime;
    const mouseSpeed = this.mouseTracker.getSpeed();
    const jitter = this.mouseTracker.computeJitterScore();
    const smoothness = this.mouseTracker.computePathSmoothness();
    const correctionCount = this.mouseTracker.computeCorrectionCount(target.x, target.y);
    const { overshoot, undershoot } = this.mouseTracker.detectOvershoot(target.x, target.y, target.radius);

    const clickEvent: ClickEvent = {
      targetId: target.id,
      clickX,
      clickY,
      targetX: target.x,
      targetY: target.y,
      hit: true,
      missDistance: 0,
      reactionTime,
      mouseSpeedAtClick: mouseSpeed,
      flickAngle: Math.atan2(clickY - target.y, clickX - target.x),
      overshoot,
      undershoot,
      correctionCount,
      pathSmoothness: smoothness,
      timestamp: now,
    };

    this.metricsCollector.recordClick(clickEvent);
    this.metricsCollector.recordJitterSample(jitter);

    const points = this.computeScore(reactionTime);
    this.score += points;
    this.streak++;

    this.particles.spawnHitParticles(clickX, clickY, target.color);
    this.targetManager.killTarget(target.id);
    this.events.onScore(points, this.streak);
  }

  protected handleMiss(clickX: number, clickY: number, nearestTarget?: Target): void {
    const now = performance.now();
    const mouseSpeed = this.mouseTracker.getSpeed();

    const missDistance = nearestTarget
      ? Math.sqrt((clickX - nearestTarget.x) ** 2 + (clickY - nearestTarget.y) ** 2)
      : 999;

    const clickEvent: ClickEvent = {
      targetId: nearestTarget?.id ?? null,
      clickX,
      clickY,
      targetX: nearestTarget?.x ?? clickX,
      targetY: nearestTarget?.y ?? clickY,
      hit: false,
      missDistance,
      reactionTime: 0,
      mouseSpeedAtClick: mouseSpeed,
      flickAngle: nearestTarget ? Math.atan2(clickY - nearestTarget.y, clickX - nearestTarget.x) : 0,
      overshoot: false,
      undershoot: false,
      correctionCount: 0,
      pathSmoothness: 0,
      timestamp: now,
    };

    this.metricsCollector.recordClick(clickEvent);
    this.particles.spawnMissFlash(clickX, clickY);
    this.streak = 0;
    this.events.onMiss();
  }

  protected findNearestTarget(x: number, y: number): Target | undefined {
    const targets = this.targetManager.getTargets();
    if (targets.length === 0) return undefined;

    let nearest = targets[0];
    let minDist = Infinity;
    for (const t of targets) {
      const dist = Math.sqrt((x - t.x) ** 2 + (y - t.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = t;
      }
    }
    return nearest;
  }

  protected getDifficultyMultiplier(): number {
    switch (this.config.difficulty) {
      case 'easy': return 0.7;
      case 'medium': return 1.0;
      case 'hard': return 1.4;
      case 'elite': return 2.0;
    }
  }

  getScore(): number {
    return this.score;
  }

  getStreak(): number {
    return this.streak;
  }
}
