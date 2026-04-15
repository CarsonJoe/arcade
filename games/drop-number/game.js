/**
 * Drop & Merge — Arcade game module
 * Contract: export default { init(container, storage, {onPause}), destroy(), pause(), resume() }
 *
 * Bricks slowly fall. Tap ← / → to steer. Same-value bricks that touch
 * horizontally merge at the newly-landed position, then gravity pulls
 * the stack down — repeat until stable.
 */

const COLS       = 5;
const ROWS       = 8;
const SPAWN_ROW  = 1;   // index from top  (= row 7 from bottom)
const DANGER_ROW = 2;   // game over if any settled tile reaches here (row 6 from bottom)
const FALL_MS    = 550; // ms between automatic row drops

const PALETTE = [
  { bg: '#1D3557', fg: '#A8DADC' }, // 2
  { bg: '#1B7A6E', fg: '#fff'    }, // 4
  { bg: '#1565C0', fg: '#fff'    }, // 8
  { bg: '#6A0DAD', fg: '#fff'    }, // 16
  { bg: '#9B2226', fg: '#fff'    }, // 32
  { bg: '#E76F51', fg: '#fff'    }, // 64
  { bg: '#F4A261', fg: '#1a1a1a' }, // 128
  { bg: '#E9C46A', fg: '#1a1a1a' }, // 256
  { bg: '#F3D34A', fg: '#1a1a1a' }, // 512
  { bg: '#FFD700', fg: '#1a1a1a' }, // 1024+
];

function pal(v) {
  return PALETTE[Math.min(Math.floor(Math.log2(v)) - 1, PALETTE.length - 1)];
}

function rand() {
  const r = Math.random();
  if (r < .50) return 2;
  if (r < .80) return 4;
  if (r < .94) return 8;
  return 16;
}

let cssReady = false;
function injectCSS() {
  if (cssReady) return;
  cssReady = true;
  const s = document.createElement('style');
  s.textContent = `
.dm { display:flex; flex-direction:column; height:100%; background:#000;
  font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  -webkit-user-select:none; user-select:none; overflow:hidden; }

/* Header */
.dm-hdr {
  display:flex; align-items:center; justify-content:space-between;
  padding:calc(env(safe-area-inset-top,44px) + 8px) max(20px,env(safe-area-inset-right,0px)) 10px max(20px,env(safe-area-inset-left,0px));
  background:#111; flex-shrink:0; gap:8px;
}
.dm-stat { text-align:center; flex:1; }
.dm-stat-lbl { font-size:10px; font-weight:600; letter-spacing:.5px;
  text-transform:uppercase; color:rgba(235,235,245,.4); }
.dm-stat-val { font-size:22px; font-weight:800; letter-spacing:-1px; color:#fff;
  font-variant-numeric:tabular-nums; }
.dm-next { display:flex; flex-direction:column; align-items:center; gap:3px; flex:1; }
.dm-next-tile { width:42px; height:42px; border-radius:10px; display:flex;
  align-items:center; justify-content:center; font-size:14px; font-weight:800; }

/* Board */
.dm-board-wrap {
  flex:1; display:flex; align-items:center; justify-content:center;
  padding:10px max(14px,env(safe-area-inset-left,0px)) 6px;
  overflow:hidden;
}
.dm-board { display:grid; position:relative; }
.dm-cell { border-radius:8px; display:flex; align-items:center;
  justify-content:center; font-weight:800; background:#1C1C1E;
  transition:background .12s; }
.dm-cell.falling { outline:2px solid rgba(255,255,255,.45); outline-offset:-2px;
  z-index:2; }
.dm-cell.danger-line { box-shadow:0 -2px 0 rgba(255,68,58,.5); }

/* Controls */
.dm-controls {
  display:flex; gap:12px;
  padding:6px max(20px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 14px) max(20px,env(safe-area-inset-left,0px));
  flex-shrink:0;
}
.dm-ctrl-btn { flex:1; height:60px; background:#1C1C1E; border:none; border-radius:16px;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  transition:background .08s, transform .08s; }
.dm-ctrl-btn:active { background:#3A3A3C; transform:scale(.95); }
.dm-ctrl-btn svg { width:28px; height:28px; color:rgba(235,235,245,.7); }

/* Game over */
.dm-over { position:absolute; inset:0; z-index:30; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:14px;
  background:rgba(0,0,0,.8); backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px); animation:dmFi .3s; }
@keyframes dmFi { from{opacity:0} to{opacity:1} }
.dm-over h2 { font-size:36px; font-weight:800; color:#FF453A; letter-spacing:-.5px; }
.dm-over .dm-sub { font-size:16px; color:rgba(235,235,245,.55); }
.dm-over .dm-gold { font-size:14px; color:#FFD60A; }
.dm-over .dm-again { margin-top:6px; background:#F97316; color:#fff; border:none;
  padding:14px 44px; border-radius:14px; font-size:17px; font-weight:700;
  cursor:pointer; font-family:inherit; }
.dm-over .dm-again:active { opacity:.8; }
`;
  document.head.appendChild(s);
}

// ── Game ─────────────────────────────────────────────────────────────────────
const DropMerge = {
  _el: null, _storage: null, _state: null, _interval: null,

  async init(container, storage, { onPause }) {
    injectCSS();
    this._storage = storage;
    this._onPause = onPause;
    this._el = document.createElement('div');
    this._el.className = 'dm';
    this._el.style.position = 'relative';
    container.appendChild(this._el);

    const saved = storage.get('v2state');
    this._state = (saved?.status === 'playing' && saved?.falling) ? saved : this._fresh();
    this._build();
    if (this._state.status === 'playing') this._startFall();
  },

  destroy() {
    this._stopFall();
    this._save();
    this._el?.remove();
    this._el = null;
  },

  pause()  { this._stopFall(); this._save(); },
  resume() { if (this._state?.status === 'playing') this._startFall(); },

  // ── State ──────────────────────────────────────────────
  _fresh() {
    return {
      grid:    new Array(ROWS * COLS).fill(0),
      score:   0,
      falling: { value: rand(), row: SPAWN_ROW, col: Math.floor(COLS / 2) },
      next:    rand(),
      lastCol: Math.floor(COLS / 2),
      status:  'playing',
    };
  },

  _save() {
    if (this._state) this._storage.set('v2state', this._state);
  },

  // ── Fall loop ──────────────────────────────────────────
  _startFall() {
    this._stopFall();
    this._interval = setInterval(() => this._tick(), FALL_MS);
  },

  _stopFall() {
    clearInterval(this._interval);
    this._interval = null;
  },

  _tick() {
    if (this._state.status !== 'playing') { this._stopFall(); return; }
    const { falling, grid } = this._state;
    const nextRow = falling.row + 1;
    if (nextRow < ROWS && !grid[nextRow * COLS + falling.col]) {
      falling.row = nextRow;
      this._render();
    } else {
      this._land();
    }
  },

  // ── Controls ───────────────────────────────────────────
  _moveLeft() {
    const { falling, grid } = this._state;
    if (this._state.status !== 'playing') return;
    if (falling.col > 0 && !grid[falling.row * COLS + (falling.col - 1)]) {
      falling.col--;
      this._render();
      try { navigator.vibrate?.(6); } catch {}
    }
  },

  _moveRight() {
    const { falling, grid } = this._state;
    if (this._state.status !== 'playing') return;
    if (falling.col < COLS - 1 && !grid[falling.row * COLS + (falling.col + 1)]) {
      falling.col++;
      this._render();
      try { navigator.vibrate?.(6); } catch {}
    }
  },

  // ── Landing & merges ───────────────────────────────────
  _land() {
    const { falling, grid } = this._state;
    const { value, row, col } = falling;

    // Place tile
    grid[row * COLS + col] = value;
    this._state.lastCol = col;
    this._state.falling = null;

    // Merge loop: gravity → scan for adjacent horizontal pairs → repeat
    this._mergeLoop();

    // Game over check: any settled tile at or above DANGER_ROW
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r <= DANGER_ROW; r++) {
        if (grid[r * COLS + c]) { this._over(); return; }
      }
    }

    // Spawn next
    this._state.falling = {
      value: this._state.next,
      row:   SPAWN_ROW,
      col:   this._state.lastCol,
    };
    this._state.next = rand();
    this._save();
    this._render();
    this._updateHeader();
  },

  _mergeLoop() {
    const g = this._state.grid;
    let found = true;
    while (found) {
      // Gravity first
      for (let c = 0; c < COLS; c++) {
        const col = [];
        for (let r = 0; r < ROWS; r++) if (g[r * COLS + c]) col.push(g[r * COLS + c]);
        const off = ROWS - col.length;
        for (let r = 0; r < ROWS; r++) g[r * COLS + c] = r >= off ? col[r - off] : 0;
      }
      // Scan bottom-up for horizontal adjacent pairs
      found = false;
      outer: for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS - 1; c++) {
          const v = g[r * COLS + c];
          if (v && v === g[r * COLS + c + 1]) {
            // Merge: keep at the position that was just landed (right if right is newer,
            // left if left is newer). For simplicity keep the RIGHT cell as the anchor
            // (scanning left→right, the right is the "incoming" side).
            g[r * COLS + c + 1] = v * 2;
            g[r * COLS + c]     = 0;
            this._state.score  += v * 2;
            found = true;
            break outer;
          }
        }
      }
    }
  },

  // ── Build UI (once per game start) ────────────────────
  _build() {
    this._el.innerHTML = '';
    const st = this._state;

    // Compute cell size
    const vw   = Math.min(window.innerWidth, 430);
    const hPad = 28;
    const gap  = 5;
    const csW  = Math.floor((vw - hPad - gap * (COLS - 1)) / COLS);
    // Leave room for header (~90px) and controls (~80px + safe bottom)
    const safeB = parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--safe-b') || '0') || 0;
    const availH = window.innerHeight - 90 - 80 - safeB - 20;
    const csH    = Math.floor((availH - gap * (ROWS - 1)) / ROWS);
    this._cs  = Math.min(csW, csH, 70);
    this._gap = gap;

    // Header
    const best = this._storage.get('best') ?? 0;
    const { bg: nb, fg: nf } = pal(st.next);
    const hdr = document.createElement('div');
    hdr.className = 'dm-hdr';
    hdr.innerHTML = `
      <div class="dm-stat">
        <div class="dm-stat-lbl">Best</div>
        <div class="dm-stat-val" id="dm-best">${best}</div>
      </div>
      <div class="dm-stat">
        <div class="dm-stat-lbl">Score</div>
        <div class="dm-stat-val" id="dm-score">${st.score}</div>
      </div>
      <div class="dm-next">
        <div class="dm-stat-lbl">Next</div>
        <div class="dm-next-tile" id="dm-next"
          style="background:${nb};color:${nf}">${st.next}</div>
      </div>`;
    this._el.appendChild(hdr);

    // Board wrapper
    const wrap = document.createElement('div');
    wrap.className = 'dm-board-wrap';
    const board = document.createElement('div');
    board.className = 'dm-board';
    const cs = this._cs;
    board.style.cssText = `
      grid-template-columns:repeat(${COLS},${cs}px);
      grid-template-rows:repeat(${ROWS},${cs}px);
      gap:${gap}px;
      font-size:${Math.max(10, Math.floor(cs * 0.36))}px;
    `;
    this._board = board;
    wrap.appendChild(board);
    this._el.appendChild(wrap);

    // Controls
    const ctrl = document.createElement('div');
    ctrl.className = 'dm-controls';
    ctrl.innerHTML = `
      <button class="dm-ctrl-btn" id="dm-left" aria-label="Move left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button class="dm-ctrl-btn" id="dm-right" aria-label="Move right">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>`;
    this._el.appendChild(ctrl);

    ctrl.querySelector('#dm-left').addEventListener('click', () => this._moveLeft());
    ctrl.querySelector('#dm-right').addEventListener('click', () => this._moveRight());

    // Keyboard (desktop)
    this._keyHandler = e => {
      if (e.key === 'ArrowLeft')  this._moveLeft();
      if (e.key === 'ArrowRight') this._moveRight();
    };
    document.addEventListener('keydown', this._keyHandler);

    this._render();
    if (st.status === 'over') this._showOver();
  },

  _render() {
    const st    = this._state;
    const board = this._board;
    if (!board) return;

    board.innerHTML = '';
    const cs = this._cs;
    const fs = Math.max(10, Math.floor(cs * 0.36));

    const fallingIdx = st.falling
      ? st.falling.row * COLS + st.falling.col : -1;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const idx  = r * COLS + c;
        const cell = document.createElement('div');
        cell.className = 'dm-cell';

        // Mark the danger row boundary (first row of playing field)
        if (r === DANGER_ROW + 1) cell.classList.add('danger-line');

        if (idx === fallingIdx && st.falling) {
          const { bg, fg } = pal(st.falling.value);
          cell.style.cssText = `background:${bg};color:${fg};font-size:${fs}px`;
          cell.textContent = st.falling.value;
          cell.classList.add('falling');
        } else {
          const v = st.grid[idx];
          if (v) {
            const { bg, fg } = pal(v);
            cell.style.cssText = `background:${bg};color:${fg};font-size:${fs}px`;
            cell.textContent = v >= 10000 ? Math.round(v / 1000) + 'k' : v;
          }
        }
        board.appendChild(cell);
      }
    }
  },

  _updateHeader() {
    const st = this._state;
    const sEl = this._el?.querySelector('#dm-score');
    if (sEl) sEl.textContent = st.score;

    const prevBest = this._storage.get('best') ?? 0;
    if (st.score > prevBest) {
      this._storage.set('best', st.score);
      const bEl = this._el?.querySelector('#dm-best');
      if (bEl) bEl.textContent = st.score;
    }

    if (st.next) {
      const nEl = this._el?.querySelector('#dm-next');
      if (nEl) {
        const { bg, fg } = pal(st.next);
        nEl.style.background = bg;
        nEl.style.color = fg;
        nEl.textContent = st.next;
      }
    }
  },

  _over() {
    this._stopFall();
    this._state.status = 'over';
    const best = Math.max(this._state.score, this._storage.get('best') ?? 0);
    this._storage.set('best', best);
    this._save();
    this._render();
    this._showOver();
  },

  _showOver() {
    const st   = this._state;
    const best = this._storage.get('best') ?? 0;
    const div  = document.createElement('div');
    div.className = 'dm-over';
    div.innerHTML = `
      <div style="font-size:52px">😵</div>
      <h2>Game Over</h2>
      <div class="dm-sub">Score: <strong style="color:#fff">${st.score}</strong></div>
      ${st.score > 0 && st.score >= best
        ? '<div class="dm-gold">🏆 New Best!</div>'
        : `<div class="dm-sub" style="font-size:13px">Best: ${best}</div>`}
      <button class="dm-again">Play Again</button>`;
    div.querySelector('.dm-again').addEventListener('click', () => {
      document.removeEventListener('keydown', this._keyHandler);
      this._state = this._fresh();
      this._save();
      this._build();
      this._startFall();
    });
    this._el.appendChild(div);
  },
};

export default DropMerge;
