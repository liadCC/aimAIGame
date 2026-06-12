interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
  color: string;
  alpha: number;
}

interface MissFlash {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

interface CursorPoint {
  x: number;
  y: number;
  timestamp: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private missFlashes: MissFlash[] = [];
  private cursorTrail: CursorPoint[] = [];
  private readonly MAX_TRAIL = 8;

  spawnHitParticles(x: number, y: number, color: string = '#6C63FF'): void {
    const count = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.4,
        radius: 2 + Math.random() * 3,
        color,
        alpha: 1,
      });
    }
  }

  spawnMissFlash(x: number, y: number): void {
    this.missFlashes.push({
      x,
      y,
      radius: 8,
      life: 1,
      maxLife: 0.3,
    });
  }

  updateCursorTrail(x: number, y: number): void {
    const now = performance.now();
    this.cursorTrail.push({ x, y, timestamp: now });
    // Keep only last 8 and within 100ms window
    const cutoff = now - 100;
    this.cursorTrail = this.cursorTrail
      .filter(p => p.timestamp > cutoff)
      .slice(-this.MAX_TRAIL);
  }

  update(dt: number): void {
    // Update particles
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // gravity
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt / p.maxLife;
      p.alpha = Math.max(0, p.life);
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Update miss flashes
    for (const f of this.missFlashes) {
      f.life -= dt / f.maxLife;
      f.radius += 2;
    }
    this.missFlashes = this.missFlashes.filter(f => f.life > 0);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Draw cursor trail
    for (let i = 0; i < this.cursorTrail.length; i++) {
      const p = this.cursorTrail[i];
      const alpha = (i / this.cursorTrail.length) * 0.4;
      const radius = 2 + (i / this.cursorTrail.length) * 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(108, 99, 255, ${alpha})`;
      ctx.fill();
    }

    // Draw hit particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.restore();
    }

    // Draw miss flashes
    for (const f of this.missFlashes) {
      const alpha = Math.max(0, f.life) * 0.8;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#FF4444';
      ctx.stroke();
      ctx.restore();
    }
  }

  clear(): void {
    this.particles = [];
    this.missFlashes = [];
    this.cursorTrail = [];
  }
}
