/**
 * Minimal circle-physics engine for the merge jar.
 * Semi-implicit Euler integration + multiple constraint-relaxation passes
 * per frame (wall clamp + pairwise de-overlap) for stable, non-jittery
 * stacking — the same family of technique as position-based dynamics.
 */

class Ball {
  constructor(id, tier, x, y, r) {
    this.id = id;
    this.tier = tier;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = r;
    this.settleTimer = 0;
    this.mergedInto = null;
    this.spawnT = 0; // for pop-in animation
    this.squash = 1;
  }
}

class PhysicsWorld {
  constructor(bounds) {
    this.bounds = bounds; // {left, right, top, bottom}
    this.balls = [];
    this.nextId = 1;
    this.gravity = 1500; // px/s^2
    this.restitution = 0.12;
    this.friction = 0.985;
    this.iterations = 10;
    this.pendingMerges = [];
    this.landings = [];
  }

  addBall(tier, x, y, r) {
    const b = new Ball(this.nextId++, tier, x, y, r);
    this.balls.push(b);
    return b;
  }

  removeBall(id) {
    this.balls = this.balls.filter((b) => b.id !== id);
  }

  step(dt) {
    this.pendingMerges = [];
    this.landings = [];
    const sub = 4;
    const sdt = dt / sub;
    for (let s = 0; s < sub; s++) this._substep(sdt);
    return { merges: this.pendingMerges, landings: this.landings };
  }

  _substep(dt) {
    const { balls, bounds } = this;

    for (const b of balls) {
      b.vy += this.gravity * dt;
      b.vx *= this.friction;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.spawnT = Math.min(1, b.spawnT + dt * 8);
      b.squash += (1 - b.squash) * Math.min(1, dt * 10);
    }

    for (let iter = 0; iter < this.iterations / 4; iter++) {
      // Walls
      for (const b of balls) {
        if (b.x - b.r < bounds.left) {
          b.x = bounds.left + b.r;
          if (b.vx < 0) b.vx = -b.vx * this.restitution;
        }
        if (b.x + b.r > bounds.right) {
          b.x = bounds.right - b.r;
          if (b.vx > 0) b.vx = -b.vx * this.restitution;
        }
        if (b.y + b.r > bounds.bottom) {
          const hitVy = b.vy;
          b.y = bounds.bottom - b.r;
          if (hitVy > 260 && b.squash > 0.9) {
            b.squash = 0.78;
            this.landings.push({ x: b.x, y: b.y, r: b.r, tier: b.tier });
          }
          if (b.vy > 0) b.vy = -b.vy * this.restitution;
        }
        if (b.y - b.r < bounds.top) {
          b.y = bounds.top + b.r;
          if (b.vy < 0) b.vy *= 0.5;
        }
      }

      // Pairwise
      for (let i = 0; i < balls.length; i++) {
        const a = balls[i];
        for (let j = i + 1; j < balls.length; j++) {
          const b = balls[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          const minDist = a.r + b.r;
          if (distSq >= minDist * minDist || distSq < 1e-6) continue;
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist, ny = dy / dist;
          const push = overlap * 0.5;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;

          const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
          const rel = rvx * nx + rvy * ny;
          if (rel < 0) {
            const imp = -rel * (1 + this.restitution) * 0.5;
            a.vx -= imp * nx; a.vy -= imp * ny;
            b.vx += imp * nx; b.vy += imp * ny;
          }

          if (
            a.tier === b.tier &&
            !a.mergedInto &&
            !b.mergedInto &&
            a.tier < 9 &&
            overlap > a.r * 0.25
          ) {
            a.mergedInto = b.id;
            b.mergedInto = a.id;
            this.pendingMerges.push({ a, b });
          }
        }
      }
    }
  }
}
