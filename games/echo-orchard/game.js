const COLS = 7;
const ROWS = 8;
const LOOP_LEN = 4;
const MAX_ECHOES = 4;
const ROT_LIMIT = 9;
const MOLD_LIMIT = 18;
const START_INDEX = indexOf(3, 4);

const DIRS = {
  up: { dx: 0, dy: -1, label: '^', name: 'Up' },
  right: { dx: 1, dy: 0, label: '>', name: 'Right' },
  down: { dx: 0, dy: 1, label: 'v', name: 'Down' },
  left: { dx: -1, dy: 0, label: '<', name: 'Left' },
};

const DIR_ORDER = ['up', 'right', 'down', 'left'];

const ROCK_LAYOUTS = [
  [[1, 1], [5, 1], [2, 4], [4, 4]],
  [[2, 1], [4, 1], [1, 5], [5, 5]],
  [[1, 2], [5, 2], [2, 5], [4, 5]],
  [[1, 1], [5, 1], [1, 6], [5, 6]],
].map(layout => layout.map(([x, y]) => indexOf(x, y)));

const MOLD_LAYOUTS = [
  [[0, 0], [6, 7]],
  [[6, 0], [0, 7]],
  [[0, 0], [0, 7]],
  [[6, 0], [6, 7]],
].map(layout => layout.map(([x, y]) => indexOf(x, y)));

function indexOf(x, y) {
  return y * COLS + x;
}

function coordOf(index) {
  return { x: index % COLS, y: Math.floor(index / COLS) };
}

function sample(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  const next = list.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
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
.eo {
  --cell: 44px;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  color: #eefbf1;
  background:
    radial-gradient(circle at 18% 8%, rgba(245, 158, 11, .18), transparent 30%),
    radial-gradient(circle at 82% 14%, rgba(74, 222, 128, .20), transparent 32%),
    linear-gradient(180deg, #07130d 0%, #0d1f17 46%, #13261b 100%);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  user-select: none;
  -webkit-user-select: none;
}

.eo-shell,
.eo-menu,
.eo-finish {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.eo-shell {
  padding:
    calc(env(safe-area-inset-top, 18px) + 10px)
    max(14px, calc(env(safe-area-inset-right, 0px) + 50px))
    calc(env(safe-area-inset-bottom, 0px) + 12px)
    max(14px, env(safe-area-inset-left, 0px));
  gap: 10px;
}

.eo-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.eo-head {
  min-width: 0;
}

.eo-kicker,
.eo-mini-label,
.eo-tip-label,
.eo-echo-label,
.eo-card-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(222, 247, 228, .58);
}

.eo-title {
  margin-top: 4px;
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.eo-sub {
  margin-top: 6px;
  max-width: 25ch;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(228, 244, 233, .72);
}

.eo-score {
  min-width: 92px;
  padding: 10px 12px 12px;
  border-radius: 18px;
  background: rgba(10, 28, 18, .72);
  border: 1px solid rgba(189, 240, 200, .12);
  box-shadow: 0 18px 36px rgba(1, 7, 4, .26);
  text-align: right;
}

.eo-score-value,
.eo-card-value {
  margin-top: 6px;
  font-size: 26px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
  font-variant-numeric: tabular-nums;
}

.eo-panels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.eo-card,
.eo-loop-panel,
.eo-tip,
.eo-menu-card,
.eo-finish-card {
  border-radius: 18px;
  background: rgba(8, 22, 15, .66);
  border: 1px solid rgba(194, 240, 203, .10);
  box-shadow: 0 16px 32px rgba(1, 8, 5, .20);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.eo-card {
  padding: 10px 12px 12px;
}

.eo-card-value {
  font-size: 22px;
}

.eo-loop-panel {
  padding: 12px;
}

.eo-loop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.eo-loop-note {
  font-size: 12px;
  color: rgba(228, 244, 233, .72);
}

.eo-loop-track {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.eo-step {
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 900;
  color: rgba(236, 253, 243, .74);
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .05);
}

.eo-step.empty {
  color: rgba(236, 253, 243, .24);
}

.eo-step.live {
  color: #fef3c7;
  background: linear-gradient(180deg, rgba(251, 191, 36, .20), rgba(251, 191, 36, .08));
  border-color: rgba(251, 191, 36, .20);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .10);
}

.eo-echo-strip {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.eo-echo-strip::-webkit-scrollbar {
  display: none;
}

.eo-echo-card {
  flex: 0 0 auto;
  min-width: 88px;
  padding: 10px 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .06);
}

.eo-echo-card.oldest {
  opacity: .56;
}

.eo-echo-route {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.eo-echo-step {
  height: 28px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  background: rgba(143, 240, 164, .10);
  color: #d9ffe2;
}

.eo-echo-step.live {
  background: rgba(251, 191, 36, .18);
  color: #fde68a;
}

.eo-board-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eo-board {
  position: relative;
  display: grid;
  grid-template-columns: repeat(${COLS}, var(--cell));
  gap: 6px;
  padding: 8px;
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(25, 52, 35, .82), rgba(14, 29, 20, .92)),
    rgba(7, 17, 12, .82);
  border: 1px solid rgba(208, 250, 216, .10);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .05),
    0 24px 48px rgba(0, 0, 0, .28);
  touch-action: none;
}

.eo-cell {
  position: relative;
  width: var(--cell);
  height: var(--cell);
  border: none;
  border-radius: 15px;
  padding: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .05), rgba(255, 255, 255, 0)),
    rgba(25, 54, 33, .72);
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .05),
    inset 0 -10px 18px rgba(0, 0, 0, .14);
}

.eo-cell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, .08), transparent 48%);
  pointer-events: none;
}

.eo-cell.tap {
  cursor: pointer;
}

.eo-cell.tap:active {
  transform: scale(.96);
}

.eo-rock {
  position: absolute;
  inset: 6px;
  border-radius: 12px;
  background:
    linear-gradient(145deg, rgba(146, 152, 161, .92), rgba(78, 84, 92, .96));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .24),
    inset 0 -8px 12px rgba(0, 0, 0, .18);
}

.eo-rock::after {
  content: '';
  position: absolute;
  inset: 10px 14px auto 10px;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .18);
}

.eo-mold {
  position: absolute;
  inset: 4px;
  border-radius: 13px;
  background:
    radial-gradient(circle at 30% 30%, rgba(74, 222, 128, .26), transparent 36%),
    linear-gradient(180deg, rgba(7, 54, 22, .98), rgba(1, 22, 8, .96));
  box-shadow: inset 0 0 0 1px rgba(110, 231, 183, .10);
}

.eo-mold::before,
.eo-mold::after {
  content: '';
  position: absolute;
  background: rgba(187, 247, 208, .12);
  border-radius: 999px;
}

.eo-mold::before {
  inset: 10px 16px auto 8px;
  height: 4px;
  transform: rotate(-18deg);
}

.eo-mold::after {
  inset: auto 10px 9px 14px;
  height: 4px;
  transform: rotate(21deg);
}

.eo-fruit {
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, .28),
    0 0 18px rgba(74, 222, 128, .18);
}

.eo-fruit.normal {
  background: radial-gradient(circle at 34% 30%, #dcfce7 0%, #86efac 30%, #16a34a 74%, #14532d 100%);
}

.eo-fruit.sun {
  background: radial-gradient(circle at 40% 32%, #fff7d6 0%, #fde68a 28%, #f59e0b 72%, #92400e 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, .34),
    0 0 18px rgba(251, 191, 36, .34);
}

.eo-fruit.sun::before,
.eo-fruit.sun::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid rgba(251, 191, 36, .26);
}

.eo-fruit.sun::after {
  inset: -10px;
  opacity: .42;
}

.eo-ttl {
  position: absolute;
  right: 3px;
  bottom: 3px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: #08110c;
  background: rgba(236, 253, 245, .88);
}

.eo-echo-stack {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.eo-echo-unit {
  position: absolute;
  width: 52%;
  height: 52%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 30%, rgba(255, 255, 255, .62), rgba(191, 219, 254, .32) 42%, rgba(59, 130, 246, .18) 75%, transparent 76%);
  box-shadow: 0 0 18px rgba(59, 130, 246, .18);
  border: 1px solid rgba(191, 219, 254, .14);
}

.eo-echo-unit.offset-a { transform: translate(-7px, -5px) scale(.92); }
.eo-echo-unit.offset-b { transform: translate(7px, -2px) scale(.82); }
.eo-echo-unit.offset-c { transform: translate(0, 7px) scale(.76); }

.eo-player {
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, #fff7d6 0%, #fde68a 24%, #86efac 52%, #0f766e 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, .32),
    0 0 18px rgba(74, 222, 128, .36);
}

.eo-player::after {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid rgba(74, 222, 128, .24);
}

.eo-tip {
  padding: 11px 12px 13px;
}

.eo-tip-text {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(228, 244, 233, .82);
}

.eo-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.eo-legend {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(228, 244, 233, .66);
}

.eo-dpad {
  display: grid;
  grid-template-columns: repeat(3, 54px);
  grid-template-rows: repeat(3, 54px);
  gap: 6px;
}

.eo-dir-btn {
  border: none;
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .02)),
    rgba(10, 31, 18, .84);
  color: #ecfdf3;
  font: inherit;
  font-size: 23px;
  font-weight: 900;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .08),
    0 10px 18px rgba(0, 0, 0, .18);
}

.eo-dir-btn:active {
  transform: scale(.95);
}

.eo-dir-btn[data-dir="up"] { grid-column: 2; grid-row: 1; }
.eo-dir-btn[data-dir="left"] { grid-column: 1; grid-row: 2; }
.eo-dir-btn[data-dir="right"] { grid-column: 3; grid-row: 2; }
.eo-dir-btn[data-dir="down"] { grid-column: 2; grid-row: 3; }

.eo-ghost-meter {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.eo-ghost-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(191, 219, 254, .18);
  border: 1px solid rgba(191, 219, 254, .16);
}

.eo-ghost-dot.on {
  background: rgba(191, 219, 254, .84);
  box-shadow: 0 0 10px rgba(191, 219, 254, .28);
}

.eo-menu,
.eo-finish {
  justify-content: center;
  padding:
    calc(env(safe-area-inset-top, 18px) + 24px)
    max(18px, env(safe-area-inset-right, 0px))
    calc(env(safe-area-inset-bottom, 0px) + 20px)
    max(18px, env(safe-area-inset-left, 0px));
}

.eo-menu-card,
.eo-finish-card {
  padding: 22px 20px;
}

.eo-hero {
  font-size: 52px;
  line-height: 1;
}

.eo-menu-title,
.eo-finish-title {
  margin-top: 14px;
  font-size: 32px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.eo-menu-copy,
.eo-finish-copy {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.55;
  color: rgba(229, 246, 234, .78);
}

.eo-rule-list {
  margin-top: 16px;
  display: grid;
  gap: 10px;
}

.eo-rule {
  padding: 12px 13px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .05);
}

.eo-rule strong {
  display: block;
  font-size: 13px;
  font-weight: 800;
}

.eo-rule span {
  display: block;
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(229, 246, 234, .72);
}

.eo-row {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.eo-menu-stat {
  padding: 12px 13px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .05);
}

.eo-menu-value {
  margin-top: 7px;
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
}

.eo-primary,
.eo-secondary {
  width: 100%;
  margin-top: 18px;
  border: none;
  border-radius: 16px;
  padding: 15px 18px;
  font: inherit;
  font-size: 16px;
  font-weight: 800;
}

.eo-primary {
  color: #0c1a11;
  background: linear-gradient(180deg, #fde68a 0%, #f59e0b 100%);
  box-shadow: 0 16px 26px rgba(245, 158, 11, .20);
}

.eo-secondary {
  margin-top: 10px;
  color: #e7f8ec;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .06);
}

.eo-primary:active,
.eo-secondary:active {
  transform: scale(.98);
}

.eo-finish-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.eo-finish-cell {
  padding: 12px 10px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .05);
}

.eo-finish-value {
  margin-top: 7px;
  font-size: 22px;
  line-height: 1;
  font-weight: 900;
}

@media (max-height: 760px) {
  .eo-title {
    font-size: 22px;
  }

  .eo-panels {
    gap: 6px;
  }

  .eo-card,
  .eo-loop-panel,
  .eo-tip {
    border-radius: 16px;
  }

  .eo-card {
    padding: 9px 11px 11px;
  }

  .eo-step {
    height: 40px;
  }

  .eo-dpad {
    grid-template-columns: repeat(3, 48px);
    grid-template-rows: repeat(3, 48px);
  }
}
`;
  document.head.appendChild(style);
}

function freshState() {
  return {
    version: 1,
    status: 'playing',
    rocks: sample(ROCK_LAYOUTS).slice(),
    mold: sample(MOLD_LAYOUTS).slice(),
    player: START_INDEX,
    echoes: [],
    fruits: [],
    currentLoop: [],
    cycleStart: START_INDEX,
    phase: 0,
    turn: 0,
    score: 0,
    blight: 0,
    harvested: 0,
    nextEchoId: 1,
    nextFruitId: 1,
    lastEvent: 'Build a 4-step route, then let it work for you.',
    lossReason: '',
  };
}

const EchoOrchard = {
  _el: null,
  _storage: null,
  _state: null,
  _best: 0,
  _keyHandler: null,
  _resizeHandler: null,
  _touchStart: null,

  async init(container, storage) {
    injectCSS();
    this._storage = storage;
    this._best = Number(storage.get('best') || 0);
    this._el = document.createElement('div');
    this._el.className = 'eo';
    container.appendChild(this._el);

    const saved = storage.get('state');
    if (saved?.version === 1 && saved.status) {
      this._state = saved;
    } else {
      this._state = { status: 'menu' };
    }

    this._keyHandler = event => {
      const dir = this._dirForKey(event.key);
      if (dir) {
        event.preventDefault();
        this._handleMove(dir);
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (this._state?.status === 'playing' || this._state?.status === 'lost') this._startRun();
      }
    };

    this._resizeHandler = () => this._render();
    window.addEventListener('keydown', this._keyHandler);
    window.addEventListener('resize', this._resizeHandler);

    this._render();
  },

  destroy() {
    this._save();
    if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
    this._keyHandler = null;
    this._resizeHandler = null;
    this._touchStart = null;
    this._el?.remove();
    this._el = null;
  },

  pause() {
    this._save();
  },

  resume() {
    this._render();
  },

  _render() {
    if (!this._el) return;

    if (this._state?.status === 'menu') {
      this._renderMenu();
      return;
    }

    if (this._state?.status === 'lost') {
      this._renderFinish();
      return;
    }

    this._renderGame();
  },

  _renderMenu() {
    this._el.innerHTML = `
      <div class="eo-menu">
        <div class="eo-menu-card">
          <div class="eo-hero">🌿</div>
          <div class="eo-kicker">New Game</div>
          <div class="eo-menu-title">Echo Orchard</div>
          <div class="eo-menu-copy">
            Every 4 moves becomes an echo gardener that keeps repeating your route.
            Build useful little paths, harvest fruit before it spoils, and keep the mold from taking over.
          </div>
          <div class="eo-rule-list">
            <div class="eo-rule">
              <strong>Shape the orchard</strong>
              <span>Short loops matter. A simple square can keep clearing one corner for minutes.</span>
            </div>
            <div class="eo-rule">
              <strong>Rot is permanent pressure</strong>
              <span>Missed fruit adds blight and leaves mold behind. Sunfruit clears nearby patches.</span>
            </div>
            <div class="eo-rule">
              <strong>Retune your crew</strong>
              <span>Only ${MAX_ECHOES} echoes survive at once, so every new loop replaces your oldest idea.</span>
            </div>
          </div>
          <div class="eo-row">
            <div class="eo-menu-stat">
              <div class="eo-card-label">Best Score</div>
              <div class="eo-menu-value">${fmt(this._best)}</div>
            </div>
            <div class="eo-menu-stat">
              <div class="eo-card-label">Controls</div>
              <div class="eo-menu-value">Swipe</div>
            </div>
          </div>
          <button class="eo-primary" data-action="start">Start Orchard</button>
        </div>
      </div>`;

    this._el.querySelector('[data-action="start"]').addEventListener('click', () => this._startRun());
  },

  _renderFinish() {
    const state = this._state;
    this._el.innerHTML = `
      <div class="eo-finish">
        <div class="eo-finish-card">
          <div class="eo-kicker">Run Ended</div>
          <div class="eo-finish-title">The orchard folded.</div>
          <div class="eo-finish-copy">
            ${state.lossReason || 'The garden slipped out of rhythm.'}
          </div>
          <div class="eo-finish-grid">
            <div class="eo-finish-cell">
              <div class="eo-card-label">Score</div>
              <div class="eo-finish-value">${fmt(state.score)}</div>
            </div>
            <div class="eo-finish-cell">
              <div class="eo-card-label">Fruit</div>
              <div class="eo-finish-value">${fmt(state.harvested)}</div>
            </div>
            <div class="eo-finish-cell">
              <div class="eo-card-label">Best</div>
              <div class="eo-finish-value">${fmt(this._best)}</div>
            </div>
          </div>
          <button class="eo-primary" data-action="restart">Grow Again</button>
          <button class="eo-secondary" data-action="menu">Back to Title</button>
        </div>
      </div>`;

    this._el.querySelector('[data-action="restart"]').addEventListener('click', () => this._startRun());
    this._el.querySelector('[data-action="menu"]').addEventListener('click', () => {
      this._state = { status: 'menu' };
      this._save();
      this._render();
    });
  },

  _renderGame() {
    const state = this._state;
    const cellSize = this._measureCell();
    const fruitByPos = new Map(state.fruits.map(fruit => [fruit.pos, fruit]));
    const moldSet = new Set(state.mold);
    const rockSet = new Set(state.rocks);
    const echoMap = new Map();

    state.echoes.forEach(echo => {
      echoMap.set(echo.pos, (echoMap.get(echo.pos) || 0) + 1);
    });

    const loopSlots = [];
    for (let i = 0; i < LOOP_LEN; i++) {
      const dir = state.currentLoop[i];
      const className = [
        'eo-step',
        dir ? '' : 'empty',
        i === state.phase ? 'live' : '',
      ].filter(Boolean).join(' ');
      loopSlots.push(`<div class="${className}">${dir ? DIRS[dir].label : '+'}</div>`);
    }

    const echoCards = state.echoes.length
      ? state.echoes.map((echo, index) => `
          <div class="eo-echo-card ${index === 0 ? 'oldest' : ''}">
            <div class="eo-echo-label">${index === state.echoes.length - 1 ? 'Newest' : 'Echo'}</div>
            <div class="eo-echo-route">
              ${echo.loop.map((dir, step) => `<div class="eo-echo-step ${step === state.phase ? 'live' : ''}">${DIRS[dir].label}</div>`).join('')}
            </div>
          </div>
        `).join('')
      : `<div class="eo-echo-card"><div class="eo-echo-label">No Echoes Yet</div><div class="eo-sub" style="margin-top:8px;max-width:none">Finish your first 4-move route.</div></div>`;

    const cells = [];
    for (let index = 0; index < COLS * ROWS; index++) {
      const fruit = fruitByPos.get(index);
      const echoCount = echoMap.get(index) || 0;
      const isTap = this._dirForNeighbor(index) !== null;
      const parts = [];

      if (moldSet.has(index)) parts.push('<div class="eo-mold"></div>');
      if (rockSet.has(index)) parts.push('<div class="eo-rock"></div>');
      if (fruit) {
        parts.push(`<div class="eo-fruit ${fruit.kind}"></div>`);
        parts.push(`<div class="eo-ttl">${fruit.ttl}</div>`);
      }
      if (echoCount) {
        const offsets = ['offset-a', 'offset-b', 'offset-c'];
        parts.push(`<div class="eo-echo-stack">${offsets.slice(0, Math.min(3, echoCount)).map(offset => `<div class="eo-echo-unit ${offset}"></div>`).join('')}</div>`);
      }
      if (state.player === index) parts.push('<div class="eo-player"></div>');

      cells.push(`
        <button class="eo-cell ${isTap ? 'tap' : ''}" data-cell="${index}" aria-label="Cell ${index}">
          ${parts.join('')}
        </button>
      `);
    }

    this._el.innerHTML = `
      <div class="eo-shell">
        <div class="eo-top">
          <div class="eo-head">
            <div class="eo-kicker">Living Puzzle</div>
            <div class="eo-title">Echo Orchard</div>
            <div class="eo-sub">Grow harvest routes before fruit turns into pressure.</div>
          </div>
          <div class="eo-score">
            <div class="eo-card-label">Score</div>
            <div class="eo-score-value">${fmt(state.score)}</div>
            <div class="eo-ghost-meter">
              ${Array.from({ length: MAX_ECHOES }, (_, i) => `<div class="eo-ghost-dot ${i < state.echoes.length ? 'on' : ''}"></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="eo-panels">
          <div class="eo-card">
            <div class="eo-card-label">Blight</div>
            <div class="eo-card-value">${state.blight}/${ROT_LIMIT}</div>
          </div>
          <div class="eo-card">
            <div class="eo-card-label">Fruit</div>
            <div class="eo-card-value">${fmt(state.harvested)}</div>
          </div>
          <div class="eo-card">
            <div class="eo-card-label">Turn</div>
            <div class="eo-card-value">${fmt(state.turn)}</div>
          </div>
        </div>

        <div class="eo-loop-panel">
          <div class="eo-loop-head">
            <div>
              <div class="eo-mini-label">Current Route</div>
              <div class="eo-loop-note">At 4 moves, this route becomes a new echo.</div>
            </div>
            <div class="eo-mini-label">${state.currentLoop.length}/${LOOP_LEN}</div>
          </div>
          <div class="eo-loop-track">${loopSlots.join('')}</div>
          <div class="eo-echo-strip">${echoCards}</div>
        </div>

        <div class="eo-board-wrap">
          <div class="eo-board" style="--cell:${cellSize}px" aria-label="Orchard board">
            ${cells.join('')}
          </div>
        </div>

        <div class="eo-tip">
          <div class="eo-tip-label">Status</div>
          <div class="eo-tip-text">${state.lastEvent}</div>
        </div>

        <div class="eo-controls">
          <div class="eo-legend">Tap a neighboring cell, swipe, or use the d-pad. Press R to restart.</div>
          <div class="eo-dpad">
            ${DIR_ORDER.map(dir => `<button class="eo-dir-btn" data-dir="${dir}" aria-label="${DIRS[dir].name}">${DIRS[dir].label}</button>`).join('')}
          </div>
          <div class="eo-legend" style="text-align:right">Sunfruit clears nearby mold. Rotten fruit adds blight and blocks future spawns.</div>
        </div>
      </div>`;

    this._bindGameEvents();
  },

  _bindGameEvents() {
    this._el.querySelectorAll('.eo-dir-btn').forEach(button => {
      button.addEventListener('click', () => this._handleMove(button.dataset.dir));
    });

    this._el.querySelectorAll('.eo-cell').forEach(button => {
      button.addEventListener('click', () => {
        const dir = this._dirForNeighbor(Number(button.dataset.cell));
        if (dir) this._handleMove(dir);
      });
    });

    const board = this._el.querySelector('.eo-board');
    if (!board) return;

    board.addEventListener('touchstart', event => {
      const touch = event.touches[0];
      if (!touch) return;
      this._touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    board.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      if (!touch || !this._touchStart) return;

      const dx = touch.clientX - this._touchStart.x;
      const dy = touch.clientY - this._touchStart.y;
      this._touchStart = null;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      event.preventDefault();
      const dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      this._handleMove(dir);
    }, { passive: false });
  },

  _startRun() {
    this._state = freshState();
    this._ensureFruitTarget(true);
    this._save();
    this._render();
  },

  _handleMove(dir) {
    if (!this._state || this._state.status !== 'playing') return;

    const nextPlayer = this._step(this._state.player, dir);
    if (nextPlayer === null) {
      this._state.lastEvent = 'That route is blocked by stone.';
      this._render();
      return;
    }

    const state = this._state;
    const phase = state.phase;
    const messages = [];
    state.player = nextPlayer;

    state.echoes = state.echoes.map(echo => {
      const next = this._step(echo.pos, echo.loop[phase]);
      return { ...echo, pos: next === null ? echo.pos : next };
    });

    state.currentLoop.push(dir);
    state.turn += 1;

    const occupied = new Set([state.player, ...state.echoes.map(echo => echo.pos)]);
    const harvested = [];
    const clearMold = new Set();
    const keptFruit = [];

    for (const fruit of state.fruits) {
      if (occupied.has(fruit.pos)) {
        harvested.push(fruit);
        clearMold.add(fruit.pos);
        if (fruit.kind === 'sun') {
          this._neighborRing(fruit.pos).forEach(index => clearMold.add(index));
        }
      } else {
        keptFruit.push(fruit);
      }
    }

    occupied.forEach(index => clearMold.add(index));
    const beforeClean = state.mold.length;
    state.mold = state.mold.filter(index => !clearMold.has(index));
    const cleaned = beforeClean - state.mold.length;
    state.fruits = keptFruit;

    if (harvested.length) {
      const points = harvested.reduce((sum, fruit) => {
        if (fruit.kind === 'sun') return sum + 26;
        return sum + 8 + fruit.ttl * 3;
      }, 0);
      const combo = harvested.length > 1 ? harvested.length * 7 : 0;
      const moldBonus = cleaned > harvested.length ? (cleaned - harvested.length) * 2 : 0;
      state.score += points + combo + moldBonus;
      state.harvested += harvested.length;
      messages.push(
        harvested.length > 1
          ? `Harmony harvest x${harvested.length}.`
          : harvested[0].kind === 'sun'
            ? 'Sunfruit burst through the mold.'
            : 'Fresh fruit collected.'
      );
    } else if (cleaned) {
      messages.push(cleaned > 1 ? `You cleared ${cleaned} mold patches.` : 'You pruned a mold patch.');
    }

    const rotted = [];
    state.fruits = state.fruits.filter(fruit => {
      fruit.ttl -= 1;
      if (fruit.ttl <= 0) {
        rotted.push(fruit);
        return false;
      }
      return true;
    });

    if (rotted.length) {
      const mold = new Set(state.mold);
      rotted.forEach(fruit => mold.add(fruit.pos));
      state.mold = Array.from(mold);
      state.blight += rotted.length;
      messages.push(rotted.length > 1 ? `${rotted.length} fruit spoiled.` : 'A fruit spoiled.');
    }

    if (state.currentLoop.length === LOOP_LEN) {
      state.echoes.push({
        id: state.nextEchoId++,
        pos: state.cycleStart,
        loop: state.currentLoop.slice(),
      });
      if (state.echoes.length > MAX_ECHOES) {
        state.echoes.shift();
        messages.push('Your oldest echo faded out.');
      }
      state.currentLoop = [];
      state.phase = 0;
      state.cycleStart = state.player;
      messages.push('A new echo took root.');
      const spreadCount = this._spreadMold();
      if (spreadCount) messages.push(spreadCount > 1 ? `Mold spread to ${spreadCount} cells.` : 'Mold spread.');
    } else {
      state.phase += 1;
    }

    this._ensureFruitTarget(false);

    if (!messages.length) messages.push('The orchard shifted.');
    state.lastEvent = messages.join(' ');

    if (state.blight >= ROT_LIMIT) {
      this._finishRun('Too much fruit spoiled. The orchard turned on itself.');
      return;
    }

    if (state.mold.length >= MOLD_LIMIT) {
      this._finishRun('Mold took too much ground. The loops ran out of room.');
      return;
    }

    this._save();
    this._render();
  },

  _finishRun(reason) {
    this._state.status = 'lost';
    this._state.lossReason = reason;
    this._best = Math.max(this._best, this._state.score);
    this._storage.set('best', this._best);
    this._save();
    this._render();
  },

  _ensureFruitTarget(initial) {
    if (!this._state || this._state.status !== 'playing') return;

    const target = Math.min(5, 3 + Math.floor(this._state.turn / 14));
    let attempts = 0;
    while (this._state.fruits.length < target && attempts < 30) {
      attempts += 1;
      const created = this._spawnFruit(initial || attempts === 1);
      if (!created) break;
    }
  },

  _spawnFruit(preferSun) {
    const open = this._openCells();
    if (!open.length) return false;

    const hasSun = this._state.fruits.some(fruit => fruit.kind === 'sun');
    const sunReady = !hasSun && this._state.turn >= 6 && (this._state.turn % 7 === 0 || preferSun && Math.random() < 0.22);
    const kind = sunReady ? 'sun' : 'normal';
    const pos = sample(open);
    const ttl = kind === 'sun' ? 5 : randInt(5, 8);

    this._state.fruits.push({
      id: this._state.nextFruitId++,
      pos,
      ttl,
      kind,
    });
    return true;
  },

  _spreadMold() {
    const mold = new Set(this._state.mold);
    if (!mold.size) return 0;

    const occupied = new Set([this._state.player, ...this._state.echoes.map(echo => echo.pos)]);
    const fruitSet = new Set(this._state.fruits.map(fruit => fruit.pos));
    const candidates = [];

    for (const source of mold) {
      for (const dir of DIR_ORDER) {
        const next = this._step(source, dir);
        if (next === null) continue;
        if (mold.has(next) || occupied.has(next) || fruitSet.has(next)) continue;
        candidates.push(next);
      }
    }

    if (!candidates.length) return 0;

    const unique = [];
    const seen = new Set();
    shuffle(candidates).forEach(index => {
      if (!seen.has(index)) {
        seen.add(index);
        unique.push(index);
      }
    });

    const limit = Math.min(unique.length, Math.max(1, Math.floor(this._state.mold.length / 3)));
    for (let i = 0; i < limit; i++) mold.add(unique[i]);
    this._state.mold = Array.from(mold);
    return limit;
  },

  _openCells() {
    const occupied = new Set([
      this._state.player,
      ...this._state.echoes.map(echo => echo.pos),
      ...this._state.rocks,
      ...this._state.mold,
      ...this._state.fruits.map(fruit => fruit.pos),
    ]);
    const cells = [];
    for (let index = 0; index < COLS * ROWS; index++) {
      if (!occupied.has(index)) cells.push(index);
    }
    return cells;
  },

  _step(index, dir) {
    const { x, y } = coordOf(index);
    const nextX = x + DIRS[dir].dx;
    const nextY = y + DIRS[dir].dy;

    if (nextX < 0 || nextX >= COLS || nextY < 0 || nextY >= ROWS) return null;
    const next = indexOf(nextX, nextY);
    if (this._state.rocks.includes(next)) return null;
    return next;
  },

  _dirForNeighbor(index) {
    if (!this._state || this._state.status !== 'playing') return null;
    const from = coordOf(this._state.player);
    const to = coordOf(index);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return null;
    if (dx === 1) return 'right';
    if (dx === -1) return 'left';
    if (dy === 1) return 'down';
    if (dy === -1) return 'up';
    return null;
  },

  _neighborRing(index) {
    const { x, y } = coordOf(index);
    const cells = [];
    for (let yy = y - 1; yy <= y + 1; yy++) {
      for (let xx = x - 1; xx <= x + 1; xx++) {
        if (xx < 0 || xx >= COLS || yy < 0 || yy >= ROWS) continue;
        cells.push(indexOf(xx, yy));
      }
    }
    return cells;
  },

  _measureCell() {
    const byWidth = Math.floor((window.innerWidth - 48) / COLS);
    const byHeight = Math.floor((window.innerHeight - 390) / ROWS);
    return Math.max(34, Math.min(56, byWidth, byHeight));
  },

  _dirForKey(key) {
    const lower = key.toLowerCase();
    if (lower === 'arrowup' || lower === 'w') return 'up';
    if (lower === 'arrowright' || lower === 'd') return 'right';
    if (lower === 'arrowdown' || lower === 's') return 'down';
    if (lower === 'arrowleft' || lower === 'a') return 'left';
    return null;
  },

  _save() {
    if (!this._storage) return;
    if (this._state) this._storage.set('state', this._state);
  },
};

export default EchoOrchard;
