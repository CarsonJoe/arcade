const WIDTH = 360;
const HEIGHT = 620;
const PADDLE_Y = HEIGHT - 42;
const PADDLE_HEIGHT = 14;
const BALL_RADIUS = 7;
const BRICK_COLS = 8;
const BRICK_GAP = 6;
const BRICK_TOP = 92;
const BRICK_MARGIN = 18;

const POWER_COLORS = {
  wide: '#38BDF8',
  slow: '#F59E0B',
};

const BRICK_PALETTE = [
  ['#1D4ED8', '#60A5FA'],
  ['#7C3AED', '#C4B5FD'],
  ['#C026D3', '#F0ABFC'],
  ['#EA580C', '#FDBA74'],
  ['#16A34A', '#86EFAC'],
  ['#0891B2', '#67E8F9'],
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function fmt(value) {
  if (value >= 1000000) return `${Math.round(value / 100000) / 10}m`;
  if (value >= 10000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

let cssReady = false;
function injectCSS() {
  if (cssReady) return;
  cssReady = true;

  const style = document.createElement('style');
  style.textContent = `
.bb {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #F8FAFC;
  background:
    radial-gradient(circle at 16% 10%, rgba(56,189,248,.16), transparent 28%),
    radial-gradient(circle at 82% 12%, rgba(249,115,22,.16), transparent 28%),
    linear-gradient(180deg, #07111E 0%, #0B1326 44%, #111827 100%);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.bb-head {
  padding:
    calc(env(safe-area-inset-top, 18px) + 10px)
    max(14px, calc(env(safe-area-inset-right, 0px) + 50px))
    0
    max(14px, env(safe-area-inset-left, 0px));
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.bb-kicker,
.bb-label,
.bb-copy {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(226,232,240,.58);
}

.bb-title {
  margin-top: 4px;
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.bb-sub {
  margin-top: 6px;
  max-width: 24ch;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(226,232,240,.74);
}

.bb-launch {
  border: none;
  border-radius: 16px;
  padding: 12px 14px;
  min-width: 82px;
  color: #0F172A;
  background: linear-gradient(180deg, #FDE68A 0%, #F59E0B 100%);
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 16px 28px rgba(245,158,11,.18);
}

.bb-launch:active,
.bb-overlay-btn:active {
  transform: scale(.97);
}

.bb-stats {
  padding: 0 max(14px, env(safe-area-inset-right, 0px)) 0 max(14px, env(safe-area-inset-left, 0px));
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.bb-stat {
  padding: 10px 12px 12px;
  border-radius: 16px;
  background: rgba(15,23,42,.56);
  border: 1px solid rgba(148,163,184,.14);
  box-shadow: 0 12px 24px rgba(2,6,23,.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.bb-stat-value {
  margin-top: 6px;
  font-size: 22px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
  font-variant-numeric: tabular-nums;
}

.bb-stage-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}

.bb-frame {
  position: relative;
  width: 100%;
  max-width: ${WIDTH}px;
  aspect-ratio: ${WIDTH} / ${HEIGHT};
  border-radius: 26px;
  overflow: hidden;
  background: rgba(15,23,42,.72);
  border: 1px solid rgba(148,163,184,.14);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 24px 42px rgba(2,6,23,.26);
}

.bb-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.bb-overlay {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(2,6,23,.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.bb-overlay.show {
  display: flex;
}

.bb-overlay-card {
  width: 100%;
  padding: 22px 20px;
  border-radius: 22px;
  background: rgba(15,23,42,.86);
  border: 1px solid rgba(148,163,184,.16);
  box-shadow: 0 20px 40px rgba(2,6,23,.28);
}

.bb-overlay-title {
  margin-top: 10px;
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.bb-overlay-copy {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.55;
  color: rgba(226,232,240,.78);
}

.bb-overlay-btn {
  width: 100%;
  margin-top: 18px;
  border: none;
  border-radius: 16px;
  padding: 15px 18px;
  color: #F8FAFC;
  background: linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%);
  font: inherit;
  font-size: 16px;
  font-weight: 800;
}

.bb-foot {
  padding:
    0 max(14px, env(safe-area-inset-right, 0px))
    calc(env(safe-area-inset-bottom, 0px) + 12px)
    max(14px, env(safe-area-inset-left, 0px));
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bb-status {
  padding: 11px 12px 13px;
  border-radius: 16px;
  background: rgba(15,23,42,.56);
  border: 1px solid rgba(148,163,184,.14);
  font-size: 13px;
  line-height: 1.45;
  color: rgba(226,232,240,.84);
}

.bb-powers {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  min-height: 26px;
}

.bb-power {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #fff;
}

@media (max-height: 780px) {
  .bb-title { font-size: 22px; }
  .bb-stats { gap: 6px; }
  .bb-stat, .bb-status { border-radius: 14px; }
}
`;
  document.head.appendChild(style);
}

function createLevel(level) {
  const rows = Math.min(8, 4 + Math.floor((level - 1) / 2));
  const brickW = (WIDTH - BRICK_MARGIN * 2 - BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
  const bricks = [];

  for (let row = 0; row < rows; row++) {
    const y = BRICK_TOP + row * 28;
    const openChance = clamp(0.06 + level * 0.02 + row * 0.01, 0.08, 0.28);

    for (let col = 0; col < BRICK_COLS; col++) {
      if (Math.random() < openChance && !(level === 1 && row < 2 && col % 2 === 0)) continue;

      const x = BRICK_MARGIN + col * (brickW + BRICK_GAP);
      const strongChance = clamp((level - 1) * 0.08 + row * 0.015, 0, 0.45);
      const hp = Math.random() < strongChance ? 2 : 1;
      const power = Math.random() < 0.12 ? pick(['wide', 'slow']) : null;
      const palette = BRICK_PALETTE[(row + col + level) % BRICK_PALETTE.length];

      bricks.push({
        x,
        y,
        w: brickW,
        h: 20,
        hp,
        maxHp: hp,
        power,
        fill: palette[0],
        glow: palette[1],
      });
    }
  }

  return bricks;
}

function makeFreshState(best) {
  return {
    status: 'menu',
    score: 0,
    best,
    level: 1,
    lives: 3,
    paddleX: WIDTH / 2,
    paddleWidth: 84,
    ball: null,
    bricks: [],
    drops: [],
    effects: { wide: 0, slow: 0 },
    message: 'Drag the paddle or use arrows. Tap the stage or Launch to serve.',
  };
}

const BrickBreaker = {
  _el: null,
  _storage: null,
  _state: null,
  _ctx: null,
  _canvas: null,
  _overlay: null,
  _statusEl: null,
  _powersEl: null,
  _stats: null,
  _launchBtn: null,
  _raf: 0,
  _lastTs: 0,
  _pointerActive: false,
  _pointerX: WIDTH / 2,
  _keys: { left: false, right: false },
  _onResize: null,
  _onKeyDown: null,
  _onKeyUp: null,

  async init(container, storage) {
    injectCSS();
    this._storage = storage;
    const best = Number(storage.get('best') || 0);
    this._state = makeFreshState(best);

    this._el = document.createElement('div');
    this._el.className = 'bb';
    this._el.innerHTML = `
      <div class="bb-head">
        <div>
          <div class="bb-kicker">Arcade Classic</div>
          <div class="bb-title">Brick Breaker</div>
          <div class="bb-sub">Break the wall, catch the drops, and keep the ball alive through endless levels.</div>
        </div>
        <button class="bb-launch" data-action="launch">Launch</button>
      </div>
      <div class="bb-stats">
        <div class="bb-stat"><div class="bb-label">Score</div><div class="bb-stat-value" data-stat="score">0</div></div>
        <div class="bb-stat"><div class="bb-label">Best</div><div class="bb-stat-value" data-stat="best">${best}</div></div>
        <div class="bb-stat"><div class="bb-label">Lives</div><div class="bb-stat-value" data-stat="lives">3</div></div>
        <div class="bb-stat"><div class="bb-label">Level</div><div class="bb-stat-value" data-stat="level">1</div></div>
      </div>
      <div class="bb-stage-wrap">
        <div class="bb-frame">
          <canvas class="bb-canvas"></canvas>
          <div class="bb-overlay"></div>
        </div>
      </div>
      <div class="bb-foot">
        <div class="bb-status"></div>
        <div class="bb-powers"></div>
      </div>`;
    container.appendChild(this._el);

    this._canvas = this._el.querySelector('.bb-canvas');
    this._ctx = this._canvas.getContext('2d');
    this._overlay = this._el.querySelector('.bb-overlay');
    this._statusEl = this._el.querySelector('.bb-status');
    this._powersEl = this._el.querySelector('.bb-powers');
    this._launchBtn = this._el.querySelector('[data-action="launch"]');
    this._stats = {
      score: this._el.querySelector('[data-stat="score"]'),
      best: this._el.querySelector('[data-stat="best"]'),
      lives: this._el.querySelector('[data-stat="lives"]'),
      level: this._el.querySelector('[data-stat="level"]'),
    };

    this._bindEvents();
    this._resizeCanvas();
    this._showMenu();
    this._draw();
  },

  destroy() {
    this._stopLoop();
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown);
    if (this._onKeyUp) window.removeEventListener('keyup', this._onKeyUp);
    this._el?.remove();
    this._el = null;
  },

  pause() {
    this._stopLoop();
  },

  resume() {
    if (this._state?.status === 'ready' || this._state?.status === 'playing') this._startLoop();
  },

  _bindEvents() {
    this._launchBtn.addEventListener('click', () => this._launchBall());

    const pointerMove = event => {
      const rect = this._canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
      this._pointerX = clamp(x, 0, WIDTH);
    };

    this._canvas.addEventListener('pointerdown', event => {
      this._pointerActive = true;
      pointerMove(event);
      this._launchBall();
    });
    this._canvas.addEventListener('pointermove', event => {
      if (!this._pointerActive) return;
      pointerMove(event);
    });

    const endPointer = () => { this._pointerActive = false; };
    this._canvas.addEventListener('pointerup', endPointer);
    this._canvas.addEventListener('pointercancel', endPointer);
    this._canvas.addEventListener('pointerleave', endPointer);

    this._onResize = () => this._resizeCanvas();
    this._onKeyDown = event => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        this._keys.left = true;
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        this._keys.right = true;
      } else if (key === ' ' || key === 'enter') {
        event.preventDefault();
        this._launchBall();
      } else if (key === 'r' && this._state?.status !== 'menu') {
        event.preventDefault();
        this._startRun();
      }
    };
    this._onKeyUp = event => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') this._keys.left = false;
      if (key === 'arrowright' || key === 'd') this._keys.right = false;
    };

    window.addEventListener('resize', this._onResize);
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  },

  _resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this._canvas.width = Math.floor(WIDTH * dpr);
    this._canvas.height = Math.floor(HEIGHT * dpr);
    this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._draw();
  },

  _showMenu() {
    this._state.status = 'menu';
    this._overlay.classList.add('show');
    this._overlay.innerHTML = `
      <div class="bb-overlay-card">
        <div class="bb-kicker">Start Game</div>
        <div class="bb-overlay-title">Brick Breaker</div>
        <div class="bb-overlay-copy">
          Drag the paddle, keep the ball in play, and clear every brick.
          Blue drops widen the paddle. Gold drops slow the ball for a few seconds.
        </div>
        <button class="bb-overlay-btn" data-action="start">Play</button>
      </div>`;
    this._overlay.querySelector('[data-action="start"]').addEventListener('click', () => this._startRun());
    this._updateHud();
  },

  _startRun() {
    const best = this._state.best;
    this._state = makeFreshState(best);
    this._state.status = 'ready';
    this._state.bricks = createLevel(1);
    this._state.ball = this._makeBall(true);
    this._overlay.classList.remove('show');
    this._lastTs = 0;
    this._updateHud();
    this._startLoop();
    this._draw();
  },

  _makeBall(stuck) {
    return {
      x: this._state ? this._state.paddleX : WIDTH / 2,
      y: PADDLE_Y - BALL_RADIUS - 2,
      vx: 0,
      vy: 0,
      stuck,
    };
  },

  _ballSpeed() {
    const base = 310 + (this._state.level - 1) * 18;
    return this._state.effects.slow > 0 ? base * 0.76 : base;
  },

  _launchBall() {
    if (!this._state || this._state.status === 'menu' || this._state.status === 'gameover') return;
    const ball = this._state.ball;
    if (!ball?.stuck) return;
    const rel = clamp((this._pointerX - this._state.paddleX) / (this._state.paddleWidth / 2 || 1), -1, 1);
    const speed = this._ballSpeed();
    ball.stuck = false;
    ball.vx = speed * rel * 0.9;
    ball.vy = -Math.sqrt(Math.max(speed * speed - ball.vx * ball.vx, speed * speed * 0.42));
    this._state.status = 'playing';
    this._state.message = 'Ball live.';
    this._updateHud();
  },

  _startLoop() {
    this._stopLoop();
    this._raf = requestAnimationFrame(ts => this._tick(ts));
  },

  _stopLoop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  },

  _tick(ts) {
    if (!this._lastTs) this._lastTs = ts;
    const dt = Math.min(0.032, (ts - this._lastTs) / 1000);
    this._lastTs = ts;
    this._update(dt);
    this._draw();
    if (this._state.status === 'ready' || this._state.status === 'playing') {
      this._raf = requestAnimationFrame(next => this._tick(next));
    } else {
      this._raf = 0;
    }
  },

  _update(dt) {
    const state = this._state;
    const moveDir = (this._keys.right ? 1 : 0) - (this._keys.left ? 1 : 0);
    const paddleSpeed = 390;

    if (moveDir) {
      state.paddleX += moveDir * paddleSpeed * dt;
    } else if (this._pointerActive) {
      state.paddleX += (this._pointerX - state.paddleX) * Math.min(1, dt * 16);
    }

    state.paddleWidth = state.effects.wide > 0 ? 116 : 84;
    state.paddleX = clamp(state.paddleX, state.paddleWidth / 2 + 10, WIDTH - state.paddleWidth / 2 - 10);
    state.effects.wide = Math.max(0, state.effects.wide - dt);
    state.effects.slow = Math.max(0, state.effects.slow - dt);

    if (state.ball.stuck) {
      state.ball.x = state.paddleX;
      state.ball.y = PADDLE_Y - BALL_RADIUS - 2;
    } else {
      this._updateBall(dt);
    }

    this._updateDrops(dt);
    this._updateHud();
  },

  _updateBall(dt) {
    const state = this._state;
    const ball = state.ball;
    const steps = Math.max(2, Math.ceil((Math.abs(ball.vx) + Math.abs(ball.vy)) * dt / 120));
    const stepDt = dt / steps;

    for (let i = 0; i < steps; i++) {
      ball.x += ball.vx * stepDt;
      ball.y += ball.vy * stepDt;

      if (ball.x <= BALL_RADIUS) {
        ball.x = BALL_RADIUS;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x >= WIDTH - BALL_RADIUS) {
        ball.x = WIDTH - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx);
      }

      if (ball.y <= BALL_RADIUS) {
        ball.y = BALL_RADIUS;
        ball.vy = Math.abs(ball.vy);
      }

      const paddleLeft = state.paddleX - state.paddleWidth / 2;
      const paddleRight = state.paddleX + state.paddleWidth / 2;
      if (
        ball.vy > 0 &&
        ball.y + BALL_RADIUS >= PADDLE_Y &&
        ball.y - BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
        ball.x >= paddleLeft - BALL_RADIUS &&
        ball.x <= paddleRight + BALL_RADIUS
      ) {
        const rel = clamp((ball.x - state.paddleX) / (state.paddleWidth / 2), -1, 1);
        const angle = rel * 1.12;
        const speed = this._ballSpeed();
        ball.x = clamp(ball.x, paddleLeft + BALL_RADIUS, paddleRight - BALL_RADIUS);
        ball.y = PADDLE_Y - BALL_RADIUS - 1;
        ball.vx = speed * Math.sin(angle);
        ball.vy = -Math.abs(speed * Math.cos(angle));
      }

      let hitBrick = null;
      for (const brick of state.bricks) {
        const nearestX = clamp(ball.x, brick.x, brick.x + brick.w);
        const nearestY = clamp(ball.y, brick.y, brick.y + brick.h);
        const dx = ball.x - nearestX;
        const dy = ball.y - nearestY;
        if (dx * dx + dy * dy > BALL_RADIUS * BALL_RADIUS) continue;
        hitBrick = brick;

        if (Math.abs(dx) > Math.abs(dy)) {
          ball.vx *= -1;
          ball.x += Math.sign(dx || ball.vx) * 2;
        } else {
          ball.vy *= -1;
          ball.y += Math.sign(dy || ball.vy) * 2;
        }
        break;
      }

      if (hitBrick) {
        hitBrick.hp -= 1;
        state.score += hitBrick.maxHp === 2 ? 24 : 14;
        if (hitBrick.hp <= 0) {
          state.score += 8;
          if (hitBrick.power) {
            state.drops.push({
              type: hitBrick.power,
              x: hitBrick.x + hitBrick.w / 2,
              y: hitBrick.y + hitBrick.h / 2,
              vy: 124,
            });
          }
          state.bricks = state.bricks.filter(brick => brick !== hitBrick);
          state.message = 'Brick smashed.';
        } else {
          state.message = 'Solid brick cracked.';
        }

        if (!state.bricks.length) {
          this._advanceLevel();
          return;
        }
      }

      if (ball.y - BALL_RADIUS > HEIGHT) {
        this._loseLife();
        return;
      }
    }
  },

  _updateDrops(dt) {
    const state = this._state;
    if (!state.drops.length) return;

    const paddleLeft = state.paddleX - state.paddleWidth / 2;
    const paddleRight = state.paddleX + state.paddleWidth / 2;

    state.drops = state.drops.filter(drop => {
      drop.y += drop.vy * dt;
      if (
        drop.y >= PADDLE_Y - 6 &&
        drop.y <= PADDLE_Y + PADDLE_HEIGHT + 6 &&
        drop.x >= paddleLeft - 8 &&
        drop.x <= paddleRight + 8
      ) {
        this._applyPower(drop.type);
        return false;
      }
      return drop.y < HEIGHT + 16;
    });
  },

  _applyPower(type) {
    const state = this._state;
    if (type === 'wide') {
      state.effects.wide = Math.max(state.effects.wide, 12);
      state.message = 'Wide paddle online.';
    } else if (type === 'slow') {
      state.effects.slow = Math.max(state.effects.slow, 10);
      const speed = this._ballSpeed();
      const mag = Math.hypot(state.ball.vx, state.ball.vy) || 1;
      state.ball.vx = (state.ball.vx / mag) * speed;
      state.ball.vy = (state.ball.vy / mag) * speed;
      state.message = 'Ball slowed down.';
    }
  },

  _advanceLevel() {
    this._state.level += 1;
    this._state.bricks = createLevel(this._state.level);
    this._state.drops = [];
    this._state.effects = { wide: 0, slow: 0 };
    this._state.ball = this._makeBall(true);
    this._state.status = 'ready';
    this._state.score += 120;
    this._state.message = `Level ${this._state.level}. Serve when ready.`;
    this._updateBest();
  },

  _loseLife() {
    this._state.lives -= 1;
    this._state.drops = [];
    this._state.effects = { wide: 0, slow: 0 };

    if (this._state.lives <= 0) {
      this._updateBest();
      this._state.status = 'gameover';
      this._state.message = 'Run over.';
      this._overlay.classList.add('show');
      this._overlay.innerHTML = `
        <div class="bb-overlay-card">
          <div class="bb-kicker">Game Over</div>
          <div class="bb-overlay-title">Wall Down</div>
          <div class="bb-overlay-copy">
            You reached level ${this._state.level} with ${fmt(this._state.score)} points.
            Play again and push the combo deeper.
          </div>
          <button class="bb-overlay-btn" data-action="restart">Restart</button>
        </div>`;
      this._overlay.querySelector('[data-action="restart"]').addEventListener('click', () => this._startRun());
      return;
    }

    this._state.ball = this._makeBall(true);
    this._state.status = 'ready';
    this._state.message = `Life lost. ${this._state.lives} left.`;
  },

  _updateBest() {
    if (this._state.score <= this._state.best) return;
    this._state.best = this._state.score;
    this._storage.set('best', this._state.best);
  },

  _updateHud() {
    this._updateBest();
    this._stats.score.textContent = fmt(this._state.score);
    this._stats.best.textContent = fmt(this._state.best);
    this._stats.lives.textContent = String(this._state.lives);
    this._stats.level.textContent = String(this._state.level);
    this._statusEl.textContent = this._state.message;

    const powers = [];
    if (this._state.effects.wide > 0) powers.push(`<div class="bb-power" style="background:${POWER_COLORS.wide}">Wide ${Math.ceil(this._state.effects.wide)}s</div>`);
    if (this._state.effects.slow > 0) powers.push(`<div class="bb-power" style="background:${POWER_COLORS.slow}">Slow ${Math.ceil(this._state.effects.slow)}s</div>`);
    this._powersEl.innerHTML = powers.join('');

    if (this._state.status === 'ready') {
      this._launchBtn.textContent = 'Launch';
      this._launchBtn.disabled = false;
    } else if (this._state.status === 'playing') {
      this._launchBtn.textContent = 'Live';
      this._launchBtn.disabled = true;
    } else {
      this._launchBtn.textContent = 'Start';
      this._launchBtn.disabled = this._state.status === 'menu' || this._state.status === 'gameover';
    }
  },

  _draw() {
    const ctx = this._ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#07101D');
    grad.addColorStop(0.5, '#0B1324');
    grad.addColorStop(1, '#111827');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = i % 4 === 0 ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.05)';
      ctx.fillRect(0, i * 24, WIDTH, 1);
    }

    ctx.save();
    ctx.shadowColor = 'rgba(56,189,248,.22)';
    ctx.shadowBlur = 18;
    for (const brick of this._state.bricks) {
      ctx.fillStyle = brick.fill;
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      ctx.fillStyle = 'rgba(255,255,255,.16)';
      ctx.fillRect(brick.x, brick.y, brick.w, 3);
      ctx.strokeStyle = brick.glow;
      ctx.lineWidth = brick.hp === 2 ? 2 : 1;
      ctx.strokeRect(brick.x + .5, brick.y + .5, brick.w - 1, brick.h - 1);
    }
    ctx.restore();

    for (const drop of this._state.drops) {
      ctx.fillStyle = POWER_COLORS[drop.type];
      ctx.beginPath();
      ctx.roundRect(drop.x - 12, drop.y - 8, 24, 16, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(drop.type === 'wide' ? 'W' : 'S', drop.x, drop.y + 3);
    }

    const paddleLeft = this._state.paddleX - this._state.paddleWidth / 2;
    const paddleGrad = ctx.createLinearGradient(paddleLeft, PADDLE_Y, paddleLeft, PADDLE_Y + PADDLE_HEIGHT);
    paddleGrad.addColorStop(0, '#F8FAFC');
    paddleGrad.addColorStop(1, '#CBD5E1');
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.roundRect(paddleLeft, PADDLE_Y, this._state.paddleWidth, PADDLE_HEIGHT, 7);
    ctx.fill();

    const ball = this._state.ball;
    if (ball) {
      ctx.save();
      ctx.shadowColor = this._state.effects.slow > 0 ? 'rgba(245,158,11,.36)' : 'rgba(59,130,246,.36)';
      ctx.shadowBlur = 18;
      const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_RADIUS + 2);
      ballGrad.addColorStop(0, '#FFFFFF');
      ballGrad.addColorStop(0.45, this._state.effects.slow > 0 ? '#FDE68A' : '#BFDBFE');
      ballGrad.addColorStop(1, this._state.effects.slow > 0 ? '#F59E0B' : '#2563EB');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
};

export default BrickBreaker;
