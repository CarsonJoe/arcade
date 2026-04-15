const SIZE = 7;
const CORE_X = 3;
const CORE_Y = 3;
const CORE = indexOf(CORE_X, CORE_Y);
const MAX_INTEGRITY = 5;

const BLOCKS = [
  indexOf(2, 2),
  indexOf(4, 2),
  indexOf(2, 4),
  indexOf(4, 4),
];

const RELAYS = [
  indexOf(1, 1),
  indexOf(5, 1),
  indexOf(1, 5),
  indexOf(5, 5),
];

const DIRS = {
  up: { dx: 0, dy: -1, glyph: '^', name: 'Up' },
  right: { dx: 1, dy: 0, glyph: '>', name: 'Right' },
  down: { dx: 0, dy: 1, glyph: 'v', name: 'Down' },
  left: { dx: -1, dy: 0, glyph: '<', name: 'Left' },
};

const DIR_ORDER = ['up', 'right', 'down', 'left'];
const BLOCK_SET = new Set(BLOCKS);
const RELAY_SET = new Set(RELAYS);
const DISTANCE = buildDistanceField();

function indexOf(x, y) {
  return y * SIZE + x;
}

function coordOf(index) {
  return { x: index % SIZE, y: Math.floor(index / SIZE) };
}

function inBounds(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function fmt(value) {
  if (value >= 1000000) return `${Math.round(value / 100000) / 10}m`;
  if (value >= 10000) return `${Math.round(value / 1000)}k`;
  return String(value);
}

function buildDistanceField() {
  const dist = new Array(SIZE * SIZE).fill(Infinity);
  const queue = [CORE];
  dist[CORE] = 0;

  while (queue.length) {
    const current = queue.shift();
    const { x, y } = coordOf(current);

    for (const dir of DIR_ORDER) {
      const nx = x + DIRS[dir].dx;
      const ny = y + DIRS[dir].dy;
      if (!inBounds(nx, ny)) continue;

      const next = indexOf(nx, ny);
      if (BLOCK_SET.has(next)) continue;
      if (dist[next] !== Infinity) continue;
      dist[next] = dist[current] + 1;
      queue.push(next);
    }
  }

  return dist;
}

function uniquePush(list, value) {
  if (!list.includes(value)) list.push(value);
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

function edgeCells() {
  const cells = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (x !== 0 && x !== SIZE - 1 && y !== 0 && y !== SIZE - 1) continue;
      const index = indexOf(x, y);
      if (BLOCK_SET.has(index)) continue;
      cells.push(index);
    }
  }
  return cells;
}

const EDGE_CELLS = edgeCells();

function warningBias(index) {
  const { x, y } = coordOf(index);
  if (x === 0 || x === SIZE - 1) return 'h';
  if (y === 0 || y === SIZE - 1) return 'v';
  return Math.random() < 0.5 ? 'h' : 'v';
}

let cssReady = false;
function injectCSS() {
  if (cssReady) return;
  cssReady = true;

  const style = document.createElement('style');
  style.textContent = `
.pp {
  --cell: 46px;
  height: 100%;
  min-height: 100%;
  color: #edfdf6;
  background:
    radial-gradient(circle at 18% 10%, rgba(34, 211, 238, .18), transparent 30%),
    radial-gradient(circle at 80% 12%, rgba(245, 158, 11, .18), transparent 28%),
    linear-gradient(180deg, #071518 0%, #0b1c20 44%, #0f1f1e 100%);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  overflow: hidden;
}

.pp-menu,
.pp-shell,
.pp-finish {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pp-shell {
  padding:
    calc(env(safe-area-inset-top, 18px) + 10px)
    max(14px, calc(env(safe-area-inset-right, 0px) + 50px))
    calc(env(safe-area-inset-bottom, 0px) + 12px)
    max(14px, env(safe-area-inset-left, 0px));
  gap: 10px;
}

.pp-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.pp-kicker,
.pp-label,
.pp-mini {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(224, 246, 240, .56);
}

.pp-title {
  margin-top: 4px;
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.pp-sub {
  margin-top: 6px;
  max-width: 26ch;
  font-size: 13px;
  line-height: 1.46;
  color: rgba(228, 246, 240, .74);
}

.pp-score {
  min-width: 96px;
  text-align: right;
}

.pp-score-value,
.pp-stat-value,
.pp-finish-value,
.pp-menu-value {
  margin-top: 6px;
  font-size: 25px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
  font-variant-numeric: tabular-nums;
}

.pp-card,
.pp-loop,
.pp-status,
.pp-menu-card,
.pp-finish-card {
  border-radius: 18px;
  background: rgba(8, 23, 24, .66);
  border: 1px solid rgba(198, 244, 232, .10);
  box-shadow: 0 16px 34px rgba(1, 9, 10, .20);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.pp-score,
.pp-card {
  padding: 10px 12px 12px;
}

.pp-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.pp-stat-value {
  font-size: 21px;
}

.pp-loop,
.pp-status {
  padding: 12px;
}

.pp-loop-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pp-loop-copy {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(228, 246, 240, .74);
}

.pp-relays {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.pp-relay-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, .10);
  background: rgba(255, 255, 255, .06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .04);
}

.pp-relay-dot.on {
  background: radial-gradient(circle at 35% 32%, #fff7d6 0%, #f59e0b 66%, #b45309 100%);
  box-shadow: 0 0 14px rgba(245, 158, 11, .28);
}

.pp-board-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pp-board {
  display: grid;
  grid-template-columns: repeat(${SIZE}, var(--cell));
  gap: 6px;
  padding: 8px;
  border-radius: 26px;
  background:
    linear-gradient(180deg, rgba(18, 45, 48, .88), rgba(12, 31, 32, .96)),
    rgba(8, 16, 16, .86);
  border: 1px solid rgba(204, 246, 236, .10);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .04),
    0 26px 48px rgba(0, 0, 0, .26);
  touch-action: none;
}

.pp-cell {
  position: relative;
  width: var(--cell);
  height: var(--cell);
  border: none;
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 255, 255, .08), transparent 48%),
    rgba(17, 42, 43, .84);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .04),
    inset 0 -8px 14px rgba(0, 0, 0, .12);
}

.pp-cell.tap {
  cursor: pointer;
}

.pp-cell.tap:active {
  transform: scale(.96);
}

.pp-cell.core {
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, .16), transparent 52%),
    linear-gradient(180deg, rgba(34, 211, 238, .22), rgba(17, 94, 89, .18)),
    rgba(11, 50, 53, .94);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, .22),
    0 0 18px rgba(34, 211, 238, .16);
}

.pp-cell.block {
  background:
    linear-gradient(145deg, rgba(96, 108, 116, .95), rgba(46, 55, 61, .98));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .18),
    inset 0 -10px 14px rgba(0, 0, 0, .16);
}

.pp-cell.trail:not(.core) {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .02)),
    rgba(15, 70, 76, .92);
  box-shadow:
    inset 0 0 0 1px rgba(34, 211, 238, .18),
    0 0 16px rgba(34, 211, 238, .12);
}

.pp-cell.warning {
  box-shadow:
    inset 0 0 0 2px rgba(248, 113, 113, .22),
    0 0 14px rgba(248, 113, 113, .10);
}

.pp-core-ring,
.pp-relay,
.pp-warning,
.pp-player,
.pp-bug,
.pp-intent,
.pp-cell-count {
  position: absolute;
}

.pp-core-ring {
  inset: 7px;
  border-radius: 50%;
  border: 2px solid rgba(103, 232, 249, .78);
  box-shadow: 0 0 16px rgba(34, 211, 238, .26);
}

.pp-core-ring::after {
  content: '';
  position: absolute;
  inset: 8px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #ecfeff 0%, #67e8f9 40%, #0f766e 100%);
}

.pp-relay {
  inset: 8px;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .05), rgba(255, 255, 255, .02)),
    rgba(30, 64, 74, .78);
  box-shadow: inset 0 0 0 1px rgba(165, 243, 252, .10);
}

.pp-relay::before,
.pp-relay::after {
  content: '';
  position: absolute;
  background: rgba(165, 243, 252, .58);
  border-radius: 999px;
}

.pp-relay::before {
  inset: 6px 14px;
}

.pp-relay::after {
  inset: 14px 6px;
}

.pp-relay.active {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .04)),
    rgba(146, 64, 14, .86);
  box-shadow:
    inset 0 0 0 1px rgba(251, 191, 36, .24),
    0 0 16px rgba(245, 158, 11, .20);
}

.pp-relay.active::before,
.pp-relay.active::after {
  background: rgba(253, 224, 71, .86);
}

.pp-warning {
  inset: 7px;
  border-radius: 13px;
  background:
    linear-gradient(180deg, rgba(248, 113, 113, .22), rgba(127, 29, 29, .36));
  box-shadow: inset 0 0 0 1px rgba(254, 202, 202, .12);
}

.pp-warning::after {
  content: '!';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: #fee2e2;
}

.pp-player {
  inset: 8px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, #fff7d6 0%, #fde68a 28%, #22d3ee 58%, #155e75 100%);
  box-shadow:
    inset 0 2px 0 rgba(255, 255, 255, .30),
    0 0 18px rgba(34, 211, 238, .26);
}

.pp-player::after {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 1px solid rgba(34, 211, 238, .24);
}

.pp-bug {
  inset: 9px;
  border-radius: 14px;
  background:
    radial-gradient(circle at 35% 30%, #fee2e2 0%, #f87171 38%, #991b1b 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .24),
    0 0 16px rgba(248, 113, 113, .18);
  transform: rotate(45deg);
}

.pp-bug::before,
.pp-bug::after {
  content: '';
  position: absolute;
  background: rgba(254, 226, 226, .84);
  border-radius: 999px;
  transform: rotate(-45deg);
}

.pp-bug::before {
  inset: 4px 11px auto;
  height: 3px;
}

.pp-bug::after {
  inset: auto 11px 4px;
  height: 3px;
}

.pp-intent {
  left: 4px;
  top: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: #cffafe;
  background: rgba(8, 145, 178, .26);
  border: 1px solid rgba(165, 243, 252, .12);
}

.pp-cell-count {
  right: 4px;
  bottom: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 800;
  color: #160707;
  background: rgba(254, 226, 226, .90);
}

.pp-status-copy {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.46;
  color: rgba(228, 246, 240, .82);
}

.pp-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.pp-help {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(228, 246, 240, .66);
}

.pp-help.right {
  text-align: right;
}

.pp-dpad {
  display: grid;
  grid-template-columns: repeat(3, 54px);
  grid-template-rows: repeat(3, 54px);
  gap: 6px;
}

.pp-btn {
  border: none;
  border-radius: 16px;
  font: inherit;
  font-size: 22px;
  font-weight: 900;
  color: #e6fffb;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, .08), rgba(255, 255, 255, .02)),
    rgba(11, 35, 37, .86);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .08),
    0 10px 18px rgba(0, 0, 0, .18);
}

.pp-btn:active,
.pp-primary:active,
.pp-secondary:active {
  transform: scale(.97);
}

.pp-btn[data-dir="up"] { grid-column: 2; grid-row: 1; }
.pp-btn[data-dir="left"] { grid-column: 1; grid-row: 2; }
.pp-btn[data-dir="wait"] { grid-column: 2; grid-row: 2; font-size: 16px; }
.pp-btn[data-dir="right"] { grid-column: 3; grid-row: 2; }
.pp-btn[data-dir="down"] { grid-column: 2; grid-row: 3; }

.pp-menu,
.pp-finish {
  justify-content: center;
  padding:
    calc(env(safe-area-inset-top, 18px) + 24px)
    max(18px, env(safe-area-inset-right, 0px))
    calc(env(safe-area-inset-bottom, 0px) + 20px)
    max(18px, env(safe-area-inset-left, 0px));
}

.pp-menu-card,
.pp-finish-card {
  padding: 22px 20px;
}

.pp-hero {
  font-size: 54px;
  line-height: 1;
}

.pp-menu-title,
.pp-finish-title {
  margin-top: 14px;
  font-size: 32px;
  line-height: 1;
  font-weight: 900;
  letter-spacing: -.06em;
}

.pp-menu-copy,
.pp-finish-copy {
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.56;
  color: rgba(228, 246, 240, .78);
}

.pp-rules,
.pp-finish-grid,
.pp-menu-grid {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.pp-rule,
.pp-finish-cell,
.pp-menu-stat {
  padding: 12px 13px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .04);
  border: 1px solid rgba(255, 255, 255, .05);
}

.pp-rule strong {
  display: block;
  font-size: 13px;
  font-weight: 800;
}

.pp-rule span {
  display: block;
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.44;
  color: rgba(228, 246, 240, .72);
}

.pp-menu-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pp-finish-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.pp-primary,
.pp-secondary {
  width: 100%;
  border: none;
  border-radius: 16px;
  padding: 15px 18px;
  font: inherit;
  font-size: 16px;
  font-weight: 800;
}

.pp-primary {
  margin-top: 18px;
  color: #10201d;
  background: linear-gradient(180deg, #67e8f9 0%, #22d3ee 100%);
  box-shadow: 0 16px 26px rgba(34, 211, 238, .18);
}

.pp-secondary {
  margin-top: 10px;
  color: #eafdf8;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .06);
}

@media (max-height: 780px) {
  .pp-title {
    font-size: 22px;
  }

  .pp-stats {
    gap: 6px;
  }

  .pp-card,
  .pp-score,
  .pp-loop,
  .pp-status {
    border-radius: 16px;
  }

  .pp-dpad {
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
    player: CORE,
    integrity: MAX_INTEGRITY,
    score: 0,
    turn: 0,
    bugsZapped: 0,
    bugs: [],
    warnings: [],
    trail: [],
    activatedRelays: [],
    nextBugId: 1,
    lastEvent: 'Step out from the core, draw a route, then cash it in.',
    lossReason: '',
  };
}

const Pulsepath = {
  _el: null,
  _storage: null,
  _state: null,
  _best: 0,
  _keyHandler: null,
  _resizeHandler: null,
  _swipeStart: null,

  async init(container, storage) {
    injectCSS();
    this._storage = storage;
    this._best = Number(storage.get('best') || 0);
    this._el = document.createElement('div');
    this._el.className = 'pp';
    container.appendChild(this._el);

    const saved = storage.get('state');
    if (saved?.version === 1 && saved.status) {
      this._state = saved;
    } else {
      this._state = { status: 'menu' };
    }

    this._keyHandler = event => {
      const dir = this._keyToAction(event.key);
      if (dir) {
        event.preventDefault();
        this._takeTurn(dir);
        return;
      }

      const lower = event.key.toLowerCase();
      if (lower === 'r' && (this._state?.status === 'playing' || this._state?.status === 'lost')) {
        event.preventDefault();
        this._startRun();
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
    this._swipeStart = null;
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
      <div class="pp-menu">
        <div class="pp-menu-card">
          <div class="pp-hero">⚡</div>
          <div class="pp-kicker">New Game</div>
          <div class="pp-menu-title">Pulsepath</div>
          <div class="pp-menu-copy">
            Bugs only move down visible lanes into the core. You stop them by drawing a wire route,
            priming relays, and re-entering the core at the right moment to fire the board.
          </div>
          <div class="pp-rules">
            <div class="pp-rule">
              <strong>Draw the trap</strong>
              <span>Every tile you visit away from the core becomes live wire. Returning home pulses that route.</span>
            </div>
            <div class="pp-rule">
              <strong>Prime relays</strong>
              <span>Touch corner relays during a run to fire their full row and column on your next pulse.</span>
            </div>
            <div class="pp-rule">
              <strong>Read the pressure</strong>
              <span>Enemy spawns are telegraphed one turn early, and bugs always march toward the core.</span>
            </div>
          </div>
          <div class="pp-menu-grid">
            <div class="pp-menu-stat">
              <div class="pp-label">Best Score</div>
              <div class="pp-menu-value">${fmt(this._best)}</div>
            </div>
            <div class="pp-menu-stat">
              <div class="pp-label">Input</div>
              <div class="pp-menu-value">Swipe</div>
            </div>
          </div>
          <button class="pp-primary" data-action="start">Start Run</button>
        </div>
      </div>`;

    this._el.querySelector('[data-action="start"]').addEventListener('click', () => this._startRun());
  },

  _renderFinish() {
    const state = this._state;
    this._el.innerHTML = `
      <div class="pp-finish">
        <div class="pp-finish-card">
          <div class="pp-kicker">Run Ended</div>
          <div class="pp-finish-title">The core went dark.</div>
          <div class="pp-finish-copy">${state.lossReason || 'The lane pressure got through.'}</div>
          <div class="pp-finish-grid">
            <div class="pp-finish-cell">
              <div class="pp-label">Score</div>
              <div class="pp-finish-value">${fmt(state.score)}</div>
            </div>
            <div class="pp-finish-cell">
              <div class="pp-label">Zapped</div>
              <div class="pp-finish-value">${fmt(state.bugsZapped)}</div>
            </div>
            <div class="pp-finish-cell">
              <div class="pp-label">Best</div>
              <div class="pp-finish-value">${fmt(this._best)}</div>
            </div>
          </div>
          <button class="pp-primary" data-action="restart">Run Again</button>
          <button class="pp-secondary" data-action="menu">Back to Title</button>
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
    const trailSet = new Set(state.trail);
    const activeRelays = new Set(state.activatedRelays);
    const warningMap = new Map();
    const bugMap = new Map();
    const intentMap = new Map();

    state.warnings.forEach(warning => warningMap.set(warning.pos, warning));
    state.bugs.forEach(bug => {
      bugMap.set(bug.pos, (bugMap.get(bug.pos) || 0) + 1);
      const next = this._nextBugPos(bug);
      if (next !== null) intentMap.set(next, (intentMap.get(next) || 0) + 1);
    });

    const cells = [];
    for (let index = 0; index < SIZE * SIZE; index++) {
      const isBlock = BLOCK_SET.has(index);
      const isCore = index === CORE;
      const relay = RELAY_SET.has(index);
      const bugCount = bugMap.get(index) || 0;
      const warning = warningMap.get(index);
      const intent = intentMap.get(index) || 0;
      const isTap = this._tapAction(index) !== null;
      const parts = [];

      if (isCore) parts.push('<div class="pp-core-ring"></div>');
      if (relay) parts.push(`<div class="pp-relay ${activeRelays.has(index) ? 'active' : ''}"></div>`);
      if (warning) parts.push('<div class="pp-warning"></div>');
      if (bugCount) {
        parts.push('<div class="pp-bug"></div>');
        if (bugCount > 1) parts.push(`<div class="pp-cell-count">${bugCount}</div>`);
      }
      if (intent && !bugCount) parts.push(`<div class="pp-intent">${intent}</div>`);
      if (state.player === index) parts.push('<div class="pp-player"></div>');

      const className = [
        'pp-cell',
        isCore ? 'core' : '',
        isBlock ? 'block' : '',
        trailSet.has(index) ? 'trail' : '',
        warning ? 'warning' : '',
        isTap ? 'tap' : '',
      ].filter(Boolean).join(' ');

      cells.push(`
        <button class="${className}" data-cell="${index}" aria-label="Cell ${index}">
          ${parts.join('')}
        </button>
      `);
    }

    this._el.innerHTML = `
      <div class="pp-shell">
        <div class="pp-top">
          <div>
            <div class="pp-kicker">Tactical Arcade</div>
            <div class="pp-title">Pulsepath</div>
            <div class="pp-sub">Draw wire, tag relays, and pulse bugs before they leak through the core.</div>
          </div>
          <div class="pp-card pp-score">
            <div class="pp-label">Score</div>
            <div class="pp-score-value">${fmt(state.score)}</div>
          </div>
        </div>

        <div class="pp-stats">
          <div class="pp-card">
            <div class="pp-label">Integrity</div>
            <div class="pp-stat-value">${state.integrity}/${MAX_INTEGRITY}</div>
          </div>
          <div class="pp-card">
            <div class="pp-label">Wire</div>
            <div class="pp-stat-value">${state.trail.length}</div>
          </div>
          <div class="pp-card">
            <div class="pp-label">Incoming</div>
            <div class="pp-stat-value">${state.warnings.length}</div>
          </div>
          <div class="pp-card">
            <div class="pp-label">Turn</div>
            <div class="pp-stat-value">${state.turn}</div>
          </div>
        </div>

        <div class="pp-loop">
          <div class="pp-loop-head">
            <div>
              <div class="pp-mini">Pulse Plan</div>
              <div class="pp-loop-copy">Return to the core to fire your active route. Touch relays to widen the pulse.</div>
            </div>
            <div class="pp-mini">${state.bugs.length} bugs live</div>
          </div>
          <div class="pp-relays">
            ${RELAYS.map(relay => `<div class="pp-relay-dot ${activeRelays.has(relay) ? 'on' : ''}"></div>`).join('')}
          </div>
        </div>

        <div class="pp-board-wrap">
          <div class="pp-board" style="--cell:${cellSize}px" aria-label="Pulsepath board">
            ${cells.join('')}
          </div>
        </div>

        <div class="pp-status">
          <div class="pp-mini">Status</div>
          <div class="pp-status-copy">${state.lastEvent}</div>
        </div>

        <div class="pp-controls">
          <div class="pp-help">Tap adjacent cells, swipe, or use the d-pad. Tapping yourself waits one turn.</div>
          <div class="pp-dpad">
            ${DIR_ORDER.map(dir => `<button class="pp-btn" data-dir="${dir}" aria-label="${DIRS[dir].name}">${DIRS[dir].glyph}</button>`).join('')}
            <button class="pp-btn" data-dir="wait" aria-label="Wait">•</button>
          </div>
          <div class="pp-help right">Warnings become bugs next turn. Intent dots show where live bugs will step if you do nothing.</div>
        </div>
      </div>`;

    this._bindGameEvents();
  },

  _bindGameEvents() {
    this._el.querySelectorAll('.pp-btn').forEach(button => {
      button.addEventListener('click', () => this._takeTurn(button.dataset.dir));
    });

    this._el.querySelectorAll('.pp-cell').forEach(button => {
      button.addEventListener('click', () => {
        const action = this._tapAction(Number(button.dataset.cell));
        if (action) this._takeTurn(action);
      });
    });

    const board = this._el.querySelector('.pp-board');
    if (!board) return;

    board.addEventListener('touchstart', event => {
      const touch = event.touches[0];
      if (!touch) return;
      this._swipeStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    board.addEventListener('touchend', event => {
      const touch = event.changedTouches[0];
      if (!touch || !this._swipeStart) return;

      const dx = touch.clientX - this._swipeStart.x;
      const dy = touch.clientY - this._swipeStart.y;
      this._swipeStart = null;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      event.preventDefault();
      const dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');
      this._takeTurn(dir);
    }, { passive: false });
  },

  _startRun() {
    this._state = freshState();
    this._state.warnings = this._rollWarnings();
    this._save();
    this._render();
  },

  _takeTurn(action) {
    if (!this._state || this._state.status !== 'playing') return;

    const state = this._state;
    const messages = [];
    const current = state.player;
    let next = current;

    if (action !== 'wait') {
      next = this._stepPlayer(current, action);
      if (next === null) {
        state.lastEvent = 'That lane is blocked.';
        this._render();
        return;
      }
    }

    state.turn += 1;
    const directKills = this._consumeBugsAt(next);
    if (directKills) {
      state.score += directKills * 8;
      state.bugsZapped += directKills;
      messages.push(directKills > 1 ? `You cracked ${directKills} bugs on contact.` : 'You cracked a bug on contact.');
    }

    state.player = next;

    if (state.player !== CORE) {
      uniquePush(state.trail, state.player);
      if (RELAY_SET.has(state.player) && !state.activatedRelays.includes(state.player)) {
        state.activatedRelays.push(state.player);
        messages.push('Relay primed.');
      }
    }

    if (state.player === CORE && state.trail.length) {
      const pulse = this._pulse();
      if (pulse.kills) {
        state.score += pulse.points;
        state.bugsZapped += pulse.kills;
        messages.push(
          pulse.kills > 1
            ? `Pulsepath zapped ${pulse.kills} bugs.`
            : 'Pulsepath zapped a bug.'
        );
      } else {
        messages.push('You discharged an empty wire.');
      }
      if (pulse.relays) {
        messages.push(pulse.relays > 1 ? `${pulse.relays} relays fired.` : 'A relay fired.');
      }
    }

    const movement = this._advanceBugs();
    if (movement.playerHits) {
      messages.push(movement.playerHits > 1 ? `${movement.playerHits} bugs crashed into you.` : 'A bug slammed into you.');
    }
    if (movement.coreLeaks) {
      messages.push(movement.coreLeaks > 1 ? `${movement.coreLeaks} bugs leaked through.` : 'A bug leaked through the core.');
    }

    const spawns = this._spawnWarnings();
    if (spawns.playerHits) {
      messages.push(spawns.playerHits > 1 ? `${spawns.playerHits} spawn points detonated on you.` : 'A spawn point opened under you.');
    }

    if (state.integrity <= 0) {
      this._finishRun('The lane pressure broke the core before you could route it back out.');
      return;
    }

    state.warnings = this._rollWarnings();
    if (!messages.length) {
      messages.push(action === 'wait' ? 'You held the charge and watched the lanes.' : 'The route extended.');
    }
    state.lastEvent = messages.join(' ');
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

  _pulse() {
    const state = this._state;
    const affected = new Set(state.trail);
    const relayCount = state.activatedRelays.length;

    state.activatedRelays.forEach(relay => {
      const { x, y } = coordOf(relay);
      for (let xx = 0; xx < SIZE; xx++) {
        const index = indexOf(xx, y);
        if (!BLOCK_SET.has(index)) affected.add(index);
      }
      for (let yy = 0; yy < SIZE; yy++) {
        const index = indexOf(x, yy);
        if (!BLOCK_SET.has(index)) affected.add(index);
      }
    });

    const before = state.bugs.length;
    state.bugs = state.bugs.filter(bug => !affected.has(bug.pos));
    const kills = before - state.bugs.length;
    const points = kills
      ? kills * 14 + state.trail.length + relayCount * 8 + (kills > 1 ? kills * kills * 2 : 0)
      : 0;

    state.trail = [];
    state.activatedRelays = [];

    return { kills, relays: relayCount, points };
  },

  _advanceBugs() {
    const state = this._state;
    const moved = [];
    let playerHits = 0;
    let coreLeaks = 0;

    for (const bug of state.bugs) {
      const next = this._nextBugPos(bug);
      if (next === CORE) {
        coreLeaks += 1;
        continue;
      }

      if (next === state.player) {
        playerHits += 1;
        continue;
      }

      moved.push({ ...bug, pos: next });
    }

    state.bugs = moved;
    if (playerHits || coreLeaks) {
      state.integrity -= playerHits + coreLeaks;
      state.player = CORE;
      state.trail = [];
      state.activatedRelays = [];
    }

    return { playerHits, coreLeaks };
  },

  _spawnWarnings() {
    const state = this._state;
    let playerHits = 0;

    state.warnings.forEach(warning => {
      if (warning.pos === state.player) {
        playerHits += 1;
        return;
      }

      state.bugs.push({
        id: state.nextBugId++,
        pos: warning.pos,
        bias: warning.bias,
      });
    });

    state.warnings = [];

    if (playerHits) {
      state.integrity -= playerHits;
      state.player = CORE;
      state.trail = [];
      state.activatedRelays = [];
    }

    return { playerHits };
  },

  _rollWarnings() {
    const state = this._state;
    const count = this._warningCount();
    const blocked = new Set([
      state.player,
      ...state.bugs.map(bug => bug.pos),
      ...state.warnings.map(warning => warning.pos),
    ]);

    const candidates = shuffle(EDGE_CELLS.filter(index => !blocked.has(index)));
    const chosen = [];

    for (const pos of candidates) {
      if (chosen.length >= count) break;
      chosen.push({ pos, bias: warningBias(pos) });
    }

    if (!chosen.length) return [];

    return chosen;
  },

  _warningCount() {
    const turn = this._state.turn;
    if (turn < 8) return 1;
    if (turn < 18) return Math.random() < 0.24 ? 2 : 1;
    if (turn < 32) return Math.random() < 0.58 ? 2 : 1;
    return Math.random() < 0.28 ? 3 : 2;
  },

  _consumeBugsAt(pos) {
    const state = this._state;
    const before = state.bugs.length;
    state.bugs = state.bugs.filter(bug => bug.pos !== pos);
    return before - state.bugs.length;
  },

  _nextBugPos(bug) {
    const { x, y } = coordOf(bug.pos);
    const candidates = [];

    for (const dir of DIR_ORDER) {
      const nx = x + DIRS[dir].dx;
      const ny = y + DIRS[dir].dy;
      if (!inBounds(nx, ny)) continue;

      const next = indexOf(nx, ny);
      if (BLOCK_SET.has(next)) continue;
      candidates.push({ dir, next, dist: DISTANCE[next] });
    }

    const bestDist = Math.min(...candidates.map(option => option.dist));
    const best = candidates.filter(option => option.dist === bestDist);
    const pref = this._preferredDirs(bug.pos, bug.bias);
    best.sort((a, b) => pref.indexOf(a.dir) - pref.indexOf(b.dir));
    return best[0]?.next ?? bug.pos;
  },

  _preferredDirs(index, bias) {
    const { x, y } = coordOf(index);
    const towardX = x < CORE_X ? 'right' : x > CORE_X ? 'left' : null;
    const towardY = y < CORE_Y ? 'down' : y > CORE_Y ? 'up' : null;
    const primary = bias === 'h' ? [towardX, towardY] : [towardY, towardX];
    return [...primary, ...DIR_ORDER].filter(Boolean);
  },

  _stepPlayer(index, dir) {
    const { x, y } = coordOf(index);
    const nx = x + DIRS[dir].dx;
    const ny = y + DIRS[dir].dy;
    if (!inBounds(nx, ny)) return null;
    const next = indexOf(nx, ny);
    if (BLOCK_SET.has(next)) return null;
    return next;
  },

  _tapAction(index) {
    if (!this._state || this._state.status !== 'playing') return null;
    if (BLOCK_SET.has(index)) return null;
    if (index === this._state.player) return 'wait';

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

  _keyToAction(key) {
    const lower = key.toLowerCase();
    if (lower === 'arrowup' || lower === 'w') return 'up';
    if (lower === 'arrowright' || lower === 'd') return 'right';
    if (lower === 'arrowdown' || lower === 's') return 'down';
    if (lower === 'arrowleft' || lower === 'a') return 'left';
    if (lower === ' ' || lower === 'spacebar' || lower === 'enter') return 'wait';
    return null;
  },

  _measureCell() {
    const byWidth = Math.floor((window.innerWidth - 48) / SIZE);
    const byHeight = Math.floor((window.innerHeight - 410) / SIZE);
    return Math.max(36, Math.min(58, byWidth, byHeight));
  },

  _save() {
    if (this._state) this._storage.set('state', this._state);
  },
};

export default Pulsepath;
