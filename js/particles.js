/**
 * Merge burst particles, shockwave rings, floating score popups,
 * and a screen-shake accumulator.
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.popups = [];
    this.shake = 0;
  }

  burst(x, y, color, glow, count = 22) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 340;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 80,
        r: 2 + Math.random() * 4,
        life: 1,
        decay: 0.9 + Math.random() * 0.6,
        color: Math.random() < 0.5 ? color : glow,
      });
    }
  }

  ring(x, y, radius, color) {
    this.rings.push({ x, y, r: radius * 0.4, maxR: radius * 3.2, life: 1, color });
  }

  popup(x, y, text, color) {
    this.popups.push({ x, y, text, color, life: 1, vy: -60 });
  }

  addShake(amount) {
    this.shake = Math.min(this.shake + amount, 24);
  }

  update(dt) {
    for (const p of this.particles) {
      p.vy += 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * p.decay;
    }
    this.particles = this.particles.filter((p) => p.life > 0);

    for (const r of this.rings) {
      r.r += (r.maxR - r.r) * dt * 6;
      r.life -= dt * 2.2;
    }
    this.rings = this.rings.filter((r) => r.life > 0);

    for (const p of this.popups) {
      p.y += p.vy * dt;
      p.life -= dt * 0.9;
    }
    this.popups = this.popups.filter((p) => p.life > 0);

    this.shake *= 0.88;
    if (this.shake < 0.05) this.shake = 0;
  }

  getShakeOffset() {
    if (!this.shake) return { x: 0, y: 0 };
    const a = Math.random() * Math.PI * 2;
    return { x: Math.cos(a) * this.shake, y: Math.sin(a) * this.shake };
  }

  draw(ctx) {
    for (const r of this.rings) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.life);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = r.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const p of this.popups) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.font = '700 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }
}
