/**
 * Drop & Merge — Arcade game module
 * Contract: export default { init(container, storage, {onPause}), destroy(), pause(), resume() }
 *
 * A brick falls smoothly (absolutely-positioned overlay, CSS transition).
 * Tap any column to move there. Same-value bricks touching horizontally OR
 * vertically merge at the landing position; gravity then cascades.
 */

const COLS       = 5;
const ROWS       = 8;
const SPAWN_ROW  = 1;    // index from top  (= "7th row up")
const DANGER_ROW = 2;    // game over if any settled tile reaches here
const FALL_MS    = 580;  // ms per one-row drop

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
  padding:calc(env(safe-area-inset-top,44px) + 8px)
    max(20px,env(safe-area-inset-right,0px)) 10px
    max(20px,env(safe-area-inset-left,0px));
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

/* Board centring wrapper */
.dm-board-wrap { flex:1; display:flex; align-items:center; justify-content:center;
  padding:10px max(14px,env(safe-area-inset-left,0px)) 6px; overflow:hidden; }

/* Exact-size container — grid + falling overlay share same coordinate space */
.dm-grid-ctr { position:relative; flex-shrink:0; }

/* Settled-tile grid */
.dm-board { display:grid; position:absolute; top:0; left:0; }
.dm-cell { border-radius:8px; display:flex; align-items:center;
  justify-content:center; font-weight:800; background:#1C1C1E; }
.dm-cell.danger-line { box-shadow:inset 0 2px 0 rgba(255,68,58,.45); }

/* Falling tile — absolutely positioned, animated */
.dm-piece {
  position:absolute; border-radius:8px; display:flex; align-items:center;
  justify-content:center; font-weight:800;
  box-shadow:0 3px 16px rgba(0,0,0,.55);
  pointer-events:none; z-index:5;
  will-change:transform;
}

/* Controls */
.dm-controls {
  display:flex; gap:12px;
  padding:6px max(20px,env(safe-area-inset-right,0px))
    calc(env(safe-area-inset-bottom,0px) + 14px)
    max(20px,env(safe-area-inset-left,0px));
  flex-shrink:0;
}
.dm-ctrl-btn { flex:1; height:60px; background:#1C1C1E; border:none; border-radius:16px;
  display:flex; align-items:center; justify-content:center; cursor:pointer;
  transition:background .08s, transform .08s; }
.dm-ctrl-btn:active { background:#3A3A3C; transform:scale(.94); }
.dm-ctrl-btn svg { width:28px; height:28px; color:rgba(235,235,245,.75); }

/* Game over */
.dm-over { position:absolute; inset:0; z-index:30; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:14px;
  background:rgba(0,0,0,.82); backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px); animation:dmFi .3s; }
@keyframes dmFi { from{opacity:0} to{opacity:1} }
.dm-over h2 { font-size:36px; font-weight:800; color:#FF453A; letter-spacing:-.5px; }
.dm-over .dm-sub  { font-size:16px; color:rgba(235,235,245,.55); }
.dm-over .dm-gold { font-size:14px; color:#FFD60A; }
.dm-over .dm-again { margin-top:6px; background:#F97316; color:#fff; border:none;
  padding:14px 44px; border-radius:14px; font-size:17px; font-weight:700;
  cursor:pointer; font-family:inherit; }
.dm-over .dm-again:active { opacity:.8; }
`;
  document.head.appendChild(s);
}

// ── Game object ───────────────────────────────────────────────────────────────
const DropMerge = {
  _el: null, _storage: null, _state: null,
  _interval: null, _board: null, _piece: null,
  _cs: 0, _gap: 5,

  async init(container, storage, { onPause }) {
    injectCSS();
    this._storage = storage;
    this._onPause = onPause;
    this._el = document.createElement('div');
    this._el.className = 'dm';
    this._el.style.position = 'relative';
    container.appendChild(this._el);

    const saved = storage.get('v3state');
    this._state = (saved?.status === 'playing' && saved?.falling) ? saved : this._fresh();
    this._build();
    if (this._state.status === 'playing') this._startFall();
  },

  destroy() {
    this._stopFall();
    document.removeEventListener('keydown', this._keyHandler);
    this._save();
    this._el?.remove();
    this._el = null;
  },

  pause()  { this._stopFall(); this._save(); },
  resume() { if (this._state?.status === 'playing') this._startFall(); },

  // ── State ─────────────────────────────────────────────
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
    if (this._state) this._storage.set('v3state', this._state);
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
    const next = falling.row + 1;
    if (next < ROWS && !grid[next * COLS + falling.col]) {
      falling.row = next;
      this._movePiece();        // CSS transition handles the visual slide
    } else {
      this._land();
    }
  },

  // ── Controls ──────────────────────────────────────────
  _moveLeft() {
    const { falling, grid } = this._state;
    if (this._state.status !== 'playing' || falling.col <= 0) return;
    if (!grid[falling.row * COLS + (falling.col - 1)]) {
      falling.col--;
      this._movePiece();
      try { navigator.vibrate?.(6); } catch {}
    }
  },

  _moveRight() {
    const { falling, grid } = this._state;
    if (this._state.status !== 'playing' || falling.col >= COLS - 1) return;
    if (!grid[falling.row * COLS + (falling.col + 1)]) {
      falling.col++;
      this._movePiece();
      try { navigator.vibrate?.(6); } catch {}
    }
  },

  _tapCol(col) {
    const { falling, grid } = this._state;
    if (this._state.status !== 'playing') return;
    col = Math.max(0, Math.min(COLS - 1, col));
    if (!grid[falling.row * COLS + col]) {
      falling.col = col;
      this._movePiece();
      try { navigator.vibrate?.(6); } catch {}
    }
  },

  // ── Landing & merges ──────────────────────────────────
  _land() {
    const { falling, grid } = this._state;
    grid[falling.row * COLS + falling.col] = falling.value;
    this._state.lastCol = falling.col;
    this._state.falling = null;
    if (this._piece) this._piece.style.display = 'none';

    this._mergeLoop();

    // Game over: any settled tile at or above DANGER_ROW
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

    this._renderBoard();
    this._updateHeader();
    this._placePiece();   // snap new piece into position (no transition)
    this._save();
  },

  // Gravity + horizontal + vertical merge, loop until stable
  _mergeLoop() {
    const g = this._state.grid;
    let found = true;
    while (found) {
      // Gravity: compact each column downward
      for (let c = 0; c < COLS; c++) {
        const vals = [];
        for (let r = 0; r < ROWS; r++) if (g[r * COLS + c]) vals.push(g[r * COLS + c]);
        const off = ROWS - vals.length;
        for (let r = 0; r < ROWS; r++) g[r * COLS + c] = r >= off ? vals[r - off] : 0;
      }

      found = false;
      // Scan bottom-up for any adjacent same-value pair
      outer: for (let r = ROWS - 1; r >= 0; r--) {
        for (let c = 0; c < COLS; c++) {
          const v = g[r * COLS + c];
          if (!v) continue;

          // Horizontal: merge right neighbour into this cell
          if (c + 1 < COLS && g[r * COLS + c + 1] === v) {
            g[r * COLS + c]     = v * 2;
            g[r * COLS + c + 1] = 0;
            this._state.score += v * 2;
            found = true; break outer;
          }

          // Vertical: same value directly above → merge upper into lower (this cell)
          if (r > 0 && g[(r - 1) * COLS + c] === v) {
            g[r * COLS + c]         = v * 2;
            g[(r - 1) * COLS + c]   = 0;
            this._state.score += v * 2;
            found = true; break outer;
          }
        }
      }
    }
  },

  // ── Build UI (called once per game start) ──────────────
  _build() {
    this._el.innerHTML = '';
    const st = this._state;

    // Cell size: fit both width and height
    const gap    = this._gap;
    const vw     = Math.min(window.innerWidth, 430);
    const csW    = Math.floor((vw - 28 - gap * (COLS - 1)) / COLS);
    const safeB  = 34; // conservative safe-area estimate
    const availH = window.innerHeight - 95 - 80 - safeB - 24;
    const csH    = Math.floor((availH - gap * (ROWS - 1)) / ROWS);
    this._cs     = Math.min(csW, csH, 72);
    const cs     = this._cs;

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

    // Board centring wrapper
    const wrap = document.createElement('div');
    wrap.className = 'dm-board-wrap';

    // Exact-size grid container (grid + floating piece share same origin)
    const gridW = COLS * cs + (COLS - 1) * gap;
    const gridH = ROWS * cs + (ROWS - 1) * gap;
    const ctr = document.createElement('div');
    ctr.className = 'dm-grid-ctr';
    ctr.style.width  = gridW + 'px';
    ctr.style.height = gridH + 'px';

    // Settled-tile grid
    const board = document.createElement('div');
    board.className = 'dm-board';
    board.style.cssText = `
      grid-template-columns:repeat(${COLS},${cs}px);
      grid-template-rows:repeat(${ROWS},${cs}px);
      gap:${gap}px;
      font-size:${Math.max(10, Math.floor(cs * 0.36))}px;
    `;
    this._board = board;
    ctr.appendChild(board);

    // Floating piece element
    const piece = document.createElement('div');
    piece.className = 'dm-piece';
    piece.style.width  = cs + 'px';
    piece.style.height = cs + 'px';
    piece.style.fontSize = Math.max(10, Math.floor(cs * 0.36)) + 'px';
    this._piece = piece;
    ctr.appendChild(piece);

    // Column tap: touchend on grid container
    ctr.addEventListener('touchend', e => {
      if (this._state.status !== 'playing') return;
      e.preventDefault();
      const rect = ctr.getBoundingClientRect();
      const x    = e.changedTouches[0].clientX - rect.left;
      this._tapCol(Math.floor(x / (cs + gap)));
    }, { passive: false });

    // Desktop click
    ctr.addEventListener('click', e => {
      if ('ontouchstart' in window || this._state.status !== 'playing') return;
      const rect = ctr.getBoundingClientRect();
      this._tapCol(Math.floor((e.clientX - rect.left) / (cs + gap)));
    });

    wrap.appendChild(ctr);
    this._el.appendChild(wrap);

    // ← → controls
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

    ctrl.querySelector('#dm-left').addEventListener('click',  () => this._moveLeft());
    ctrl.querySelector('#dm-right').addEventListener('click', () => this._moveRight());

    // Keyboard
    this._keyHandler = e => {
      if (e.key === 'ArrowLeft')  this._moveLeft();
      if (e.key === 'ArrowRight') this._moveRight();
    };
    document.addEventListener('keydown', this._keyHandler);

    this._renderBoard();
    this._placePiece();   // instant snap for first/restored brick

    if (st.status === 'over') this._showOver();
  },

  // ── Render ────────────────────────────────────────────
  _renderBoard() {
    const board = this._board;
    if (!board) return;
    board.innerHTML = '';
    const g  = this._state.grid;
    const cs = this._cs;
    const fs = Math.max(10, Math.floor(cs * 0.36));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'dm-cell';
        if (r === DANGER_ROW + 1) cell.classList.add('danger-line');
        const v = g[r * COLS + c];
        if (v) {
          const { bg, fg } = pal(v);
          cell.style.cssText = `background:${bg};color:${fg};font-size:${fs}px`;
          cell.textContent = v >= 10000 ? Math.round(v / 1000) + 'k' : v;
        }
        board.appendChild(cell);
      }
    }
  },

  // Snap piece to position with no animation (new spawn or restore)
  _placePiece() {
    const p  = this._piece;
    const st = this._state;
    if (!p || !st.falling) { if (p) p.style.display = 'none'; return; }
    const { row, col, value } = st.falling;
    const { bg, fg } = pal(value);
    p.style.transition  = 'none';
    p.style.display     = 'flex';
    p.style.background  = bg;
    p.style.color       = fg;
    p.textContent       = value;
    p.style.transform   = `translate(${col * (this._cs + this._gap)}px, ${row * (this._cs + this._gap)}px)`;
    // Re-enable transitions on next frame so the first fall looks smooth
    requestAnimationFrame(() => {
      if (p) p.style.transition =
        `transform ${FALL_MS - 70}ms linear`;
    });
  },

  // Animate piece to its current logical position
  _movePiece() {
    const p  = this._piece;
    const st = this._state;
    if (!p || !st.falling) return;
    const { row, col, value } = st.falling;
    const { bg, fg } = pal(value);
    p.style.background = bg;
    p.style.color      = fg;
    p.textContent      = value;
    // Horizontal moves should be fast; vertical should match fall interval
    p.style.transition =
      `transform ${FALL_MS - 70}ms linear`;
    p.style.transform  =
      `translate(${col * (this._cs + this._gap)}px, ${row * (this._cs + this._gap)}px)`;
  },

  // ── Header ────────────────────────────────────────────
  _updateHeader() {
    const st = this._state;
    const sEl = this._el?.querySelector('#dm-score');
    if (sEl) sEl.textContent = st.score;

    const prev = this._storage.get('best') ?? 0;
    if (st.score > prev) {
      this._storage.set('best', st.score);
      const bEl = this._el?.querySelector('#dm-best');
      if (bEl) bEl.textContent = st.score;
    }

    const nEl = this._el?.querySelector('#dm-next');
    if (nEl && st.next) {
      const { bg, fg } = pal(st.next);
      nEl.style.background = bg;
      nEl.style.color      = fg;
      nEl.textContent      = st.next;
    }
  },

  // ── Game over ─────────────────────────────────────────
  _over() {
    this._stopFall();
    this._state.status = 'over';
    const best = Math.max(this._state.score, this._storage.get('best') ?? 0);
    this._storage.set('best', best);
    this._save();
    this._renderBoard();
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
