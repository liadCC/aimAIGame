import { BaseMode, ModeEvents } from './BaseMode';
import { GameConfig } from '../../types/game.types';
import { WeaknessProfile } from '../../types/player.types';
import { TargetManager } from '../TargetManager';
import { MetricsCollector } from '../MetricsCollector';
import { MouseTracker } from '../MouseTracker';
import { ParticleSystem } from '../effects/ParticleSystem';

type SubMode = 'flick' | 'tracking' | 'precision' | 'reaction';

interface SubModeConfig {
  type: SubMode;
  weight: number;
}

export class PersonalizedMode extends BaseMode {
  private weaknesses: WeaknessProfile;
  private subModeQueue: SubMode[] = [];
  private currentSubMode: SubMode = 'flick';
  private targetSpawned: boolean = false;
  private targetVisible: boolean = false;
  private waitTimer: ReturnType<typeof setTimeout> | null = null;
  private isMoving: boolean = false;
  private elapsedTime: number = 0;

  constructor(
    config: GameConfig,
    targetManager: TargetManager,
    metricsCollector: MetricsCollector,
    mouseTracker: MouseTracker,
    particles: ParticleSystem,
    events: ModeEvents,
    weaknesses: WeaknessProfile
  ) {
    super(config, targetManager, metricsCollector, mouseTracker, particles, events);
    this.weaknesses = weaknesses;
  }

  start(): void {
    this.isRunning = true;
    this.score = 0;
    this.streak = 0;
    this.elapsedTime = 0;
    this.targetSpawned = false;
    this.metricsCollector.reset();
    this.targetManager.clearAll();

    this.buildSubModeQueue();
    this.runNextSubMode();
  }

  stop(): void {
    this.isRunning = false;
    if (this.waitTimer) clearTimeout(this.waitTimer);
    this.targetManager.clearAll();
  }

  update(dt: number, _now: number): void {
    if (!this.isRunning) return;
    this.elapsedTime += dt;

    if (this.currentSubMode === 'reaction') {
      if (this.targetVisible && this.targetManager.getAliveCount() === 0) {
        this.targetVisible = false;
        this.streak = 0;
        this.events.onMiss();
        setTimeout(() => { if (this.isRunning) this.runNextSubMode(); }, 400);
      }
    } else {
      if (this.targetManager.getAliveCount() === 0 && this.targetSpawned) {
        this.targetSpawned = false;
        setTimeout(() => { if (this.isRunning) this.runNextSubMode(); }, 200);
      }
    }
  }

  handleClick(x: number, y: number): void {
    if (!this.isRunning) return;

    if (this.currentSubMode === 'reaction' && !this.targetVisible) {
      this.particles.spawnMissFlash(x, y);
      this.streak = 0;
      return;
    }

    const hit = this.targetManager.checkHit(x, y);
    if (hit) {
      this.targetSpawned = false;
      this.targetVisible = false;
      this.handleHit(hit, x, y);
      setTimeout(() => { if (this.isRunning) this.runNextSubMode(); }, 200);
    } else {
      const nearest = this.findNearestTarget(x, y);
      this.handleMiss(x, y, nearest);
    }
  }

  private buildSubModeQueue(): void {
    const w = this.weaknesses;
    const subModes: SubModeConfig[] = [
      { type: 'flick', weight: (w.overflicking + w.underflicking) / 2 },
      { type: 'tracking', weight: w.trackingDeviation },
      { type: 'precision', weight: w.precisionIssues + w.jitter * 0.5 },
      { type: 'reaction', weight: w.reactionSlowness },
    ];

    subModes.sort((a, b) => b.weight - a.weight);

    // Build queue: 40% weakest, 30% second, 30% random
    this.subModeQueue = [];
    const total = 20;
    const counts = [
      Math.round(total * 0.4),
      Math.round(total * 0.3),
      Math.round(total * 0.15),
      Math.round(total * 0.15),
    ];

    for (let i = 0; i < subModes.length; i++) {
      for (let j = 0; j < counts[i]; j++) {
        this.subModeQueue.push(subModes[i].type);
      }
    }

    // Shuffle
    for (let i = this.subModeQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.subModeQueue[i], this.subModeQueue[j]] = [this.subModeQueue[j], this.subModeQueue[i]];
    }
  }

  private runNextSubMode(): void {
    if (!this.isRunning) return;

    if (this.subModeQueue.length === 0) {
      this.buildSubModeQueue();
    }

    this.currentSubMode = this.subModeQueue.shift()!;
    this.targetManager.clearAll();
    this.targetSpawned = false;
    this.targetVisible = false;

    const mult = this.getDifficultyMultiplier();

    switch (this.currentSubMode) {
      case 'flick': {
        const radius = Math.max(10, Math.round(30 / mult));
        this.targetManager.spawnTarget({ radius, color: '#FF6B9D', maxLifetime: 3500, vx: 0, vy: 0 });
        this.targetSpawned = true;
        break;
      }
      case 'tracking': {
        const speed = 80 * mult;
        const angle = Math.random() * Math.PI * 2;
        this.targetManager.spawnTarget({ radius: 20, color: '#FF6B9D', maxLifetime: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
        this.targetSpawned = true;
        break;
      }
      case 'precision': {
        const r = Math.max(5, Math.round(12 / mult));
        this.targetManager.spawnTarget({ radius: r, color: '#FF6B9D', maxLifetime: 3000, vx: 0, vy: 0 });
        this.targetSpawned = true;
        break;
      }
      case 'reaction': {
        const delay = 300 + Math.random() * 1000;
        this.waitTimer = setTimeout(() => {
          if (!this.isRunning) return;
          this.targetVisible = true;
          this.targetManager.spawnTarget({ radius: 25, color: '#FF6B9D', maxLifetime: Math.round(500 / mult), vx: 0, vy: 0 });
        }, delay);
        break;
      }
    }
  }
}
