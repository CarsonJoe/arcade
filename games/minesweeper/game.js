/**
 * Minesweeper — Arcade game module
 * Contract: export default { init(container, storage, {onPause}), destroy(), pause(), resume() }
 */

const DIFF = {
  easy:   { cols: 9,  rows: 9,  mines: 10 },
  medium: { cols: 12, rows: 12, mines: 25 },
  hard:   { cols: 12, rows: 18, mines: 45 },
};

const NUM_COLOR = ['', '#0A84FF','#30D158','#FF453A','#BF5AF2','#FF9F0A','#5AC8FA','#FF375F','#8E8E93'];
const FLAG = '🚩';
const BOMB = '💣';

let styleInjected = false;
function injectCSS() {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = `
.ms { display:flex; flex-direction:column; height:100%; background:#000;
  font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  user-select:none; -webkit-user-select:none; overflow:hidden; }

/* Top bar */
.ms-bar {
  display:flex; align-items:center; justify-content:space-between;
  padding: calc(env(safe-area-inset-top,44px) + 8px) max(18px,env(safe-area-inset-right,0px)) 10px max(18px,env(safe-area-inset-left,0px));
  background:#111; flex-shrink:0;
}
.ms-stat { display:flex; align-items:center; gap:6px; min-width:72px; }
.ms-stat.right { justify-content:flex-end; }
.ms-stat-val { font-size:22px; font-weight:700; font-variant-numeric:tabular-nums;
  letter-spacing:-1px; color:#fff; }
.ms-stat-icon { font-size:18px; }
.ms-smiley { font-size:30px; cursor:pointer; transition:transform .1s; line-height:1; }
.ms-smiley:active { transform:scale(.85); }

/* Difficulty screen */
.ms-diff { display:flex; flex-direction:column; align-items:center; justify-content:center;
  flex:1; gap:14px; padding:40px 28px; }
.ms-diff h2 { font-size:28px; font-weight:700; letter-spacing:-.5px; color:#fff; margin-bottom:8px; }
.ms-diff-desc { font-size:14px; color:rgba(235,235,245,.55); text-align:center; line-height:1.5; margin-bottom:6px; }
.ms-diff-btn {
  width:100%; padding:15px 24px; border-radius:14px; border:none; cursor:pointer;
  font-size:17px; font-weight:600; font-family:inherit; transition:transform .1s, opacity .1s;
  display:flex; justify-content:space-between; align-items:center;
}
.ms-diff-btn:active { transform:scale(.97); opacity:.85; }
.ms-diff-btn.easy   { background:#1C3A5E; color:#4A9EFF; }
.ms-diff-btn.medium { background:#3A2200; color:#FF9F0A; }
.ms-diff-btn.hard   { background:#3A0D0D; color:#FF453A; }
.ms-diff-meta { font-size:13px; opacity:.7; font-weight:500; }

/* Grid scroll */
.ms-scroll { flex:1; overflow:auto; -webkit-overflow-scrolling:touch;
  display:flex; align-items:flex-start; justify-content:center; padding:12px; }
.ms-grid { display:grid; gap:3px; flex-shrink:0; }

/* Cells */
.ms-cell {
  width:100%; aspect-ratio:1; border-radius:6px; display:flex; align-items:center;
  justify-content:center; font-weight:800; cursor:pointer;
  transition:transform .08s, background .12s, opacity .2s;
  -webkit-tap-highlight-color:transparent; touch-action:none;
}
.ms-cell:active { transform:scale(.88); }
.ms-cell.hidden  { background:#2C2C2E; }
.ms-cell.hidden:active { background:#3A3A3C; }
.ms-cell.flagged { background:#2C2C2E; }
.ms-cell.revealed { background:#1C1C1E; }
.ms-cell.mine    { background:#3A0D0D; }
.ms-cell.exploded{ background:#FF453A; animation:shake .3s; }
@keyframes shake { 0%,100%{transform:scale(1)} 25%{transform:scale(1.1) rotate(-4deg)}
  75%{transform:scale(1.1) rotate(4deg)} }

/* Result overlay */
.ms-result {
  position:absolute; inset:0; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:12px;
  background:rgba(0,0,0,.72); backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px); animation:fadeIn .35s;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.ms-result h2 { font-size:36px; font-weight:800; letter-spacing:-.5px; }
.ms-result .ms-time { font-size:18px; color:rgba(235,235,245,.65); }
.ms-result .ms-play-btn {
  margin-top:8px; background:#0A84FF; color:#fff; border:none; padding:14px 36px;
  border-radius:14px; font-size:17px; font-weight:600; cursor:pointer; font-family:inherit;
}
.ms-result .ms-play-btn:active { opacity:.8; }
.ms-result .ms-diff-row { display:flex; gap:10px; margin-top:4px; }
.ms-result .ms-d-btn {
  background:#2C2C2E; color:rgba(235,235,245,.7); border:none; padding:10px 18px;
  border-radius:10px; font-size:14px; cursor:pointer; font-family:inherit;
}
.ms-result .ms-d-btn:active { opacity:.7; }
`;
  document.head.appendChild(s);
}

// ── Game object ──────────────────────────────────────────────────────────────
const Minesweeper = {
  _el: null, _storage: null, _state: null, _timerID: null, _lpTimer: null,

  async init(container, storage, { onPause }) {
    injectCSS();
    this._storage  = storage;
    this._onPause  = onPause;
    this._el       = document.createElement('div');
    this._el.className = 'ms';
    container.appendChild(this._el);

    const saved = storage.get('state');
    if (saved?.status === 'playing') {
      this._state = saved;
      this._buildGame();
    } else {
      this._showDiff();
    }
  },

  destroy() {
    this._stopTimer();
    this._save();
    this._el?.remove();
    this._el = null;
  },

  pause()  { this._stopTimer(); this._save(); },
  resume() { if (this._state?.status === 'playing') this._startTimer(); },

  // ── Private ───────────────────────────────────────────
  _save() {
    if (this._state) this._storage.set('state', this._state);
  },

  _showDiff() {
    this._el.innerHTML = `
      <div class="ms-diff">
        <div style="font-size:52px">💣</div>
        <h2>Minesweeper</h2>
        <p class="ms-diff-desc">Reveal all safe cells.<br>Long-press to plant a flag.</p>
        <button class="ms-diff-btn easy"   data-d="easy">
          Easy <span class="ms-diff-meta">9×9 · 10 mines</span>
        </button>
        <button class="ms-diff-btn medium" data-d="medium">
          Medium <span class="ms-diff-meta">12×12 · 25 mines</span>
        </button>
        <button class="ms-diff-btn hard"   data-d="hard">
          Hard <span class="ms-diff-meta">12×18 · 45 mines</span>
        </button>
      </div>`;
    this._el.querySelectorAll('.ms-diff-btn').forEach(btn =>
      btn.addEventListener('click', () => this._newGame(btn.dataset.d))
    );
  },

  _newGame(diff) {
    const { cols, rows, mines } = DIFF[diff];
    this._state = {
      diff, cols, rows, mines,
      board:    null,
      revealed: new Array(rows * cols).fill(false),
      flagged:  new Array(rows * cols).fill(false),
      status:   'waiting',
      elapsed:  0,
      firstClick: true,
    };
    this._save();
    this._buildGame();
  },

  _buildGame() {
    const st = this._state;
    this._el.innerHTML = '';

    // Bar
    const bar = document.createElement('div');
    bar.className = 'ms-bar';
    bar.innerHTML = `
      <div class="ms-stat">
        <span class="ms-stat-icon">🚩</span>
        <span class="ms-stat-val" id="ms-flags">${this._flagsLeft()}</span>
      </div>
      <span class="ms-smiley" id="ms-face">🙂</span>
      <div class="ms-stat right">
        <span class="ms-stat-val" id="ms-timer">${this._fmtTime(st.elapsed)}</span>
        <span class="ms-stat-icon">⏱️</span>
      </div>`;
    this._el.appendChild(bar);
    bar.querySelector('#ms-face').addEventListener('click', () => this._newGame(st.diff));

    // Grid wrapper
    const scroll = document.createElement('div');
    scroll.className = 'ms-scroll';
    const grid = document.createElement('div');
    grid.className = 'ms-grid';
    const cellPx = Math.floor(Math.min(
      (window.innerWidth - 28) / st.cols,
      (window.innerHeight - 120) / st.rows,
      44
    ));
    const fontSize = Math.max(9, Math.floor(cellPx * 0.48));
    grid.style.cssText = `grid-template-columns:repeat(${st.cols},${cellPx}px);font-size:${fontSize}px`;
    scroll.appendChild(grid);
    this._el.appendChild(scroll);
    this._grid = grid;

    // Render cells
    for (let i = 0; i < st.rows * st.cols; i++) {
      const cell = document.createElement('div');
      cell.className = 'ms-cell hidden';
      cell.style.width = cell.style.height = cellPx + 'px';
      cell.dataset.i = i;
      this._attachCellEvents(cell, i);
      grid.appendChild(cell);
    }

    if (st.board) this._syncGrid();
    if (st.status === 'playing') this._startTimer();
    if (st.status === 'won')  this._showResult(true);
    if (st.status === 'lost') this._showResult(false);
  },

  _attachCellEvents(cell, i) {
    // Long press = flag, tap = reveal
    cell.addEventListener('touchstart', e => {
      e.preventDefault();
      this._lpTimer = setTimeout(() => {
        this._flag(i);
        this._lpTimer = null;
        try { navigator.vibrate(25); } catch {}
      }, 450);
    }, { passive: false });

    cell.addEventListener('touchend', e => {
      e.preventDefault();
      if (this._lpTimer) {
        clearTimeout(this._lpTimer);
        this._lpTimer = null;
        this._reveal(i);
      }
    });

    cell.addEventListener('touchmove', () => {
      if (this._lpTimer) { clearTimeout(this._lpTimer); this._lpTimer = null; }
    });

    // Desktop fallback
    cell.addEventListener('click', () => {
      if (!('ontouchstart' in window)) this._reveal(i);
    });
    cell.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (!('ontouchstart' in window)) this._flag(i);
    });
  },

  _reveal(i) {
    const st = this._state;
    if (st.status === 'won' || st.status === 'lost') return;
    if (st.flagged[i] || st.revealed[i]) return;

    if (st.firstClick) {
      st.board = this._genBoard(st.cols, st.rows, st.mines, i);
      st.status = 'playing';
      st.firstClick = false;
      this._startTimer();
    }

    if (st.board[i] === -1) {
      // Hit mine
      st.revealed[i] = true;
      st.status = 'lost';
      this._stopTimer();
      this._syncGrid(i);
      this._el.querySelector('#ms-face').textContent = '😵';
      setTimeout(() => this._showResult(false), 600);
      this._save();
      return;
    }

    this._floodReveal(i);
    this._checkWin();
    this._syncGrid();
    this._save();
  },

  _floodReveal(start) {
    const st = this._state;
    const q = [start];
    while (q.length) {
      const i = q.shift();
      if (st.revealed[i] || st.flagged[i]) continue;
      st.revealed[i] = true;
      if (st.board[i] === 0) {
        const r = Math.floor(i / st.cols), c = i % st.cols;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          if (!dr && !dc) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < st.rows && nc >= 0 && nc < st.cols)
            q.push(nr * st.cols + nc);
        }
      }
    }
  },

  _flag(i) {
    const st = this._state;
    if (st.status === 'won' || st.status === 'lost') return;
    if (st.revealed[i]) return;
    if (st.firstClick) return; // no flagging before game starts
    st.flagged[i] = !st.flagged[i];
    this._syncCell(i);
    const flagEl = this._el.querySelector('#ms-flags');
    if (flagEl) flagEl.textContent = this._flagsLeft();
    this._save();
  },

  _flagsLeft() {
    const st = this._state;
    return st.mines - (st.flagged?.filter(Boolean).length ?? 0);
  },

  _checkWin() {
    const st = this._state;
    const safe = st.rows * st.cols - st.mines;
    if (st.revealed.filter(Boolean).length >= safe) {
      st.status = 'won';
      this._stopTimer();
      this._el.querySelector('#ms-face').textContent = '😎';
      setTimeout(() => this._showResult(true), 400);
    }
  },

  _syncGrid(explodedIdx = null) {
    const st = this._state;
    const cells = this._grid.querySelectorAll('.ms-cell');
    cells.forEach((cell, i) => this._syncCell(i, cell, explodedIdx));
  },

  _syncCell(i, cell = null, explodedIdx = null) {
    const st = this._state;
    if (!cell) cell = this._grid?.querySelector(`[data-i="${i}"]`);
    if (!cell) return;
    cell.className = 'ms-cell';
    cell.textContent = '';

    if (st.status === 'lost' && st.board && st.board[i] === -1 && !st.flagged[i]) {
      cell.classList.add(i === explodedIdx ? 'exploded' : 'mine');
      cell.textContent = BOMB;
    } else if (st.flagged[i]) {
      cell.classList.add('flagged');
      cell.textContent = FLAG;
    } else if (!st.revealed[i]) {
      cell.classList.add('hidden');
    } else {
      cell.classList.add('revealed');
      const v = st.board?.[i] ?? 0;
      if (v > 0) {
        cell.textContent = v;
        cell.style.color = NUM_COLOR[v] || '#fff';
      }
    }
  },

  _showResult(won) {
    const st = this._state;
    const best = this._storage.get('best_' + st.diff);
    const newBest = won && (!best || st.elapsed < best);
    if (newBest) this._storage.set('best_' + st.diff, st.elapsed);

    const div = document.createElement('div');
    div.className = 'ms-result';
    div.innerHTML = `
      <div style="font-size:52px">${won ? '🎉' : '💥'}</div>
      <h2 style="color:${won ? '#30D158' : '#FF453A'}">${won ? 'You Win!' : 'Game Over'}</h2>
      <div class="ms-time">${won ? `Solved in ${this._fmtTime(st.elapsed)}` : 'Better luck next time'}
        ${newBest ? '<br><span style="color:#FFD60A">New best!</span>' : ''}</div>
      <button class="ms-play-btn">Play Again</button>
      <div class="ms-diff-row">
        ${Object.keys(DIFF).filter(d => d !== st.diff).map(d =>
          `<button class="ms-d-btn" data-d="${d}">${d.charAt(0).toUpperCase() + d.slice(1)}</button>`
        ).join('')}
      </div>`;
    div.querySelector('.ms-play-btn').addEventListener('click', () => this._newGame(st.diff));
    div.querySelectorAll('.ms-d-btn').forEach(b =>
      b.addEventListener('click', () => this._newGame(b.dataset.d))
    );
    // Place overlay inside grid scroll for proper positioning
    this._el.style.position = 'relative';
    this._el.appendChild(div);
  },

  _genBoard(cols, rows, mines, safeIdx) {
    const board = new Array(rows * cols).fill(0);
    // Safe zone around first click
    const safe = new Set();
    const sr = Math.floor(safeIdx / cols), sc = safeIdx % cols;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = sr + dr, nc = sc + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) safe.add(nr * cols + nc);
    }
    let placed = 0;
    while (placed < mines) {
      const idx = Math.floor(Math.random() * rows * cols);
      if (board[idx] !== -1 && !safe.has(idx)) { board[idx] = -1; placed++; }
    }
    // Compute numbers
    for (let i = 0; i < rows * cols; i++) {
      if (board[i] === -1) continue;
      const r = Math.floor(i / cols), c = i % cols;
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr * cols + nc] === -1) n++;
      }
      board[i] = n;
    }
    return board;
  },

  _fmtTime(s) {
    s = Math.floor(s || 0);
    return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  },

  _startTimer() {
    if (this._timerID) return;
    const st = this._state;
    const start = Date.now() - (st.elapsed || 0) * 1000;
    this._timerID = setInterval(() => {
      st.elapsed = (Date.now() - start) / 1000;
      const el = this._el?.querySelector('#ms-timer');
      if (el) el.textContent = this._fmtTime(st.elapsed);
    }, 500);
  },

  _stopTimer() {
    clearInterval(this._timerID);
    this._timerID = null;
  },
};

export default Minesweeper;
