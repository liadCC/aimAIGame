import { GameConfig, GameState, GameMode } from '../types/game.types';
import { SessionMetrics } from '../types/metrics.types';
import { WeaknessProfile } from '../types/player.types';
import { MouseTracker } from './MouseTracker';
import { TargetManager } from './TargetManager';
import { MetricsCollector } from './MetricsCollector';
import { ParticleSystem } from './effects/ParticleSystem';
import { BaseMode, ModeEvents } from './modes/BaseMode';
import { FlickMode } from './modes/FlickMode';
import { TrackingMode } from './modes/TrackingMode';
import { PrecisionMode } from './modes/PrecisionMode';
import { ReactionMode } from './modes/ReactionMode';
import { StressMode } from './modes/StressMode';
import { PersonalizedMode } from './modes/PersonalizedMode';

type EventHandler = (...args: unknown[]) => void;

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrame: number = 0;
  private lastTime: number = 0;
  private state: GameState = 'idle';
  private currentMode: BaseMode | null = null;
  private mouseTracker: MouseTracker;
  private targetManager: TargetManager;
  private metricsCollector: MetricsCollector;
  private particleSystem: ParticleSystem;
  private listeners: Map<string, EventHandler[]> = new Map();
  private config: GameConfig | null = null;
  private sessionDuration: number = 60;
  private sessionStartTime: number = 0;
  private countdownValue: number = 3;
  private countdownStart: number = 0;
  private score: number = 0;
  private streak: number = 0;
  private weaknesses: WeaknessProfile | null = null;

  // Bound event handlers for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundClick: (e: MouseEvent) => void;
  private boundPointerLockChange: () => void;
  private boundMouseMovePointerLock: (e: MouseEvent) => void;
  private isPointerLocked: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.mouseTracker = new MouseTracker();
    this.targetManager = new TargetManager(canvas.width, canvas.height);
    this.metricsCollector = new MetricsCollector();
    this.particleSystem = new ParticleSystem();

    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundClick = this.onMouseClick.bind(this);
    this.boundPointerLockChange = this.onPointerLockChange.bind(this);
    this.boundMouseMovePointerLock = this.onPointerLockMouseMove.bind(this);

    canvas.addEventListener('mousemove', this.boundMouseMove);
    canvas.addEventListener('click', this.boundClick);
    document.addEventListener('pointerlockchange', this.boundPointerLockChange);
    document.addEventListener('mousemove', this.boundMouseMovePointerLock);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => this.handleResize());
    resizeObserver.observe(canvas);
    this.handleResize();
  }

  private handleResize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth || 800;
      this.canvas.height = parent.clientHeight || 600;
    }
    this.targetManager.resize(this.canvas.width, this.canvas.height);
    if (this.currentMode) {
      this.currentMode.setCanvasSize(this.canvas.width, this.canvas.height);
    }
  }

  private onMouseMove(e: MouseEvent): void {
    if (this.isPointerLocked) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.mouseTracker.setPosition(x, y);
    this.particleSystem.updateCursorTrail(x, y);
  }

  private onPointerLockMouseMove(e: MouseEvent): void {
    if (!this.isPointerLocked) return;
    this.mouseTracker.applyDelta(e.movementX, e.movementY, this.canvas.width, this.canvas.height);
    const pos = this.mouseTracker.getPosition();
    this.particleSystem.updateCursorTrail(pos.x, pos.y);
  }

  private onMouseClick(e: MouseEvent): void {
    if (this.state !== 'playing') return;
    let x: number, y: number;

    if (this.isPointerLocked) {
      const pos = this.mouseTracker.getPosition();
      x = pos.x;
      y = pos.y;
    } else {
      const rect = this.canvas.getBoundingClientRect();
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    this.currentMode?.handleClick(x, y);
  }

  private onPointerLockChange(): void {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  }

  setConfig(config: GameConfig): void {
    this.config = config;
    this.sessionDuration = config.duration;
  }

  setWeaknesses(w: WeaknessProfile): void {
    this.weaknesses = w;
  }

  startCountdown(): void {
    this.state = 'countdown';
    this.countdownValue = 3;
    this.countdownStart = performance.now();
    this.emit('stateChange', this.state);
    this.startLoop();
  }

  startGame(): void {
    if (!this.config) return;
    this.state = 'playing';
    this.score = 0;
    this.streak = 0;
    this.sessionStartTime = performance.now();
    this.emit('stateChange', this.state);

    this.currentMode = this.createMode(this.config.mode);
    this.currentMode.setCanvasSize(this.canvas.width, this.canvas.height);

    this.targetManager.onTargetMiss(() => {
      this.streak = 0;
    });

    this.currentMode.start();
  }

  private createMode(mode: GameMode): BaseMode {
    const events: ModeEvents = {
      onScore: (points, streak) => {
        this.score += points;
        this.streak = streak;
        this.emit('score', this.score, streak);
      },
      onMiss: () => {
        this.streak = 0;
        this.emit('miss');
      },
      onComplete: () => {
        this.endSession();
      },
    };

    if (!this.config) throw new Error('No config');

    switch (mode) {
      case 'flick': return new FlickMode(this.config, this.targetManager, this.metricsCollector, this.mouseTracker, this.particleSystem, events);
      case 'tracking': return new TrackingMode(this.config, this.targetManager, this.metricsCollector, this.mouseTracker, this.particleSystem, events);
      case 'precision': return new PrecisionMode(this.config, this.targetManager, this.metricsCollector, this.mouseTracker, this.particleSystem, events);
      case 'reaction': return new ReactionMode(this.config, this.targetManager, this.metricsCollector, this.mouseTracker, this.particleSystem, events);
      case 'stress': return new StressMode(this.config, this.targetManager, this.metricsCollector, this.mouseTracker, this.particleSystem, events);
      case 'personalized': return new PersonalizedMode(
        this.config, this.targetManager, this.metricsCollector, this.mouseTracker, this.particleSystem, events,
        this.weaknesses ?? { overflicking: 0, underflicking: 0, trackingDeviation: 0, jitter: 0, reactionSlowness: 0, precisionIssues: 0, speedSacrifice: 0 }
      );
    }
  }

  stopGame(): void {
    this.endSession();
  }

  private endSession(): void {
    this.state = 'results';
    this.currentMode?.stop();
    this.currentMode = null;
    this.particleSystem.clear();

    const metrics = this.metricsCollector.computeMetrics();
    this.emit('sessionEnd', metrics, this.score);
    this.emit('stateChange', this.state);

    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }

  private startLoop(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop(timestamp: number): void {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt, timestamp);
    this.draw();

    if (this.state !== 'idle' && this.state !== 'results') {
      this.animFrame = requestAnimationFrame((t) => this.loop(t));
    }
  }

  private update(dt: number, now: number): void {
    if (this.state === 'countdown') {
      const elapsed = (now - this.countdownStart) / 1000;
      const newCount = Math.max(0, Math.ceil(3 - elapsed));
      if (newCount !== this.countdownValue) {
        this.countdownValue = newCount;
        this.emit('countdown', this.countdownValue);
      }
      if (elapsed >= 3) {
        this.startGame();
        return;
      }
    }

    if (this.state === 'playing') {
      const elapsed = (now - this.sessionStartTime) / 1000;
      const remaining = Math.max(0, this.sessionDuration - elapsed);

      this.currentMode?.update(dt, now);
      this.targetManager.update(dt, now);
      this.particleSystem.update(dt);

      // Emit live metrics periodically
      const liveMetrics = {
        hits: this.metricsCollector.getHitCount(),
        totalShots: this.metricsCollector.getClickCount(),
        accuracy: this.metricsCollector.getLiveAccuracy(),
        currentStreak: this.metricsCollector.getCurrentStreak(),
        timeRemaining: remaining,
      };
      this.emit('liveMetrics', liveMetrics);

      if (remaining <= 0) {
        this.endSession();
      }
    }
  }

  private draw(): void {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dot grid
    this.drawDotGrid();

    if (this.state === 'countdown') {
      this.drawCountdown();
    }

    if (this.state === 'playing') {
      this.particleSystem.draw(ctx);
      this.targetManager.draw(ctx);
      this.drawCrosshair();
    }
  }

  private drawDotGrid(): void {
    const { ctx, canvas } = this;
    const spacing = 30;
    ctx.fillStyle = 'rgba(108, 99, 255, 0.08)';
    for (let x = spacing; x < canvas.width; x += spacing) {
      for (let y = spacing; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawCountdown(): void {
    const { ctx, canvas } = this;
    const elapsed = (performance.now() - this.countdownStart) / 1000;
    const phase = elapsed % 1;
    const scale = 1.5 - phase * 0.5;
    const alpha = 1 - phase;
    const num = Math.max(1, Math.ceil(3 - elapsed));
    const text = num.toString();

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.font = 'bold 120px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#6C63FF';
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#6C63FF';
    ctx.fillText(text, 0, 0);
    ctx.restore();

    // "Get Ready" text
    ctx.save();
    ctx.font = '24px Inter, system-ui';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(224, 224, 255, 0.6)';
    ctx.fillText('GET READY', canvas.width / 2, canvas.height / 2 + 100);
    ctx.restore();
  }

  private drawCrosshair(): void {
    const { ctx } = this;
    const pos = this.mouseTracker.getPosition();
    const x = pos.x;
    const y = pos.y;
    const size = 10;
    const gap = 3;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 0;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(x - size - gap, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + size + gap, y);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(x, y - size - gap);
    ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + size + gap);
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  on(event: string, handler: EventHandler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const h of handlers) {
        h(...args);
      }
    }
  }

  getState(): GameState {
    return this.state;
  }

  getScore(): number {
    return this.score;
  }

  destroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousemove', this.boundMouseMove);
    this.canvas.removeEventListener('click', this.boundClick);
    document.removeEventListener('pointerlockchange', this.boundPointerLockChange);
    document.removeEventListener('mousemove', this.boundMouseMovePointerLock);
    if (this.isPointerLocked) document.exitPointerLock();
    this.currentMode?.stop();
    this.listeners.clear();
  }
}
