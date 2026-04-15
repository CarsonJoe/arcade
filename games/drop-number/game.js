/**
 * Drop & Merge — Arcade game module
 * Contract: export default { init(container, storage, {onPause}), destroy(), pause(), resume() }
 *
 * Controls: Touch/drag over the board to pick a column, lift to drop.
 *           Or tap any column in the drop zone.
 */

const COLS = 6;
const ROWS = 11;

const PALETTE = [
  { bg: '#264653', fg: '#A8DADC' }, // 2
  { bg: '#2A9D8F', fg: '#fff'    }, // 4
  { bg: '#1B6CA8', fg: '#fff'    }, // 8
  { bg: '#5E2BFF', fg: '#fff'    }, // 16
  { bg: '#8338EC', fg: '#fff'    }, // 32
  { bg: '#C1121F', fg: '#fff'    }, // 64
  { bg: '#E76F51', fg: '#fff'    }, // 128
  { bg: '#F4A261', fg: '#1a1a1a' }, // 256
  { bg: '#E9C46A', fg: '#1a1a1a' }, // 512
  { bg: '#F3D34A', fg: '#1a1a1a' }, // 1024
  { bg: '#FFD700', fg: '#1a1a1a' }, // 2048+
];

function palette(v) {
  const i = Math.min(Math.max(Math.floor(Math.log2(v)) - 1, 0), PALETTE.length - 1);
  return PALETTE[i];
}

function randTile() {
  const r = Math.random();
  if (r < .50) return 2;
  if (r < .80) return 4;
  if (r < .94) return 8;
  return 16;
}

let cssInjected = false;
function injectCSS() {
  if (cssInjected) return;
  cssInjected = true;
  const el = document.createElement('style');
  el.textContent = `
.dn { display:flex; flex-direction:column; height:100%; background:#000;
  font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  user-select:none; -webkit-user-select:none; overflow:hidden; }

.dn-header {
  display:flex; align-items:center; justify-content:space-between;
  padding:calc(env(safe-area-inset-top,44px) + 8px) max(20px,env(safe-area-inset-right,0px)) 10px max(20px,env(safe-area-inset-left,0px));
  background:#111; flex-shrink:0;
}
.dn-sbox { text-align:center; }
.dn-slbl { font-size:10px; font-weight:600; letter-spacing:.5px;
  color:rgba(235,235,245,.4); text-transform:uppercase; }
.dn-sval { font-size:24px; font-weight:800; letter-spacing:-1px; color:#fff;
  font-variant-numeric:tabular-nums; }
.dn-next-wrap { display:flex; flex-direction:column; align-items:center; gap:3px; }
.dn-next-tile { width:40px; height:40px; border-radius:9px; display:flex;
  align-items:center; justify-content:center; font-size:13px; font-weight:800; }

/* Aim row */
.dn-aim {
  display:flex; padding:8px max(14px,env(safe-area-inset-left,0px));
  gap:4px; background:#111; border-bottom:1px solid #222; flex-shrink:0;
}
.dn-aim-col { flex:1; height:52px; border-radius:10px; background:#1C1C1E;
  display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; }
.dn-aim-col.hl { background:#2C2C2E; }
.dn-aim-tile { width:100%; height:100%; border-radius:10px; display:flex;
  align-items:center; justify-content:center; font-size:16px; font-weight:800; pointer-events:none; }
.dn-aim-ghost { position:absolute; bottom:0; left:0; right:0; height:3px;
  background:rgba(255,255,255,.2); border-radius:0 0 10px 10px; }

/* Board */
.dn-board-wrap { flex:1; overflow:hidden; display:flex; align-items:center;
  justify-content:center; padding:10px max(14px,env(safe-area-inset-left,0px)); }
.dn-board { display:grid; }
.dn-cell { border-radius:8px; display:flex; align-items:center;
  justify-content:center; font-weight:800; background:#1C1C1E; }
.dn-cell.pop { animation:pop .2s cubic-bezier(.34,1.56,.64,1); }
@keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }

/* Game over */
.dn-over { position:absolute; inset:0; z-index:20; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:12px;
  background:rgba(0,0,0,.78); backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px); animation:fi .3s; }
@keyframes fi { from{opacity:0} to{opacity:1} }
.dn-over h2 { font-size:36px; font-weight:800; color:#FF453A; letter-spacing:-.5px; }
.dn-over .sub { font-size:16px; color:rgba(235,235,245,.55); }
.dn-over .gold { font-size:14px; color:#FFD60A; }
.dn-restart { margin-top:8px; background:#F97316; color:#fff; border:none;
  padding:14px 42px; border-radius:14px; font-size:17px; font-weight:700;
  cursor:pointer; font-family:inherit; }
.dn-restart:active { opacity:.8; }
`;
  document.head.appendChild(el);
}

// ── Game ─────────────────────────────────────────────────────────────────────
const DropMerge = {
  _el: null, _storage: null, _state: null, _busy: false,

  async init(container, storage, { onPause }) {
    injectCSS();
    this._storage = storage;
    this._onPause = onPause;
    this._el = document.createElement('div');
    this._el.className = 'dn';
    this._el.style.position = 'relative';
    container.appendChild(this._el);

    const saved = storage.get('state');
    if (saved?.status === 'playing') {
      this._state = saved;
    } else {
      this._state = this._fresh();
    }
    this._build();
  },

  destroy() { this._save(); this._el?.remove(); this._el = null; },
  pause()   { this._save(); },
  resume()  {},

  // ── Internal ──────────────────────────────────────────
  _fresh() {
    return { grid: new Array(ROWS * COLS).fill(0), score: 0,
             cur: randTile(), nxt: randTile(), status: 'playing' };
  },

  _save() {
    if (this._state) this._storage.set('state', this._state);
  },

  _build() {
    this._el.innerHTML = '';
    const st = this._state;

    // Measure
    const vw = Math.min(window.innerWidth, 440);
    const hPad = 28;
    const gap = 4;
    const cs = Math.floor((vw - hPad - gap * (COLS - 1)) / COLS);
    this._cs = cs;

    // Header
    const best = this._storage.get('best') ?? 0;
    const { bg: nb, fg: nf } = palette(st.nxt);
    const hdr = document.createElement('div');
    hdr.className = 'dn-header';
    hdr.innerHTML = `
      <div class="dn-sbox">
        <div class="dn-slbl">Best</div>
        <div class="dn-sval" id="dn-best">${best}</div>
      </div>
      <div class="dn-sbox">
        <div class="dn-slbl">Score</div>
        <div class="dn-sval" id="dn-score">${st.score}</div>
      </div>
      <div class="dn-next-wrap">
        <div class="dn-slbl">Next</div>
        <div class="dn-next-tile" id="dn-nxt" style="background:${nb};color:${nf}">${st.nxt}</div>
      </div>`;
    this._el.appendChild(hdr);

    // Aim row
    this._aim = document.createElement('div');
    this._aim.className = 'dn-aim';
    for (let c = 0; c < COLS; c++) {
      const col = document.createElement('div');
      col.className = 'dn-aim-col';
      col.dataset.col = c;
      col.innerHTML = `<div class="dn-aim-ghost"></div>`;
      this._aim.appendChild(col);
    }
    this._el.appendChild(this._aim);
    this._highlightAimCol(Math.floor(COLS / 2));

    // Board
    const wrap = document.createElement('div');
    wrap.className = 'dn-board-wrap';
    const board = document.createElement('div');
    board.className = 'dn-board';
    board.style.cssText = `
      grid-template-columns:repeat(${COLS},${cs}px);
      grid-template-rows:repeat(${ROWS},${cs}px);
      gap:${gap}px;
      font-size:${Math.max(9, Math.floor(cs * 0.34))}px;
    `;
    this._board = board;
    wrap.appendChild(board);
    this._el.appendChild(wrap);

    this._renderBoard();
    this._bindTouch(wrap, board, gap);

    if (st.status === 'over') this._showOver();
  },

  _bindTouch(wrap, board, gap) {
    const cs = this._cs;

    const colFromX = (clientX) => {
      const rect = board.getBoundingClientRect();
      const col = Math.floor((clientX - rect.left) / (cs + gap));
      return Math.max(0, Math.min(COLS - 1, col));
    };

    // Touch on board: drag to aim, lift to drop
    wrap.addEventListener('touchstart', e => {
      if (this._busy || this._state.status !== 'playing') return;
      e.preventDefault();
      const col = colFromX(e.touches[0].clientX);
      this._highlightAimCol(col);
    }, { passive: false });

    wrap.addEventListener('touchmove', e => {
      if (this._busy || this._state.status !== 'playing') return;
      e.preventDefault();
      const col = colFromX(e.touches[0].clientX);
      this._highlightAimCol(col);
    }, { passive: false });

    wrap.addEventListener('touchend', e => {
      if (this._busy || this._state.status !== 'playing') return;
      e.preventDefault();
      const col = colFromX(e.changedTouches[0].clientX);
      this._drop(col);
    }, { passive: false });

    // Aim-row tap: tap once = aim, tap on highlighted = drop
    this._aim.addEventListener('click', e => {
      if (this._busy || this._state.status !== 'playing') return;
      const col = parseInt(e.target.closest('.dn-aim-col')?.dataset?.col ?? -1);
      if (col < 0) return;
      const hlCol = parseInt(this._aim.querySelector('.dn-aim-col.hl')?.dataset?.col ?? -1);
      if (hlCol === col) {
        this._drop(col);
      } else {
        this._highlightAimCol(col);
      }
    });

    // Desktop: click board column to drop
    wrap.addEventListener('click', e => {
      if ('ontouchstart' in window) return;
      if (this._busy || this._state.status !== 'playing') return;
      const col = colFromX(e.clientX);
      this._drop(col);
    });
  },

  _highlightAimCol(col) {
    const st = this._state;
    this._aim.querySelectorAll('.dn-aim-col').forEach((el, i) => {
      el.classList.toggle('hl', i === col);
      el.innerHTML = `<div class="dn-aim-ghost"></div>`;
      if (i === col) {
        const { bg, fg } = palette(st.cur);
        const tile = document.createElement('div');
        tile.className = 'dn-aim-tile';
        tile.style.background = bg;
        tile.style.color = fg;
        tile.textContent = st.cur;
        el.insertBefore(tile, el.firstChild);
      }
    });
    this._activeCol = col;
  },

  _drop(col) {
    const st = this._state;
    if (this._busy || st.status !== 'playing') return;

    // Find landing row
    let landRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!st.grid[r * COLS + col]) { landRow = r; break; }
    }
    if (landRow < 0) { this._gameOver(); return; }

    this._busy = true;
    st.grid[landRow * COLS + col] = st.cur;

    // Merge pass
    const gained = this._mergeCycle();
    st.score += gained;

    // Check top row
    if (Array.from({length: COLS}, (_, c) => st.grid[c]).some(v => v > 0)) {
      this._renderBoard();
      this._gameOver();
      this._busy = false;
      return;
    }

    // Advance
    st.cur = st.nxt;
    st.nxt = randTile();

    this._save();
    this._renderBoard();
    this._updateHeader();

    // Reset aim to column with most free space
    let bestC = 0, bestFree = -1;
    for (let c = 0; c < COLS; c++) {
      const free = Array.from({length: ROWS}, (_, r) => st.grid[r * COLS + c]).filter(v => !v).length;
      if (free > bestFree) { bestFree = free; bestC = c; }
    }
    this._highlightAimCol(bestC);
    this._busy = false;

    try { navigator.vibrate?.(8); } catch {}
  },

  _mergeCycle() {
    let totalGained = 0;
    let merged = true;
    while (merged) {
      this._applyGravity();
      merged = false;
      outer: for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          const v = this._state.grid[r * COLS + c];
          if (!v) continue;
          // Horizontal merge
          if (c + 1 < COLS && this._state.grid[r * COLS + c + 1] === v) {
            this._state.grid[r * COLS + c] = v * 2;
            this._state.grid[r * COLS + c + 1] = 0;
            totalGained += v * 2;
            merged = true; break outer;
          }
          // Vertical merge (same column, one below)
          if (r + 1 < ROWS && this._state.grid[(r + 1) * COLS + c] === v) {
            this._state.grid[(r + 1) * COLS + c] = v * 2;
            this._state.grid[r * COLS + c] = 0;
            totalGained += v * 2;
            merged = true; break outer;
          }
        }
      }
    }
    return totalGained;
  },

  _applyGravity() {
    const g = this._state.grid;
    for (let c = 0; c < COLS; c++) {
      const vals = [];
      for (let r = 0; r < ROWS; r++) if (g[r * COLS + c]) vals.push(g[r * COLS + c]);
      const offset = ROWS - vals.length;
      for (let r = 0; r < ROWS; r++)
        g[r * COLS + c] = r >= offset ? vals[r - offset] : 0;
    }
  },

  _renderBoard() {
    const st = this._state;
    const board = this._board;
    board.innerHTML = '';
    const fs = Math.max(9, Math.floor(this._cs * 0.34));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = st.grid[r * COLS + c];
        const cell = document.createElement('div');
        cell.className = 'dn-cell';
        if (v) {
          const { bg, fg } = palette(v);
          cell.style.cssText = `background:${bg};color:${fg};font-size:${fs}px`;
          cell.textContent = v >= 1000 ? (v >= 10000 ? Math.round(v/1000)+'k' : v) : v;
        }
        board.appendChild(cell);
      }
    }
  },

  _updateHeader() {
    const st = this._state;
    const scoreEl = this._el?.querySelector('#dn-score');
    if (scoreEl) scoreEl.textContent = st.score;

    const prevBest = this._storage.get('best') ?? 0;
    const best = Math.max(st.score, prevBest);
    if (best > prevBest) this._storage.set('best', best);
    const bestEl = this._el?.querySelector('#dn-best');
    if (bestEl) bestEl.textContent = best;

    const nxtEl = this._el?.querySelector('#dn-nxt');
    if (nxtEl) {
      const { bg, fg } = palette(st.nxt);
      nxtEl.style.background = bg;
      nxtEl.style.color = fg;
      nxtEl.textContent = st.nxt;
    }
  },

  _gameOver() {
    this._state.status = 'over';
    this._save();
    this._showOver();
  },

  _showOver() {
    const st = this._state;
    const best = Math.max(st.score, this._storage.get('best') ?? 0);
    this._storage.set('best', best);

    const div = document.createElement('div');
    div.className = 'dn-over';
    div.innerHTML = `
      <div style="font-size:52px">😵</div>
      <h2>Game Over</h2>
      <div class="sub">Score: <strong style="color:#fff">${st.score}</strong></div>
      ${st.score > 0 && st.score >= best
        ? '<div class="gold">🏆 New Best!</div>'
        : `<div class="sub" style="font-size:13px">Best: ${best}</div>`}
      <button class="dn-restart">Play Again</button>`;
    div.querySelector('.dn-restart').addEventListener('click', () => {
      this._state = this._fresh();
      this._save();
      this._build();
    });
    this._el.appendChild(div);
  },
};

export default DropMerge;
