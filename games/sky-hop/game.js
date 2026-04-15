const WIDTH = 360;
const HEIGHT = 620;
const PLAYER_W = 28;
const PLAYER_H = 34;
const GRAVITY = 1450;
const JUMP_VELOCITY = -560;
const SPRING_VELOCITY = -760;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return min + Math.random() * (max - min);
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
.sh {
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #F8FAFC;
  background:
    radial-gradient(circle at 15% 10%, rgba(34,197,94,.14), transparent 28%),
    radial-gradient(circle at 84% 12%, rgba(56,189,248,.18), transparent 32%),
    linear-gradient(180deg, #08101D 0%, #0A1526 40%, #10203A 100%);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.sh-head {
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

.sh-kicker,
.sh-label,
.sh-copy {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(226,232,240,.58);
}

.sh-title {
  margin-top: 4px;
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.sh-sub {
  margin-top: 6px;
  max-width: 25ch;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(226,232,240,.74);
}

.sh-start {
  border: none;
  border-radius: 16px;
  padding: 12px 14px;
  min-width: 82px;
  color: #052E16;
  background: linear-gradient(180deg, #86EFAC 0%, #22C55E 100%);
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 16px 28px rgba(34,197,94,.18);
}

.sh-start:active,
.sh-ctrl:active,
.sh-overlay-btn:active {
  transform: scale(.97);
}

.sh-stats {
  padding: 0 max(14px, env(safe-area-inset-right, 0px)) 0 max(14px, env(safe-area-inset-left, 0px));
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.sh-stat {
  padding: 10px 12px 12px;
  border-radius: 16px;
  background: rgba(15,23,42,.56);
  border: 1px solid rgba(148,163,184,.14);
  box-shadow: 0 12px 24px rgba(2,6,23,.18);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.sh-stat-value {
  margin-top: 6px;
  font-size: 22px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
  font-variant-numeric: tabular-nums;
}

.sh-stage-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
}

.sh-frame {
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

.sh-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  touch-action: none;
}

.sh-overlay {
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

.sh-overlay.show {
  display: flex;
}

.sh-overlay-card {
  width: 100%;
  padding: 22px 20px;
  border-radius: 22px;
  background: rgba(15,23,42,.86);
  border: 1px solid rgba(148,163,184,.16);
  box-shadow: 0 20px 40px rgba(2,6,23,.28);
}

.sh-overlay-title {
  margin-top: 10px;
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.sh-overlay-copy {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.55;
  color: rgba(226,232,240,.78);
}

.sh-overlay-btn {
  width: 100%;
  margin-top: 18px;
  border: none;
  border-radius: 16px;
  padding: 15px 18px;
  color: #052E16;
  background: linear-gradient(180deg, #86EFAC 0%, #22C55E 100%);
  font: inherit;
  font-size: 16px;
  font-weight: 800;
}

.sh-foot {
  padding:
    0 max(14px, env(safe-area-inset-right, 0px))
    calc(env(safe-area-inset-bottom, 0px) + 12px)
    max(14px, env(safe-area-inset-left, 0px));
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
}

.sh-status {
  padding: 11px 12px 13px;
  border-radius: 16px;
  background: rgba(15,23,42,.56);
  border: 1px solid rgba(148,163,184,.14);
  font-size: 13px;
  line-height: 1.45;
  color: rgba(226,232,240,.84);
}

.sh-controls {
  display: flex;
  gap: 8px;
}

.sh-ctrl {
  border: none;
  border-radius: 16px;
  padding: 14px 18px;
  min-width: 58px;
  color: #F8FAFC;
  background:
    linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.02)),
    rgba(15,23,42,.86);
  font: inherit;
  font-size: 20px;
  font-weight: 900;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.08),
    0 10px 18px rgba(2,6,23,.18);
}

@media (max-height: 780px) {
  .sh-title { font-size: 22px; }
  .sh-stats { gap: 6px; }
  .sh-stat, .sh-status { border-radius: 14px; }
}
`;
  document.head.appendChild(style);
}

function makeStars() {
  const stars = [];
  for (let i = 0; i < 28; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT * 4,
      r: rand(1, 2.4),
      alpha: rand(0.2, 0.8),
      speed: rand(0.08, 0.22),
    });
  }
  return stars;
}

function createPlatform(y, score) {
  const typeRoll = Math.random();
  let type = 'normal';
  if (score > 450 && typeRoll < 0.12) type = 'spring';
  else if (score > 220 && typeRoll < 0.28) type = 'moving';
  else if (score > 320 && typeRoll < 0.42) type = 'break';

  const w = type === 'spring'
    ? rand(58, 76)
    : type === 'moving'
      ? rand(64, 86)
      : rand(68, 94);

  return {
    x: rand(18, WIDTH - w - 18),
    y,
    w,
    h: 12,
    type,
    dir: Math.random() < 0.5 ? -1 : 1,
    speed: rand(26, 52),
    broken: false,
  };
}

function freshState(best) {
  const startPlatform = {
    x: WIDTH / 2 - 48,
    y: 560,
    w: 96,
    h: 14,
    type: 'start',
    dir: 1,
    speed: 0,
    broken: false,
  };

  return {
    status: 'menu',
    best,
    score: 0,
    player: {
      x: WIDTH / 2,
      y: startPlatform.y - 18,
      vx: 0,
      vy: 0,
      dir: 1,
    },
    cameraY: 0,
    highestY: startPlatform.y - 18,
    topSpawnY: startPlatform.y,
    platforms: [startPlatform],
    message: 'Hold left or right. Jump happens automatically on safe landings.',
  };
}

const SkyHop = {
  _el: null,
  _storage: null,
  _state: null,
  _best: 0,
  _canvas: null,
  _ctx: null,
  _overlay: null,
  _statusEl: null,
  _stats: null,
  _startBtn: null,
  _raf: 0,
  _lastTs: 0,
  _keys: { left: false, right: false },
  _stars: [],
  _onResize: null,
  _onKeyDown: null,
  _onKeyUp: null,

  async init(container, storage) {
    injectCSS();
    this._storage = storage;
    this._best = Number(storage.get('best') || 0);
    this._state = freshState(this._best);
    this._stars = makeStars();

    this._el = document.createElement('div');
    this._el.className = 'sh';
    this._el.innerHTML = `
      <div class="sh-head">
        <div>
          <div class="sh-kicker">Arcade Vertical</div>
          <div class="sh-title">Sky Hop</div>
          <div class="sh-sub">Climb forever, ride moving ledges, and avoid crumble traps on the way up.</div>
        </div>
        <button class="sh-start" data-action="start">Start</button>
      </div>
      <div class="sh-stats">
        <div class="sh-stat"><div class="sh-label">Score</div><div class="sh-stat-value" data-stat="score">0</div></div>
        <div class="sh-stat"><div class="sh-label">Best</div><div class="sh-stat-value" data-stat="best">${this._best}</div></div>
        <div class="sh-stat"><div class="sh-label">Peak</div><div class="sh-stat-value" data-stat="peak">0</div></div>
      </div>
      <div class="sh-stage-wrap">
        <div class="sh-frame">
          <canvas class="sh-canvas"></canvas>
          <div class="sh-overlay"></div>
        </div>
      </div>
      <div class="sh-foot">
        <div class="sh-status"></div>
        <div class="sh-controls">
          <button class="sh-ctrl" data-dir="left">◀</button>
          <button class="sh-ctrl" data-dir="right">▶</button>
        </div>
      </div>`;
    container.appendChild(this._el);

    this._canvas = this._el.querySelector('.sh-canvas');
    this._ctx = this._canvas.getContext('2d');
    this._overlay = this._el.querySelector('.sh-overlay');
    this._statusEl = this._el.querySelector('.sh-status');
    this._startBtn = this._el.querySelector('[data-action="start"]');
    this._stats = {
      score: this._el.querySelector('[data-stat="score"]'),
      best: this._el.querySelector('[data-stat="best"]'),
      peak: this._el.querySelector('[data-stat="peak"]'),
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
    if (this._state?.status === 'playing') this._startLoop();
  },

  _bindEvents() {
    this._startBtn.addEventListener('click', () => this._startRun());

    const setHold = (dir, on) => {
      this._keys[dir] = on;
    };

    this._el.querySelectorAll('.sh-ctrl').forEach(button => {
      const dir = button.dataset.dir;
      button.addEventListener('pointerdown', () => setHold(dir, true));
      button.addEventListener('pointerup', () => setHold(dir, false));
      button.addEventListener('pointercancel', () => setHold(dir, false));
      button.addEventListener('pointerleave', () => setHold(dir, false));
    });

    this._canvas.addEventListener('pointerdown', event => {
      const rect = this._canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      this._keys.left = x < 0.46;
      this._keys.right = x > 0.54;
    });
    this._canvas.addEventListener('pointermove', event => {
      if (!(event.buttons & 1)) return;
      const rect = this._canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      this._keys.left = x < 0.46;
      this._keys.right = x > 0.54;
    });
    const clearPointer = () => {
      this._keys.left = false;
      this._keys.right = false;
    };
    this._canvas.addEventListener('pointerup', clearPointer);
    this._canvas.addEventListener('pointercancel', clearPointer);
    this._canvas.addEventListener('pointerleave', clearPointer);

    this._onResize = () => this._resizeCanvas();
    this._onKeyDown = event => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        this._keys.left = true;
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        this._keys.right = true;
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
      <div class="sh-overlay-card">
        <div class="sh-kicker">Start Game</div>
        <div class="sh-overlay-title">Sky Hop</div>
        <div class="sh-overlay-copy">
          Ride normal ledges, chase springs for huge boosts, and watch for crumble platforms.
          Wraparound movement stays on, so use the screen edges to save bad routes.
        </div>
        <button class="sh-overlay-btn" data-action="start">Play</button>
      </div>`;
    this._overlay.querySelector('[data-action="start"]').addEventListener('click', () => this._startRun());
    this._updateHud();
  },

  _startRun() {
    this._state = freshState(this._best);
    this._state.status = 'playing';
    while (this._state.platforms.length < 20) this._spawnNextPlatform();
    this._overlay.classList.remove('show');
    this._lastTs = 0;
    this._updateHud();
    this._startLoop();
    this._draw();
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
    if (this._state.status === 'playing') {
      this._raf = requestAnimationFrame(next => this._tick(next));
    } else {
      this._raf = 0;
    }
  },

  _update(dt) {
    const state = this._state;
    const player = state.player;
    const input = (this._keys.right ? 1 : 0) - (this._keys.left ? 1 : 0);

    if (input) {
      player.vx = input * 220;
      player.dir = input;
    } else {
      player.vx *= 0.88;
      if (Math.abs(player.vx) < 5) player.vx = 0;
    }

    const prevY = player.y;
    player.vy += GRAVITY * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    if (player.x < -PLAYER_W / 2) player.x = WIDTH + PLAYER_W / 2;
    if (player.x > WIDTH + PLAYER_W / 2) player.x = -PLAYER_W / 2;

    for (const platform of state.platforms) {
      if (platform.type === 'moving' && !platform.broken) {
        platform.x += platform.dir * platform.speed * dt;
        if (platform.x <= 14 || platform.x + platform.w >= WIDTH - 14) {
          platform.dir *= -1;
          platform.x = clamp(platform.x, 14, WIDTH - platform.w - 14);
        }
      }
    }

    if (player.vy > 0) this._checkLanding(prevY);

    if (player.y < state.highestY) state.highestY = player.y;
    state.score = Math.max(0, Math.floor((542 - state.highestY) / 10));
    if (state.score > state.best) {
      state.best = state.score;
      this._best = state.best;
      this._storage.set('best', this._best);
    }

    if (player.y < state.cameraY + 220) state.cameraY = player.y - 220;

    this._cullPlatforms();
    while (state.topSpawnY > state.cameraY - HEIGHT * 1.6) this._spawnNextPlatform();

    if (player.y > state.cameraY + HEIGHT + 120) {
      this._state.status = 'gameover';
      this._state.message = 'Missed the landing.';
      this._overlay.classList.add('show');
      this._overlay.innerHTML = `
        <div class="sh-overlay-card">
          <div class="sh-kicker">Run Ended</div>
          <div class="sh-overlay-title">Long Way Down</div>
          <div class="sh-overlay-copy">
            You reached ${fmt(this._state.score)} points before dropping out of view.
            Keep chaining safe landings and springs for a cleaner climb.
          </div>
          <button class="sh-overlay-btn" data-action="restart">Restart</button>
        </div>`;
      this._overlay.querySelector('[data-action="restart"]').addEventListener('click', () => this._startRun());
    }

    this._updateHud();
  },

  _checkLanding(prevY) {
    const state = this._state;
    const player = state.player;
    const footPrev = prevY + PLAYER_H / 2;
    const footNow = player.y + PLAYER_H / 2;

    for (const platform of state.platforms) {
      if (platform.broken) continue;
      if (platform.y < state.cameraY - 40 || platform.y > state.cameraY + HEIGHT + 40) continue;

      const top = platform.y;
      const left = platform.x;
      const right = platform.x + platform.w;
      const playerLeft = player.x - PLAYER_W / 2 + 4;
      const playerRight = player.x + PLAYER_W / 2 - 4;

      if (footPrev > top || footNow < top) continue;
      if (playerRight < left || playerLeft > right) continue;

      if (platform.type === 'break') {
        platform.broken = true;
        state.message = 'Cracked platform.';
        return;
      }

      player.y = top - PLAYER_H / 2;
      player.vy = platform.type === 'spring' ? SPRING_VELOCITY : JUMP_VELOCITY;
      state.message = platform.type === 'spring' ? 'Spring boost.' : platform.type === 'moving' ? 'Moving ledge caught.' : 'Clean landing.';
      return;
    }
  },

  _spawnNextPlatform() {
    const state = this._state;
    const baseGap = state.score < 150 ? rand(56, 76) : state.score < 420 ? rand(64, 86) : rand(70, 92);
    state.topSpawnY -= baseGap;
    state.platforms.push(createPlatform(state.topSpawnY, state.score));
  },

  _cullPlatforms() {
    const floor = this._state.cameraY + HEIGHT + 100;
    this._state.platforms = this._state.platforms.filter(platform => platform.y < floor);
  },

  _updateHud() {
    this._stats.score.textContent = fmt(this._state.score);
    this._stats.best.textContent = fmt(this._state.best);
    this._stats.peak.textContent = fmt(Math.max(0, Math.floor((542 - this._state.cameraY) / 10)));
    this._statusEl.textContent = this._state.message;
    this._startBtn.disabled = this._state.status === 'playing';
    this._startBtn.textContent = this._state.status === 'playing' ? 'Live' : 'Start';
  },

  _draw() {
    const ctx = this._ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, '#08101D');
    sky.addColorStop(0.45, '#0E1A32');
    sky.addColorStop(1, '#1D4ED8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    for (const star of this._stars) {
      const y = ((star.y - this._state.cameraY * star.speed) % (HEIGHT + 120) + (HEIGHT + 120)) % (HEIGHT + 120) - 60;
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 7; i++) {
      ctx.strokeStyle = 'rgba(255,255,255,.05)';
      ctx.beginPath();
      ctx.moveTo(0, i * 88 + ((this._state.cameraY * 0.15) % 88),);
      ctx.lineTo(WIDTH, i * 88 + ((this._state.cameraY * 0.15) % 88));
      ctx.stroke();
    }

    for (const platform of this._state.platforms) {
      const drawY = platform.y - this._state.cameraY;
      if (drawY < -30 || drawY > HEIGHT + 40) continue;
      if (platform.broken) continue;

      if (platform.type === 'moving') {
        ctx.fillStyle = '#F59E0B';
      } else if (platform.type === 'break') {
        ctx.fillStyle = '#FB7185';
      } else if (platform.type === 'spring') {
        ctx.fillStyle = '#A3E635';
      } else {
        ctx.fillStyle = '#38BDF8';
      }

      ctx.beginPath();
      ctx.roundRect(platform.x, drawY, platform.w, platform.h, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(platform.x, drawY, platform.w, 3);

      if (platform.type === 'spring') {
        ctx.strokeStyle = '#365314';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const baseX = platform.x + platform.w / 2 - 11;
        ctx.moveTo(baseX, drawY + platform.h);
        ctx.lineTo(baseX + 5, drawY + 4);
        ctx.lineTo(baseX + 10, drawY + platform.h);
        ctx.lineTo(baseX + 15, drawY + 4);
        ctx.lineTo(baseX + 20, drawY + platform.h);
        ctx.stroke();
      }
    }

    const playerX = this._state.player.x;
    const playerY = this._state.player.y - this._state.cameraY;
    ctx.save();
    ctx.translate(playerX, playerY);
    ctx.scale(this._state.player.dir || 1, 1);
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.roundRect(-PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, PLAYER_H, 10);
    ctx.fill();
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-8, -6, 5, 5);
    ctx.fillRect(3, -6, 5, 5);
    ctx.fillStyle = '#22C55E';
    ctx.fillRect(-10, 8, 20, 6);
    ctx.restore();
  },
};

export default SkyHop;
