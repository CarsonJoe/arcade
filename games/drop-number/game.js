const COLS = 5;
const ROWS = 8;
const DANGER_ROW = 2;
const STORAGE_KEY = 'v4state';
const BEST_KEY = 'best';
const GRAVITY_MS = 190;
const MERGE_TEASE_MS = 150;
const MERGE_POP_MS = 250;

const PALETTE = [
  { bg: 'linear-gradient(135deg,#155e75 0%,#0f766e 100%)', fg: '#ecfeff', glow: 'rgba(34,211,238,.24)' },
  { bg: 'linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)', fg: '#eff6ff', glow: 'rgba(96,165,250,.25)' },
  { bg: 'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)', fg: '#f5f3ff', glow: 'rgba(167,139,250,.26)' },
  { bg: 'linear-gradient(135deg,#c026d3 0%,#a21caf 100%)', fg: '#fdf4ff', glow: 'rgba(232,121,249,.28)' },
  { bg: 'linear-gradient(135deg,#dc2626 0%,#ea580c 100%)', fg: '#fff7ed', glow: 'rgba(251,146,60,.30)' },
  { bg: 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)', fg: '#1c1917', glow: 'rgba(251,191,36,.34)' },
  { bg: 'linear-gradient(135deg,#facc15 0%,#f59e0b 100%)', fg: '#1c1917', glow: 'rgba(250,204,21,.38)' },
  { bg: 'linear-gradient(135deg,#84cc16 0%,#16a34a 100%)', fg: '#052e16', glow: 'rgba(163,230,53,.34)' },
  { bg: 'linear-gradient(135deg,#06b6d4 0%,#14b8a6 100%)', fg: '#042f2e', glow: 'rgba(34,211,238,.32)' },
  { bg: 'linear-gradient(135deg,#eab308 0%,#facc15 55%,#f97316 100%)', fg: '#1c1917', glow: 'rgba(251,191,36,.42)' },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pal(value) {
  const index = Math.max(0, Math.floor(Math.log2(value)) - 1);
  return PALETTE[Math.min(index, PALETTE.length - 1)];
}

function rand() {
  const roll = Math.random();
  if (roll < 0.52) return 2;
  if (roll < 0.82) return 4;
  if (roll < 0.95) return 8;
  return 16;
}

function fmt(value) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}m`;
  if (value >= 10_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function mergeValue(base, count) {
  return (base * base) * (2 ** Math.max(0, count - 2));
}

let cssReady = false;
function injectCSS() {
  if (cssReady) return;
  cssReady = true;

  const style = document.createElement('style');
  style.textContent = `
.dm {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  color: #f8fafc;
  background:
    radial-gradient(circle at 18% 8%, rgba(56,189,248,.18), transparent 34%),
    radial-gradient(circle at 82% 16%, rgba(249,115,22,.18), transparent 32%),
    linear-gradient(180deg, #07111f 0%, #0b1324 45%, #111827 100%);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif;
  overflow: hidden;
  -webkit-user-select: none;
  user-select: none;
}

.dm::before,
.dm::after {
  content: '';
  position: absolute;
  inset: auto;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  filter: blur(40px);
  opacity: .24;
  pointer-events: none;
}

.dm::before {
  top: 90px;
  left: -90px;
  background: rgba(14,165,233,.45);
}

.dm::after {
  right: -80px;
  bottom: 110px;
  background: rgba(249,115,22,.35);
}

.dm-hdr {
  position: relative;
  z-index: 1;
  padding:
    calc(env(safe-area-inset-top, 24px) + 14px)
    max(18px, env(safe-area-inset-right, 0px))
    8px
    max(18px, env(safe-area-inset-left, 0px));
}

.dm-kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: rgba(226,232,240,.58);
}

.dm-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-top: 8px;
}

.dm-title {
  font-size: 33px;
  line-height: .98;
  letter-spacing: -.05em;
  font-weight: 900;
}

.dm-sub {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.45;
  color: rgba(226,232,240,.72);
  max-width: 240px;
}

.dm-next-card {
  min-width: 84px;
  padding: 10px 10px 12px;
  border-radius: 18px;
  background: rgba(15,23,42,.68);
  border: 1px solid rgba(148,163,184,.18);
  box-shadow: 0 18px 40px rgba(2,6,23,.28);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.dm-next-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(226,232,240,.56);
  text-align: center;
}

.dm-next-tile {
  margin: 10px auto 0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.24),
    0 16px 30px rgba(2,6,23,.24);
}

.dm-stats {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 10px max(18px, env(safe-area-inset-right, 0px)) 0 max(18px, env(safe-area-inset-left, 0px));
}

.dm-stat {
  padding: 12px 14px 14px;
  border-radius: 18px;
  background: rgba(15,23,42,.56);
  border: 1px solid rgba(148,163,184,.14);
  box-shadow: 0 12px 28px rgba(2,6,23,.22);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.dm-stat-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(226,232,240,.54);
}

.dm-stat-val {
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
  letter-spacing: -.06em;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.dm-tip {
  position: relative;
  z-index: 1;
  margin: 14px 18px 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(8,15,28,.56);
  border: 1px solid rgba(125,211,252,.14);
  color: rgba(226,232,240,.78);
  font-size: 13px;
  text-align: center;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dm-board-wrap {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px max(12px, env(safe-area-inset-left, 0px))
    calc(env(safe-area-inset-bottom, 0px) + 18px)
    max(12px, env(safe-area-inset-right, 0px));
}

.dm-stage {
  position: relative;
  touch-action: none;
}

.dm-stage.instant-preview .dm-preview,
.dm-stage.instant-preview .dm-col-beam {
  transition: none !important;
}

.dm-grid-backdrop,
.dm-tile-layer {
  position: absolute;
  left: 0;
}

.dm-grid-backdrop {
  display: grid;
}

.dm-slot {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.01)),
    rgba(15,23,42,.72);
  border: 1px solid rgba(148,163,184,.11);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    inset 0 -8px 18px rgba(2,6,23,.12);
}

.dm-slot::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,.04), transparent 40%);
  pointer-events: none;
}

.dm-slot.danger-line {
  box-shadow:
    inset 0 2px 0 rgba(248,113,113,.45),
    inset 0 1px 0 rgba(255,255,255,.06),
    inset 0 -8px 18px rgba(2,6,23,.12);
}

.dm-col-beam {
  position: absolute;
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(125,211,252,.18) 0%, rgba(125,211,252,.07) 30%, rgba(249,115,22,.08) 100%);
  border: 1px solid rgba(125,211,252,.12);
  opacity: .95;
  transform-origin: top center;
  transition: transform 120ms ease-out, opacity 120ms ease-out;
  pointer-events: none;
}

.dm-col-beam.invalid {
  opacity: .32;
}

.dm-tile-layer {
  pointer-events: none;
}

.dm-tile,
.dm-preview {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-weight: 900;
  letter-spacing: -.05em;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.28),
    0 16px 32px rgba(2,6,23,.30);
  text-shadow: 0 1px 0 rgba(255,255,255,.12);
  will-change: transform, opacity;
}

.dm-tile {
  transition:
    transform 190ms cubic-bezier(.2,.92,.25,1),
    opacity 150ms ease-out,
    filter 150ms ease-out;
}

.dm-tile-layer.instant .dm-tile {
  transition: none !important;
}

.dm-preview {
  z-index: 4;
  transition:
    transform 120ms cubic-bezier(.22,.86,.34,1),
    opacity 120ms ease-out,
    filter 120ms ease-out;
}

.dm-preview.aiming {
  filter: brightness(1.06);
}

.dm-preview.hidden {
  opacity: 0;
}

.dm-preview.invalid {
  opacity: .58;
  filter: saturate(.7);
}

.dm-preview.shake {
  animation: dmShake .24s linear;
}

.dm-tile.removing {
  opacity: 0;
  transform: translate(var(--tx), var(--ty)) scale(.72);
}

.dm-tile.merging {
  animation: dmSourcePulse 150ms ease-out forwards;
}

.dm-tile.anchor-merge {
  animation: dmAnchorFlash 220ms ease-out;
}

.dm-tile.result-pop {
  animation: dmResultPop 250ms cubic-bezier(.19,1,.22,1);
}

.dm-tile.landed {
  animation: dmLand 180ms ease-out;
}

.dm-burst {
  position: absolute;
  width: 22px;
  height: 22px;
  margin-left: -11px;
  margin-top: -11px;
  border-radius: 999px;
  pointer-events: none;
  animation: dmBurst 440ms ease-out forwards;
}

.dm-over {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2,6,23,.64);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.dm-over-card {
  width: min(340px, calc(100% - 36px));
  padding: 24px 22px 22px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(15,23,42,.96), rgba(15,23,42,.88)),
    rgba(15,23,42,.92);
  border: 1px solid rgba(148,163,184,.18);
  box-shadow: 0 28px 70px rgba(2,6,23,.45);
  text-align: center;
}

.dm-over-emoji {
  font-size: 50px;
}

.dm-over-title {
  margin-top: 10px;
  font-size: 32px;
  line-height: 1;
  letter-spacing: -.05em;
  font-weight: 900;
}

.dm-over-copy {
  margin-top: 10px;
  color: rgba(226,232,240,.72);
  line-height: 1.45;
  font-size: 15px;
}

.dm-over-score {
  margin-top: 18px;
  font-size: 15px;
  color: rgba(226,232,240,.84);
}

.dm-over-best {
  margin-top: 8px;
  font-size: 14px;
  color: rgba(251,191,36,.90);
}

.dm-again {
  margin-top: 20px;
  width: 100%;
  height: 54px;
  border: none;
  border-radius: 18px;
  font: inherit;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -.02em;
  color: #fff7ed;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  box-shadow: 0 18px 34px rgba(249,115,22,.28);
}

.dm-again:active {
  transform: scale(.98);
}

@keyframes dmShake {
  20% { transform: translate(calc(var(--px) - 8px), var(--py)); }
  40% { transform: translate(calc(var(--px) + 7px), var(--py)); }
  60% { transform: translate(calc(var(--px) - 5px), var(--py)); }
  80% { transform: translate(calc(var(--px) + 3px), var(--py)); }
}

@keyframes dmSourcePulse {
  0%   { filter: brightness(1); transform: translate(var(--tx), var(--ty)) scale(1); }
  55%  { filter: brightness(1.28); transform: translate(var(--tx), var(--ty)) scale(1.08); }
  100% { filter: brightness(1); transform: translate(var(--tx), var(--ty)) scale(.96); }
}

@keyframes dmAnchorFlash {
  0%   { filter: brightness(1); }
  45%  { filter: brightness(1.45); }
  100% { filter: brightness(1); }
}

@keyframes dmResultPop {
  0%   { transform: translate(var(--tx), var(--ty)) scale(.88); }
  55%  { transform: translate(var(--tx), var(--ty)) scale(1.16); }
  100% { transform: translate(var(--tx), var(--ty)) scale(1); }
}

@keyframes dmLand {
  0%   { transform: translate(var(--tx), var(--ty)) scale(.92); }
  65%  { transform: translate(var(--tx), var(--ty)) scale(1.08); }
  100% { transform: translate(var(--tx), var(--ty)) scale(1); }
}

@keyframes dmBurst {
  0%   { opacity: .75; transform: scale(.2); }
  70%  { opacity: .24; transform: scale(5.6); }
  100% { opacity: 0; transform: scale(7); }
}
`;
  document.head.appendChild(style);
}

const DropMerge = {
  _el: null,
  _storage: null,
  _state: null,
  _stableSnapshot: null,
  _tileEls: null,
  _cellEls: null,
  _layout: null,
  _stage: null,
  _tileLayer: null,
  _previewEl: null,
  _beamEl: null,
  _scoreEl: null,
  _bestEl: null,
  _nextEl: null,
  _nextTileEl: null,
  _overEl: null,
  _keyHandler: null,
  _resizeHandler: null,
  _resizeFrame: 0,
  _runSeq: 0,
  _nextTileId: 1,
  _busy: false,
  _aiming: false,
  _pointerId: null,
  _timeouts: null,
  _newBestRun: false,

  async init(container, storage) {
    injectCSS();
    this._storage = storage;
    this._tileEls = new Map();
    this._cellEls = [];
    this._timeouts = new Set();
    this._newBestRun = false;
    this._state = this._loadState() ?? this._fresh();
    this._normalizeCurrent();

    this._el = document.createElement('div');
    this._el.className = 'dm';
    container.appendChild(this._el);

    this._keyHandler = event => {
      if (this._state?.status !== 'playing' || this._busy || !this._state.current) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this._stepCurrent(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        this._stepCurrent(1);
      } else if (event.key === 'ArrowDown' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this._dropCurrent();
      }
    };

    this._resizeHandler = () => {
      if (this._busy || !this._el) return;
      cancelAnimationFrame(this._resizeFrame);
      this._resizeFrame = requestAnimationFrame(() => {
        if (!this._busy && this._el) this._build();
      });
    };

    document.addEventListener('keydown', this._keyHandler);
    window.addEventListener('resize', this._resizeHandler);

    this._build();
    this._commitStableState();
  },

  destroy() {
    this._runSeq++;
    this._busy = false;
    this._clearTimers();
    cancelAnimationFrame(this._resizeFrame);
    document.removeEventListener('keydown', this._keyHandler);
    window.removeEventListener('resize', this._resizeHandler);
    this._saveStableSnapshot();
    this._el?.remove();
    this._el = null;
  },

  pause() {
    this._saveStableSnapshot();
  },

  resume() {},

  _fresh() {
    const center = Math.floor(COLS / 2);
    return {
      grid: new Array(ROWS * COLS).fill(null),
      score: 0,
      current: { value: rand(), col: center },
      next: rand(),
      lastCol: center,
      status: 'playing',
    };
  },

  _loadState() {
    const saved = this._storage.get(STORAGE_KEY);
    if (!saved || !Array.isArray(saved.grid) || saved.grid.length !== ROWS * COLS) return null;

    const grid = saved.grid.map(value => (
      value ? { id: this._nextTileId++, value } : null
    ));

    return {
      grid,
      score: Number(saved.score) || 0,
      current: saved.current?.value
        ? {
            value: saved.current.value,
            col: clamp(Number(saved.current.col) || Math.floor(COLS / 2), 0, COLS - 1),
          }
        : { value: rand(), col: Math.floor(COLS / 2) },
      next: saved.next || rand(),
      lastCol: clamp(Number(saved.lastCol) || Math.floor(COLS / 2), 0, COLS - 1),
      status: saved.status === 'over' ? 'over' : 'playing',
    };
  },

  _serializeState() {
    return {
      grid: this._state.grid.map(tile => tile?.value ?? 0),
      score: this._state.score,
      current: this._state.current
        ? { value: this._state.current.value, col: this._state.current.col }
        : null,
      next: this._state.next,
      lastCol: this._state.lastCol,
      status: this._state.status,
    };
  },

  _commitStableState() {
    this._stableSnapshot = this._serializeState();
    this._storage.set(STORAGE_KEY, this._stableSnapshot);
  },

  _saveStableSnapshot() {
    this._storage.set(STORAGE_KEY, this._stableSnapshot ?? this._serializeState());
  },

  _normalizeCurrent() {
    if (this._state.status !== 'playing') {
      this._state.current = null;
      return;
    }

    const preferred = this._state.current?.col ?? this._state.lastCol ?? Math.floor(COLS / 2);
    const spawnCol = this._pickSpawnColumn(preferred);
    if (spawnCol == null) {
      this._state.status = 'over';
      this._state.current = null;
      return;
    }

    if (!this._state.current) this._state.current = { value: rand(), col: spawnCol };
    this._state.current.col = spawnCol;
  },

  _build() {
    this._runSeq++;
    this._busy = false;
    this._aiming = false;
    this._pointerId = null;
    this._clearTimers();
    this._tileEls = new Map();
    this._cellEls = [];
    this._layout = this._computeLayout();

    const { cs, gap, gridW, gridH, previewOffset, stageH, fontSize } = this._layout;
    const best = this._storage.get(BEST_KEY) ?? 0;

    this._el.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'dm-hdr';
    header.innerHTML = `
      <div class="dm-kicker">Drop & Merge</div>
      <div class="dm-title-row">
        <div>
          <div class="dm-title">Hold, aim,<br>release.</div>
          <div class="dm-sub">Drag your finger across the columns, then lift to fire the tile straight down.</div>
        </div>
        <div class="dm-next-card">
          <div class="dm-next-lbl">Next</div>
          <div class="dm-next-tile" id="dm-next-tile"></div>
        </div>
      </div>`;
    this._el.appendChild(header);

    const stats = document.createElement('div');
    stats.className = 'dm-stats';
    stats.innerHTML = `
      <div class="dm-stat">
        <div class="dm-stat-lbl">Best</div>
        <div class="dm-stat-val" id="dm-best"></div>
      </div>
      <div class="dm-stat">
        <div class="dm-stat-lbl">Score</div>
        <div class="dm-stat-val" id="dm-score"></div>
      </div>`;
    this._el.appendChild(stats);

    const tip = document.createElement('div');
    tip.className = 'dm-tip';
    tip.textContent = 'Merge clusters around the latest drop. Big groups square the number and scale it up.';
    this._el.appendChild(tip);

    const wrap = document.createElement('div');
    wrap.className = 'dm-board-wrap';

    const stage = document.createElement('div');
    stage.className = 'dm-stage';
    stage.style.width = `${gridW}px`;
    stage.style.height = `${stageH}px`;
    this._stage = stage;

    const beam = document.createElement('div');
    beam.className = 'dm-col-beam';
    beam.style.top = `${previewOffset}px`;
    beam.style.width = `${cs}px`;
    beam.style.height = `${gridH}px`;
    this._beamEl = beam;
    stage.appendChild(beam);

    const backdrop = document.createElement('div');
    backdrop.className = 'dm-grid-backdrop';
    backdrop.style.top = `${previewOffset}px`;
    backdrop.style.width = `${gridW}px`;
    backdrop.style.height = `${gridH}px`;
    backdrop.style.gridTemplateColumns = `repeat(${COLS}, ${cs}px)`;
    backdrop.style.gridTemplateRows = `repeat(${ROWS}, ${cs}px)`;
    backdrop.style.gap = `${gap}px`;
    stage.appendChild(backdrop);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const slot = document.createElement('div');
        slot.className = 'dm-slot';
        if (row === DANGER_ROW + 1) slot.classList.add('danger-line');
        backdrop.appendChild(slot);
        this._cellEls.push(slot);
      }
    }

    const tileLayer = document.createElement('div');
    tileLayer.className = 'dm-tile-layer';
    tileLayer.style.top = `${previewOffset}px`;
    tileLayer.style.width = `${gridW}px`;
    tileLayer.style.height = `${gridH}px`;
    this._tileLayer = tileLayer;
    stage.appendChild(tileLayer);

    const preview = document.createElement('div');
    preview.className = 'dm-preview';
    preview.style.width = `${cs}px`;
    preview.style.height = `${cs}px`;
    preview.style.fontSize = `${fontSize}px`;
    this._previewEl = preview;
    stage.appendChild(preview);

    stage.addEventListener('pointerdown', event => this._onPointerDown(event));
    stage.addEventListener('pointermove', event => this._onPointerMove(event));
    stage.addEventListener('pointerup', event => this._onPointerUp(event));
    stage.addEventListener('pointercancel', event => this._onPointerCancel(event));

    wrap.appendChild(stage);
    this._el.appendChild(wrap);

    this._scoreEl = stats.querySelector('#dm-score');
    this._bestEl = stats.querySelector('#dm-best');
    this._nextTileEl = header.querySelector('#dm-next-tile');

    this._scoreEl.textContent = this._state.score;
    this._bestEl.textContent = best;

    this._renderNext();
    this._syncTiles({ instant: true });
    this._updatePreview(true);

    if (this._state.status === 'over') this._showOver();
  },

  _computeLayout() {
    const gap = 8;
    const widthCap = Math.min(window.innerWidth, 460);
    const horizontalPad = 34;
    const headerFootprint = 244;
    const availableHeight = Math.max(360, window.innerHeight - headerFootprint);
    const cellByWidth = Math.floor((widthCap - horizontalPad - gap * (COLS - 1)) / COLS);
    const cellByHeight = Math.floor((availableHeight - 92 - gap * (ROWS - 1)) / ROWS);
    const cs = clamp(Math.min(cellByWidth, cellByHeight, 78), 44, 78);
    const previewOffset = cs + 22;
    const step = cs + gap;
    const gridW = COLS * cs + gap * (COLS - 1);
    const gridH = ROWS * cs + gap * (ROWS - 1);
    const stageH = previewOffset + gridH;
    const fontSize = Math.max(14, Math.floor(cs * 0.33));
    return { cs, gap, step, gridW, gridH, stageH, previewOffset, fontSize };
  },

  _renderNext() {
    if (!this._nextTileEl) return;
    const { cs } = this._layout;
    const tone = pal(this._state.next);
    const size = Math.max(52, Math.floor(cs * 1.08));
    this._nextTileEl.style.width = `${size}px`;
    this._nextTileEl.style.height = `${size}px`;
    this._nextTileEl.style.fontSize = `${Math.max(14, Math.floor(size * 0.34))}px`;
    this._nextTileEl.style.background = tone.bg;
    this._nextTileEl.style.color = tone.fg;
    this._nextTileEl.textContent = fmt(this._state.next);
  },

  _updateHeader() {
    if (this._scoreEl) this._scoreEl.textContent = this._state.score;

    const best = this._storage.get(BEST_KEY) ?? 0;
    if (this._state.score > best) {
      this._newBestRun = true;
      this._storage.set(BEST_KEY, this._state.score);
      if (this._bestEl) this._bestEl.textContent = this._state.score;
    } else if (this._bestEl) {
      this._bestEl.textContent = best;
    }

    this._renderNext();
  },

  _onPointerDown(event) {
    if (this._state?.status !== 'playing' || this._busy || !this._state.current) return;
    if (this._pointerId !== null) return;

    this._pointerId = event.pointerId;
    this._aiming = true;
    this._stage?.setPointerCapture?.(event.pointerId);
    this._moveCurrentToX(event.clientX);
    this._updatePreview();
    event.preventDefault();
  },

  _onPointerMove(event) {
    if (event.pointerId !== this._pointerId || !this._aiming || !this._state.current) return;
    this._moveCurrentToX(event.clientX);
    event.preventDefault();
  },

  _onPointerUp(event) {
    if (event.pointerId !== this._pointerId) return;
    this._stage?.releasePointerCapture?.(event.pointerId);
    this._pointerId = null;
    this._aiming = false;
    this._updatePreview();
    event.preventDefault();
    this._dropCurrent();
  },

  _onPointerCancel(event) {
    if (event.pointerId !== this._pointerId) return;
    this._pointerId = null;
    this._aiming = false;
    this._updatePreview();
  },

  _moveCurrentToX(clientX) {
    if (!this._state.current || !this._stage) return;
    const rect = this._stage.getBoundingClientRect();
    const localX = clamp(clientX - rect.left, 0, rect.width - 1);
    const col = clamp(
      Math.round((localX - this._layout.cs / 2) / this._layout.step),
      0,
      COLS - 1,
    );
    if (this._state.current.col !== col) {
      this._state.current.col = col;
      try { navigator.vibrate?.(6); } catch {}
      this._updatePreview();
    }
  },

  _stepCurrent(delta) {
    if (!this._state.current) return;
    const nextCol = clamp(this._state.current.col + delta, 0, COLS - 1);
    if (nextCol === this._state.current.col) return;
    this._state.current.col = nextCol;
    this._updatePreview();
    try { navigator.vibrate?.(6); } catch {}
  },

  _updatePreview(instant = false) {
    if (!this._previewEl || !this._beamEl || !this._stage) return;

    const current = this._state.current;
    if (!current || this._state.status !== 'playing') {
      this._previewEl.classList.add('hidden');
      this._beamEl.style.opacity = '0';
      return;
    }

    if (instant) this._stage.classList.add('instant-preview');

    const tone = pal(current.value);
    const valid = this._findLandingRow(current.col) !== -1;
    const x = this._xForCol(current.col);

    this._previewEl.style.transition = '';
    this._previewEl.classList.remove('hidden', 'shake');
    this._previewEl.classList.toggle('aiming', this._aiming);
    this._previewEl.classList.toggle('invalid', !valid);
    this._previewEl.style.background = tone.bg;
    this._previewEl.style.color = tone.fg;
    this._previewEl.style.transform = `translate(${x}px, 0px)`;
    this._previewEl.style.setProperty('--px', `${x}px`);
    this._previewEl.style.setProperty('--py', '0px');
    this._previewEl.textContent = fmt(current.value);
    this._previewEl.style.opacity = this._busy ? '0' : '';

    this._beamEl.classList.toggle('invalid', !valid);
    this._beamEl.style.opacity = this._busy ? '0' : '';
    this._beamEl.style.transform = `translateX(${x}px)`;

    if (instant) {
      requestAnimationFrame(() => {
        this._stage?.classList.remove('instant-preview');
      });
    }
  },

  async _dropCurrent() {
    if (this._busy || this._state.status !== 'playing' || !this._state.current) return;

    const token = this._runSeq;
    const col = this._state.current.col;
    const row = this._findLandingRow(col);
    if (row === -1) {
      this._shakePreview();
      return;
    }

    this._busy = true;
    this._aiming = false;
    this._pointerId = null;

    const dropValue = this._state.current.value;
    const x = this._xForCol(col);
    const y = this._layout.previewOffset + this._yForRow(row);
    const duration = 170 + row * 55;

    this._previewEl.classList.remove('aiming', 'invalid', 'hidden');
    this._previewEl.style.transition =
      `transform ${duration}ms cubic-bezier(.18,.88,.22,1), opacity 120ms ease-out, filter 120ms ease-out`;
    this._previewEl.style.transform = `translate(${x}px, ${y}px)`;
    this._previewEl.style.setProperty('--px', `${x}px`);
    this._previewEl.style.setProperty('--py', `${y}px`);
    this._beamEl.style.opacity = '0';

    const landed = await this._sleep(duration + 24, token);
    if (!landed) return;

    const tile = { id: this._nextTileId++, value: dropValue };
    this._state.grid[row * COLS + col] = tile;
    this._state.lastCol = col;
    this._state.current = null;

    this._previewEl.classList.add('hidden');
    this._syncTiles({ instant: true });
    this._pulseTile(tile.id, 'landed', 180);
    this._spawnBurst(col, row, pal(dropValue).glow);
    try { navigator.vibrate?.(10); } catch {}

    const resolved = await this._resolveFrom(tile.id, token);
    if (!resolved) return;

    if (this._checkDanger()) {
      this._over();
      return;
    }

    const spawnCol = this._pickSpawnColumn(this._state.lastCol);
    if (spawnCol == null) {
      this._over();
      return;
    }

    this._state.current = { value: this._state.next, col: spawnCol };
    this._state.next = rand();
    this._busy = false;
    this._updateHeader();
    this._updatePreview(true);
    this._commitStableState();
  },

  async _resolveFrom(anchorId, token) {
    while (token === this._runSeq) {
      const moved = this._compactGrid();
      if (moved) {
        this._syncTiles();
        const settled = await this._sleep(GRAVITY_MS, token);
        if (!settled) return false;
      }

      const anchor = this._findTile(anchorId);
      if (!anchor) return true;

      const cluster = this._collectCluster(anchor.row, anchor.col, anchor.tile.value);
      if (cluster.length < 2) return true;

      for (const part of cluster) {
        this._pulseTile(part.tile.id, part.tile.id === anchorId ? 'anchor-merge' : 'merging', 180);
      }

      try { navigator.vibrate?.([8, 24, 8]); } catch {}
      const primed = await this._sleep(MERGE_TEASE_MS, token);
      if (!primed) return false;

      const removedIds = [];
      for (const part of cluster) {
        if (part.tile.id === anchorId) continue;
        this._state.grid[part.row * COLS + part.col] = null;
        removedIds.push(part.tile.id);
      }

      anchor.tile.value = mergeValue(anchor.tile.value, cluster.length);
      this._state.score += anchor.tile.value;
      this._state.lastCol = anchor.col;
      this._updateHeader();
      this._syncTiles({ removingIds: removedIds });
      this._pulseTile(anchorId, 'result-pop', MERGE_POP_MS);
      this._spawnBurst(anchor.col, anchor.row, pal(anchor.tile.value).glow);

      const popped = await this._sleep(MERGE_POP_MS, token);
      if (!popped) return false;
    }

    return false;
  },

  _compactGrid() {
    let changed = false;

    for (let col = 0; col < COLS; col++) {
      const stack = [];
      for (let row = ROWS - 1; row >= 0; row--) {
        const tile = this._state.grid[row * COLS + col];
        if (tile) stack.push(tile);
      }

      for (let row = ROWS - 1, index = 0; row >= 0; row--) {
        const nextTile = index < stack.length ? stack[index++] : null;
        const cellIndex = row * COLS + col;
        if (this._state.grid[cellIndex] !== nextTile) {
          this._state.grid[cellIndex] = nextTile;
          changed = true;
        }
      }
    }

    return changed;
  },

  _collectCluster(startRow, startCol, target) {
    const queue = [[startRow, startCol]];
    const seen = new Set([`${startRow},${startCol}`]);
    const parts = [];

    while (queue.length) {
      const [row, col] = queue.shift();
      const tile = this._state.grid[row * COLS + col];
      if (!tile || tile.value !== target) continue;
      parts.push({ row, col, tile });

      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (const [nextRow, nextCol] of neighbors) {
        if (nextRow < 0 || nextRow >= ROWS || nextCol < 0 || nextCol >= COLS) continue;
        const key = `${nextRow},${nextCol}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const nextTile = this._state.grid[nextRow * COLS + nextCol];
        if (nextTile?.value === target) queue.push([nextRow, nextCol]);
      }
    }

    return parts;
  },

  _findTile(id) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this._state.grid[row * COLS + col];
        if (tile?.id === id) return { row, col, tile };
      }
    }
    return null;
  },

  _findLandingRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (!this._state.grid[row * COLS + col]) return row;
    }
    return -1;
  },

  _pickSpawnColumn(preferred) {
    const open = [];
    for (let col = 0; col < COLS; col++) {
      if (this._findLandingRow(col) !== -1) open.push(col);
    }
    if (!open.length) return null;

    let best = open[0];
    let bestDistance = Infinity;
    for (const col of open) {
      const distance = Math.abs(col - preferred);
      if (distance < bestDistance) {
        best = col;
        bestDistance = distance;
      }
    }
    return best;
  },

  _checkDanger() {
    for (let row = 0; row <= DANGER_ROW; row++) {
      for (let col = 0; col < COLS; col++) {
        if (this._state.grid[row * COLS + col]) return true;
      }
    }
    return false;
  },

  _syncTiles({ instant = false, removingIds = [] } = {}) {
    if (!this._tileLayer) return;
    if (instant) this._tileLayer.classList.add('instant');

    const seen = new Set();
    const removing = new Set(removingIds);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = this._state.grid[row * COLS + col];
        if (!tile) continue;
        seen.add(tile.id);

        let el = this._tileEls.get(tile.id);
        if (!el) {
          el = document.createElement('div');
          el.className = 'dm-tile';
          el.style.width = `${this._layout.cs}px`;
          el.style.height = `${this._layout.cs}px`;
          this._tileLayer.appendChild(el);
          this._tileEls.set(tile.id, el);
        }

        this._paintTile(el, tile.value);
        this._setTileTransform(el, col, row);
        el.classList.remove('removing');
      }
    }

    for (const [id, el] of [...this._tileEls.entries()]) {
      if (seen.has(id)) continue;
      if (removing.has(id)) {
        el.classList.add('removing');
        this._schedule(() => {
          el.remove();
          this._tileEls.delete(id);
        }, 160);
      } else {
        el.remove();
        this._tileEls.delete(id);
      }
    }

    if (instant) {
      requestAnimationFrame(() => {
        this._tileLayer?.classList.remove('instant');
      });
    }
  },

  _paintTile(el, value) {
    const tone = pal(value);
    el.style.background = tone.bg;
    el.style.color = tone.fg;
    el.style.boxShadow =
      `inset 0 1px 0 rgba(255,255,255,.28), 0 16px 32px rgba(2,6,23,.30), 0 0 0 1px rgba(255,255,255,.08), 0 10px 22px ${tone.glow}`;
    el.style.fontSize = `${this._fontSizeForValue(value)}px`;
    el.textContent = fmt(value);
  },

  _setTileTransform(el, col, row) {
    const x = this._xForCol(col);
    const y = this._yForRow(row);
    el.style.setProperty('--tx', `${x}px`);
    el.style.setProperty('--ty', `${y}px`);
    el.style.transform = `translate(${x}px, ${y}px)`;
  },

  _fontSizeForValue(value) {
    const digits = String(value).length;
    if (digits >= 7) return Math.max(12, Math.floor(this._layout.cs * 0.22));
    if (digits >= 5) return Math.max(13, Math.floor(this._layout.cs * 0.27));
    return Math.max(14, Math.floor(this._layout.cs * 0.33));
  },

  _pulseTile(id, className, ms) {
    const el = this._tileEls.get(id);
    if (!el) return;
    el.classList.remove('merging', 'anchor-merge', 'result-pop', 'landed');
    void el.offsetWidth;
    el.classList.add(className);
    this._schedule(() => {
      el.classList.remove(className);
    }, ms);
  },

  _spawnBurst(col, row, tone) {
    if (!this._stage) return;
    const burst = document.createElement('div');
    burst.className = 'dm-burst';
    burst.style.left = `${this._centerX(col)}px`;
    burst.style.top = `${this._centerY(row)}px`;
    burst.style.background = tone;
    this._stage.appendChild(burst);
    this._schedule(() => burst.remove(), 460);
  },

  _shakePreview() {
    if (!this._previewEl) return;
    const x = this._xForCol(this._state.current?.col ?? 0);
    this._previewEl.classList.remove('shake');
    this._previewEl.style.setProperty('--px', `${x}px`);
    this._previewEl.style.setProperty('--py', '0px');
    void this._previewEl.offsetWidth;
    this._previewEl.classList.add('shake');
    try { navigator.vibrate?.([8, 20, 8]); } catch {}
    this._schedule(() => this._previewEl?.classList.remove('shake'), 260);
  },

  _xForCol(col) {
    return col * this._layout.step;
  },

  _yForRow(row) {
    return row * this._layout.step;
  },

  _centerX(col) {
    return this._xForCol(col) + this._layout.cs / 2;
  },

  _centerY(row) {
    return this._layout.previewOffset + this._yForRow(row) + this._layout.cs / 2;
  },

  _over() {
    if (this._state.status === 'over') return;
    this._busy = false;
    this._state.status = 'over';
    this._state.current = null;
    this._updateHeader();
    this._updatePreview(true);
    this._commitStableState();
    this._showOver();
    try { navigator.vibrate?.([28, 36, 22]); } catch {}
  },

  _showOver() {
    this._overEl?.remove();
    const previousBest = this._storage.get(BEST_KEY) ?? 0;
    const best = Math.max(this._state.score, previousBest);
    this._storage.set(BEST_KEY, best);

    const over = document.createElement('div');
    over.className = 'dm-over';
    over.innerHTML = `
      <div class="dm-over-card">
        <div class="dm-over-emoji">💥</div>
        <div class="dm-over-title">Board Locked</div>
        <div class="dm-over-copy">The stack reached the danger band. Reset and try to build a cleaner merge chain.</div>
        <div class="dm-over-score">Score: <strong>${this._state.score}</strong></div>
        <div class="dm-over-best">${this._newBestRun ? 'New best run.' : `Best: ${best}`}</div>
        <button class="dm-again">Play Again</button>
      </div>`;
    over.querySelector('.dm-again').addEventListener('click', () => {
      this._state = this._fresh();
      this._newBestRun = false;
      this._normalizeCurrent();
      this._build();
      this._commitStableState();
    });
    this._el.appendChild(over);
    this._overEl = over;
  },

  _schedule(fn, ms) {
    const id = setTimeout(() => {
      this._timeouts.delete(id);
      fn();
    }, ms);
    this._timeouts.add(id);
    return id;
  },

  _sleep(ms, token) {
    return new Promise(resolve => {
      const id = setTimeout(() => {
        this._timeouts.delete(id);
        resolve(token === this._runSeq);
      }, ms);
      this._timeouts.add(id);
    });
  },

  _clearTimers() {
    if (!this._timeouts) return;
    for (const id of this._timeouts) clearTimeout(id);
    this._timeouts.clear();
  },
};

export default DropMerge;
