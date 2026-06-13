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

  // --- Weapon / shot visual effects ---
  private lastShotTime: number = -9999;   // for recoil + muzzle flash timing
  private lastShotHit: boolean = false;
  private tracers: { x1: number; y1: number; x2: number; y2: number; time: number }[] = [];
  private modeColor: string = '#6C63FF';

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

    // Trigger weapon visual effects (recoil, muzzle flash, tracer)
    this.fireWeaponEffect(x, y);

    this.currentMode?.handleClick(x, y);
  }

  private getBarrelTip(): { x: number; y: number } {
    // Barrel tip sits low-center, where the viewmodel muzzle points from.
    return { x: this.canvas.width * 0.5, y: this.canvas.height - 90 };
  }

  private fireWeaponEffect(x: number, y: number): void {
    const now = performance.now();
    this.lastShotTime = now;
    const tip = this.getBarrelTip();
    this.tracers.push({ x1: tip.x, y1: tip.y, x2: x, y2: y, time: now });
    if (this.tracers.length > 12) this.tracers.shift();
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

    const MODE_COLORS: Record<GameMode, string> = {
      flick: '#6C63FF', tracking: '#00D4FF', precision: '#00FF88',
      reaction: '#FFB800', stress: '#FF4444', personalized: '#FF6B9D',
    };
    this.modeColor = MODE_COLORS[this.config.mode] ?? '#6C63FF';
    this.tracers = [];

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

    // Shooting-range arena background
    this.drawArena();

    if (this.state === 'countdown') {
      this.drawCountdown();
    }

    if (this.state === 'playing') {
      this.particleSystem.draw(ctx);
      this.targetManager.draw(ctx);
      this.drawTracers();
      this.drawWeapon();
      this.drawMuzzleFlash();
      this.drawCrosshair();
    }
  }

  private drawArena(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const horizon = h * 0.42;

    // Wall (upper) — deep blue vertical gradient
    const wall = ctx.createLinearGradient(0, 0, 0, horizon);
    wall.addColorStop(0, '#0B1530');
    wall.addColorStop(1, '#122046');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, horizon);

    // Floor (lower) — darker blue receding into distance
    const floor = ctx.createLinearGradient(0, horizon, 0, h);
    floor.addColorStop(0, '#0A1024');
    floor.addColorStop(1, '#05060F');
    ctx.fillStyle = floor;
    ctx.fillRect(0, horizon, w, h - horizon);

    // Glow band on the horizon
    const glow = ctx.createLinearGradient(0, horizon - 40, 0, horizon + 40);
    glow.addColorStop(0, 'rgba(0,0,0,0)');
    glow.addColorStop(0.5, this.hexA(this.modeColorOrDefault(), 0.18));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizon - 40, w, 80);

    this.drawPerspectiveGrid(horizon);
    this.drawVignette();
  }

  private modeColorOrDefault(): string {
    return this.state === 'playing' ? this.modeColor : '#6C63FF';
  }

  private drawPerspectiveGrid(horizon: number): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const vanishX = w / 2;
    const color = this.modeColorOrDefault();

    ctx.save();
    ctx.strokeStyle = this.hexA(color, 0.16);
    ctx.lineWidth = 1;

    // Vertical lines converging to the vanishing point
    const cols = 14;
    for (let i = 0; i <= cols; i++) {
      const fx = (i / cols) * 2 - 1; // -1..1
      const baseX = vanishX + fx * w * 0.9;
      ctx.beginPath();
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(baseX, h);
      ctx.stroke();
    }

    // Horizontal floor lines, spacing grows toward the viewer
    const rows = 12;
    for (let i = 1; i <= rows; i++) {
      const t = i / rows;
      const y = horizon + Math.pow(t, 2.2) * (h - horizon);
      ctx.globalAlpha = 0.10 + t * 0.18;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();

    // Faint dot grid on the upper wall for texture
    ctx.fillStyle = this.hexA(color, 0.06);
    const spacing = 34;
    for (let x = spacing; x < w; x += spacing) {
      for (let y = spacing; y < horizon; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawVignette(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.75);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  private hexA(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

  private drawTracers(): void {
    const { ctx } = this;
    const now = performance.now();
    this.tracers = this.tracers.filter(t => now - t.time < 110);
    for (const t of this.tracers) {
      const age = (now - t.time) / 110;
      const alpha = 1 - age;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = this.hexA(this.modeColor, 1);
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = this.modeColor;
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
      // impact spark at the far end
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(t.x2, t.y2, 2 + (1 - age) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawWeapon(): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;
    const now = performance.now();
    const recoil = Math.max(0, 1 - (now - this.lastShotTime) / 130);
    const kick = recoil * recoil;

    const M = { x: w * 0.5, y: h - 90 };   // muzzle (where shots originate)
    const B = { x: w * 0.8, y: h + 40 };   // breech (off bottom edge)
    let dx = B.x - M.x;
    let dy = B.y - M.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;            // axis muzzle -> breech
    const px = -dy, py = dx;         // perpendicular

    const s = Math.min(Math.max(Math.min(w, h) / 680, 0.75), 1.5);
    const rox = dx * kick * 24;
    const roy = dy * kick * 24 + kick * 8;

    // (along the barrel, perpendicular) -> screen point
    const P = (a: number, pr: number): [number, number] => [
      M.x + dx * a * s + px * pr * s + rox,
      M.y + dy * a * s + py * pr * s + roy,
    ];
    const poly = (pts: [number, number][], fill: string, stroke?: string) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    };

    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';

    // Magazine (curved box dropping below the receiver)
    poly([P(150, 16), P(150, 64), P(210, 78), P(225, 30), P(210, 16)], '#1a1d2b', '#2c3350');

    // Stock / grip area near breech
    poly([P(250, -10), P(360, -34), P(380, 24), P(280, 30)], '#15171f', '#262b40');

    // Receiver (main body)
    poly([P(120, -22), P(255, -22), P(265, 22), P(125, 22)], '#23283c', '#3a4262');

    // Handguard (front body, lighter)
    poly([P(40, -16), P(125, -18), P(125, 14), P(45, 14)], '#2b3150', '#414a78');

    // Barrel (thin, dark metal)
    poly([P(-6, -9), P(50, -11), P(50, -2), P(-6, 0)], '#0e1018', '#2a2f44');

    // Top rail + sight
    poly([P(95, -22), P(135, -22), P(135, -30), P(95, -30)], '#171a26');
    poly([P(60, -18), P(70, -18), P(70, -26), P(60, -26)], '#171a26');

    // Accent strip in the mode color (glowing detail)
    ctx.shadowBlur = 12;
    ctx.shadowColor = this.modeColor;
    poly([P(135, -8), P(250, -8), P(252, -2), P(137, -2)], this.hexA(this.modeColor, 0.9));

    // Muzzle ring
    ctx.shadowBlur = 0;
    const [mx, my] = P(-4, -4.5);
    ctx.fillStyle = '#0a0b12';
    ctx.strokeStyle = '#3a4262';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mx, my, 7 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  private drawMuzzleFlash(): void {
    const { ctx } = this;
    const now = performance.now();
    const dt = now - this.lastShotTime;
    if (dt > 75) return;

    const f = 1 - dt / 75;          // 1 -> 0
    const tip = this.getBarrelTip();
    // recoil shifts the muzzle slightly; approximate the same offset
    const kick = f * f;
    const x = tip.x + 0.86 * kick * 24;
    const y = tip.y + 0.5 * kick * 24 + kick * 8 - 6;
    const s = Math.min(Math.max(Math.min(ctx.canvas.width, ctx.canvas.height) / 680, 0.75), 1.5);

    ctx.save();
    ctx.translate(x, y);

    // Outer glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 46 * s * f);
    glow.addColorStop(0, 'rgba(255,240,180,0.9)');
    glow.addColorStop(0.4, this.hexA(this.modeColor, 0.5 * f));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 46 * s * f, 0, Math.PI * 2);
    ctx.fill();

    // Star burst
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillStyle = `rgba(255,236,170,${0.95 * f})`;
    const spikes = 6;
    const outer = 30 * s * f;
    const inner = 9 * s * f;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const ang = (Math.PI / spikes) * i;
      const fx = Math.cos(ang) * r;
      const fy = Math.sin(ang) * r;
      i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
    }
    ctx.closePath();
    ctx.fill();

    // Bright core
    ctx.fillStyle = `rgba(255,255,255,${f})`;
    ctx.beginPath();
    ctx.arc(0, 0, 7 * s * f, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawCrosshair(): void {
    const { ctx } = this;
    const pos = this.mouseTracker.getPosition();
    const x = pos.x;
    const y = pos.y;
    const size = 10;
    const gap = 3;

    ctx.strokeStyle = this.modeColor;
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

  /** Debug helper: live target positions in canvas coordinates. */
  getAliveTargets(): { x: number; y: number; radius: number }[] {
    return this.targetManager.getTargets().map(t => ({ x: t.x, y: t.y, radius: t.radius }));
  }

  getCanvasSize(): { w: number; h: number } {
    return { w: this.canvas.width, h: this.canvas.height };
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
