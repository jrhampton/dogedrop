/**
 * Core game: jar bounds, spawner/aim, update loop, scoring, game-over,
 * and all canvas rendering (background, jar, coins, FX, next-up preview).
 */

class Game {
  constructor(canvas, dom) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dom = dom;

    this.W = 480;
    this.H = 760;
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this._resize();
    window.addEventListener('resize', () => this._resize());

    this.bounds = { left: 34, right: this.W - 34, top: 130, bottom: this.H - 26 };
    this.dangerLineY = 150;

    this.world = new PhysicsWorld(this.bounds);
    this.fx = new ParticleSystem();

    this.score = 0;
    this.ath = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.dangerTimer = 0;
    this.gameOver = false;
    this.paused = false;

    this.aimX = this.W / 2;
    this.dropCooldown = 0;
    this.dropCooldownMax = 0.28;
    this.currentTier = this._randomDropTier();
    this.nextTier = this._randomDropTier();

    this.candles = this._makeCandles();
    this.time = 0;

    this._bindInput();
  }

  _resize() {
    const scale = Math.min(1, (window.innerHeight - 40) / this.H, 560 / this.W);
    const displayScale = Math.max(0.5, scale) * this.dpr;
    this.canvas.width = Math.round(this.W * displayScale);
    this.canvas.height = Math.round(this.H * displayScale);
    this.canvas.style.width = `${this.W * Math.max(0.5, scale)}px`;
    this.canvas.style.height = `${this.H * Math.max(0.5, scale)}px`;
    this._renderScale = displayScale;
  }

  _randomDropTier() {
    return Math.floor(Math.random() * (MAX_DROP_TIER + 1));
  }

  _makeCandles() {
    const arr = [];
    let price = 50;
    for (let i = 0; i < 40; i++) {
      const open = price;
      price += (Math.random() - 0.48) * 14;
      const close = price;
      const high = Math.max(open, close) + Math.random() * 6;
      const low = Math.min(open, close) - Math.random() * 6;
      arr.push({ x: i * 34, open, close, high, low, up: close >= open });
    }
    return arr;
  }

  _bindInput() {
    const canvas = this.canvas;
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * this.W;
      this.aimX = x;
    });
    canvas.addEventListener('mousedown', () => this.tryDrop());
    canvas.addEventListener('touchmove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches[0];
      this.aimX = ((t.clientX - rect.left) / rect.width) * this.W;
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchstart', (e) => {
      this.tryDrop();
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.repeat && (e.code === 'Space')) return;
      if (e.code === 'ArrowLeft') this.aimX -= 22;
      else if (e.code === 'ArrowRight') this.aimX += 22;
      else if (e.code === 'Space' || e.code === 'ArrowDown') { this.tryDrop(); e.preventDefault(); }
      else if (e.code === 'KeyM') this.toggleMute();
      else if (e.code === 'KeyR' && this.gameOver) this.reset();
    });
  }

  clampAim() {
    const r = COIN_TIERS[this.currentTier].radius;
    this.aimX = Math.max(this.bounds.left + r, Math.min(this.bounds.right - r, this.aimX));
  }

  tryDrop() {
    audioEngine.resume();
    if (this.gameOver || this.paused || this.dropCooldown > 0) return;
    this.clampAim();
    const r = COIN_TIERS[this.currentTier].radius;
    const ball = this.world.addBall(this.currentTier, this.aimX, this.bounds.top - r * 0.4, r);
    ball.spawnT = 0;
    ball.vy = 60;
    audioEngine.drop();
    this.dropCooldown = this.dropCooldownMax;

    this.currentTier = this.nextTier;
    this.nextTier = this._randomDropTier();
  }

  toggleMute() {
    this.dom.muteBtn.classList.toggle('muted');
    const muted = this.dom.muteBtn.classList.contains('muted');
    audioEngine.setMuted(muted);
    this.dom.muteBtn.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
  }

  async loadAth() {
    this.ath = await gameStorage.get('dogedrop_ath', 0);
    this.dom.athValue.textContent = fmtScore(this.ath);
  }

  async reset() {
    this.world = new PhysicsWorld(this.bounds);
    this.fx = new ParticleSystem();
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.dangerTimer = 0;
    this.gameOver = false;
    this.currentTier = this._randomDropTier();
    this.nextTier = this._randomDropTier();
    this.dom.overlay.classList.remove('show');
    this.dom.scoreValue.textContent = '0';
    audioEngine.uiClick();
  }

  update(dt) {
    this.time += dt;
    if (this.dropCooldown > 0) this.dropCooldown -= dt;
    this.clampAim();

    if (this.gameOver) {
      this.fx.update(dt);
      return;
    }

    const { merges, landings } = this.world.step(dt);

    for (const { x, y, r, tier } of landings) {
      audioEngine.land(tier);
    }

    for (const { a, b } of merges) {
      const newTier = a.tier + 1;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      this.world.removeBall(a.id);
      this.world.removeBall(b.id);
      const r = COIN_TIERS[newTier].radius;
      const nb = this.world.addBall(newTier, mx, my, r);
      nb.vy = -160;
      nb.squash = 1.3;

      const tierDef = COIN_TIERS[newTier];
      this.fx.burst(mx, my, tierDef.color, tierDef.glow, 18 + newTier * 3);
      this.fx.ring(mx, my, r, tierDef.glow);
      this.fx.addShake(3 + newTier * 1.1);
      audioEngine.merge(newTier);

      this.score += tierDef.value;
      this.comboTimer = 1.1;
      this.combo += 1;
      if (this.combo >= 2) {
        this.fx.popup(mx, my - r - 10, `${tierDef.name}! x${this.combo}`, tierDef.glow);
        audioEngine.combo(this.combo);
      } else {
        this.fx.popup(mx, my - r - 10, `+${tierDef.value}`, '#ffffff');
      }

      if (newTier === MAX_TIER) {
        this.fx.popup(mx, my - r - 40, 'BITCOIN!', '#FFC876');
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this.dom.scoreValue.textContent = fmtScore(this.score);

    let danger = false;
    for (const b of this.world.balls) {
      const speed = Math.abs(b.vx) + Math.abs(b.vy);
      if (speed < 45 && b.y - b.r < this.dangerLineY) { danger = true; break; }
    }
    this.dangerTimer = danger ? this.dangerTimer + dt : 0;
    if (this.dangerTimer > 1.6) this.triggerGameOver();

    this.fx.update(dt);
  }

  async triggerGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    audioEngine.gameOver();
    const isNew = this.score > this.ath;
    if (isNew) {
      this.ath = this.score;
      await gameStorage.set('dogedrop_ath', this.ath);
      this.dom.athValue.textContent = fmtScore(this.ath);
      setTimeout(() => audioEngine.newHighScore(), 400);
    }
    this.dom.overlayScore.textContent = fmtScore(this.score);
    this.dom.overlayNewAth.style.display = isNew ? 'block' : 'none';
    this.dom.overlay.classList.add('show');
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(this._renderScale, 0, 0, this._renderScale, 0, 0);
    const shake = this.fx.getShakeOffset();
    ctx.translate(shake.x, shake.y);

    this._drawBackground(ctx);
    this._drawJar(ctx);

    const balls = [...this.world.balls].sort((a, b) => a.tier - b.tier);
    for (const b of balls) {
      const pop = b.spawnT < 1 ? 0.6 + 0.4 * easeOutBack(b.spawnT) : 1;
      drawCoin(ctx, b.tier, b.x, b.y, b.r * pop, { squash: b.squash });
    }

    this.fx.draw(ctx);
    this._drawAimGuide(ctx);
    this._drawNextPreview(ctx);
    this._drawComboLabel(ctx);

    ctx.restore();
  }

  _drawBackground(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, this.H);
    g.addColorStop(0, '#0b1220');
    g.addColorStop(1, '#04060a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.W, this.H);

    ctx.save();
    ctx.globalAlpha = 0.16;
    const scroll = (this.time * 14) % 34;
    for (const c of this.candles) {
      const x = c.x - scroll;
      if (x < -20 || x > this.W + 20) continue;
      const cx = x, midY = 620;
      ctx.strokeStyle = c.up ? '#14F195' : '#FF5C77';
      ctx.fillStyle = c.up ? '#14F195' : '#FF5C77';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, midY - c.high * 2.4);
      ctx.lineTo(cx, midY - c.low * 2.4);
      ctx.stroke();
      ctx.fillRect(cx - 5, midY - Math.max(c.open, c.close) * 2.4, 10, Math.max(2, Math.abs(c.close - c.open) * 2.4));
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.035)';
    ctx.lineWidth = 1;
    for (let y = 0; y < this.H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.W, y); ctx.stroke();
    }
    ctx.restore();
  }

  _drawJar(ctx) {
    const { left, right, top, bottom } = this.bounds;
    ctx.save();
    ctx.shadowColor = 'rgba(120,200,255,0.5)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = 'rgba(140,210,255,0.55)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(left, top - 10);
    ctx.lineTo(left, bottom - 18);
    ctx.quadraticCurveTo(left, bottom, left + 18, bottom);
    ctx.lineTo(right - 18, bottom);
    ctx.quadraticCurveTo(right, bottom, right, bottom - 18);
    ctx.lineTo(right, top - 10);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const dashOffset = (this.time * 30) % 16;
    ctx.strokeStyle = this.dangerTimer > 0 ? '#FF5C77' : 'rgba(255,92,119,0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.moveTo(left, this.dangerLineY);
    ctx.lineTo(right, this.dangerLineY);
    ctx.stroke();
    ctx.restore();
  }

  _drawAimGuide(ctx) {
    if (this.gameOver) return;
    const { top, bottom } = this.bounds;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 10]);
    ctx.beginPath();
    ctx.moveTo(this.aimX, top);
    ctx.lineTo(this.aimX, bottom);
    ctx.stroke();
    ctx.restore();

    const tier = COIN_TIERS[this.currentTier];
    const alpha = this.dropCooldown > 0 ? 0.45 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawCoin(ctx, this.currentTier, this.aimX, top - tier.radius * 0.4, tier.radius);
    ctx.restore();
  }

  _drawNextPreview(ctx) {
    const tier = COIN_TIERS[this.nextTier];
    const cx = this.W - 46, cy = 40;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(cx - 40, cy - 32, 80, 64, 12);
    ctx.fill();
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', cx, cy - 16);
    ctx.restore();
    const r = Math.min(22, tier.radius);
    drawCoin(ctx, this.nextTier, cx, cy + 10, r);
  }

  _drawComboLabel(ctx) {
    if (this.combo < 2) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, this.comboTimer / 0.3);
    ctx.font = '800 15px system-ui, sans-serif';
    ctx.fillStyle = '#FFC876';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#FFC876';
    ctx.shadowBlur = 8;
    ctx.fillText(`COMBO x${this.combo}`, 20, 40);
    ctx.restore();
  }
}

function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function fmtScore(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
