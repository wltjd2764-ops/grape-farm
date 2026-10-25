'use strict';
// ───────── 아이소메트릭 농장 월드 ─────────
// 좌표: 격자(gx, gy) → 화면 iso(gx, gy) = ((gx-gy)*16, (gx+gy)*8). 플레이 영역은 0~24 x 0~24 칸
const World = (() => {
  const N = 24, R = Pix.R;
  const iso = (gx, gy, z = 0) => [(gx - gy) * 16, (gx + gy) * 8 - z];
  const toGrid = (x, y) => [x / 32 + y / 16, y / 16 - x / 32];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ───── 맵 구성 ─────
  const PLOT_W = 4, PLOT_D = 3;
  const PLOTS = [];
  [9, 13, 17].forEach(gy => [6, 14, 1, 19].forEach(gx => PLOTS.push({ gx, gy, w: PLOT_W, d: PLOT_D })));
  const ROW_OFF = [0.9, 2.15];

  const BUILDINGS = [
    { id: 'boutique', name: '부티크 · 옷장', icon: 'hat', gx: 2, gy: 2, w: 4, d: 3, h: 46, sprite: Sprites.boutique, door: [4.0, 5.6] },
    { id: 'chateau', name: '샤토 · 기록장', icon: 'book', gx: 9, gy: 1, w: 6, d: 4, h: 64, sprite: Sprites.chateau, door: [12, 5.6] },
    { id: 'cave', name: '와인 저장고 · 미니게임', icon: 'game', gx: 17, gy: 1, w: 5, d: 4, h: 56, sprite: Sprites.barn, door: [19.5, 5.6] },
  ];
  const POND = { cx: 3.2, cy: 22.2, rx: 2.4, ry: 1.5 };
  const inPond = (gx, gy, m = 0) => ((gx - POND.cx) / (POND.rx + m)) ** 2 + ((gy - POND.cy) / (POND.ry + m)) ** 2 < 1;
  const LAMPS = [[7.6, 5.75], [16.4, 5.75], [10.75, 11], [13.25, 15], [10.75, 19.2]];
  const LIGHTS = [
    ...LAMPS.map(([x, y]) => [x, y, 22, 40]),
    [9.8, 5, 15, 22], [10.8, 5, 15, 22], [13.3, 5, 15, 22], [14.3, 5, 15, 22], [11.4, 5, 16, 16], [12.7, 5, 16, 16],
    [2.9, 5, 11, 22], [5.1, 5, 11, 22], [17.8, 5, 16, 18], [21.2, 5, 16, 18],
  ];

  // 정적 오브젝트 (외곽선 스프라이트 + 깊이 정렬)
  const sp = (fn, ...a) => () => { const cv = fn(...a); return { cv, ox: cv.width >> 1, oy: cv.height - 2 }; };
  const PROPS = [
    ...LAMPS.map(([gx, gy]) => ({ gx, gy, r: 0.15, sprite: sp(Sprites.lantern) })),
    { gx: 23.0, gy: 3.0, r: 0.6, sprite: sp(Sprites.haystack) }, { gx: 23.1, gy: 4.6, r: 0.6, sprite: sp(Sprites.haystack) },
    { gx: 16.3, gy: 2.0, r: 0.3, sprite: sp(Sprites.barrel) }, { gx: 16.5, gy: 3.0, r: 0.3, sprite: sp(Sprites.barrel) },
    { gx: 16.2, gy: 4.2, r: 0.35, sprite: sp(Sprites.crate, 'meoru') }, { gx: 15.6, gy: 4.6, r: 0.35, sprite: sp(Sprites.crate, 'shine') },
    { gx: 1.2, gy: 4.6, r: 0.35, sprite: sp(Sprites.crate, 'kyoho') },
    { gx: 9.5, gy: 5.4, r: 0, sprite: sp(Sprites.flowers) }, { gx: 14.6, gy: 5.4, r: 0, sprite: sp(Sprites.flowers) },
    { gx: 8.6, gy: 21.8, r: 0.3, sprite: sp(Sprites.scarecrow) },
    { gx: 0.9, gy: 11.5, r: 0.45, sprite: sp(Sprites.tree, false) }, { gx: 23.1, gy: 11.5, r: 0.45, sprite: sp(Sprites.tree, true) },
    { gx: 0.9, gy: 16.5, r: 0.45, sprite: sp(Sprites.tree, true) }, { gx: 23.1, gy: 16.8, r: 0.45, sprite: sp(Sprites.tree, false) },
    { gx: 14.0, gy: 22.6, r: 0.45, sprite: sp(Sprites.tree, true) }, { gx: 7.0, gy: 7.1, r: 0, sprite: sp(Sprites.flowers) },
    { gx: 6.3, gy: 21.2, r: 0.25, sprite: sp(Sprites.rock) }, { gx: 18.0, gy: 20.8, r: 0.25, sprite: sp(Sprites.rock) },
    { gx: 0.8, gy: 7.6, r: 0.4, sprite: sp(Sprites.bush) }, { gx: 23.2, gy: 7.8, r: 0.4, sprite: sp(Sprites.bush) },
  ];

  const INTER = [
    ...PLOTS.map((p, i) => ({ kind: 'plot', i, x0: p.gx, y0: p.gy, x1: p.gx + p.w, y1: p.gy + p.d, h: 30, approach: [p.gx + 2, p.gy + p.d + 0.45], range: 0.55 })),
    ...BUILDINGS.map(b => ({ kind: 'building', id: b.id, x0: b.gx, y0: b.gy, x1: b.gx + b.w, y1: b.gy + b.d, h: b.h, approach: b.door, range: 1.0, door: true })),
  ];
  const rectDist = (x, y, it) => Math.hypot(Math.max(it.x0 - x, 0, x - it.x1), Math.max(it.y0 - y, 0, y - it.y1));
  const interDist = (it, x, y) => it.door ? Math.hypot(x - it.approach[0], y - it.approach[1]) : rectDist(x, y, it);

  // 충돌 (격자 좌표)
  const solids = [
    ...BUILDINGS.map(b => [b.gx, b.gy, b.gx + b.w, b.gy + b.d]),
    ...PROPS.filter(p => p.r > 0).map(p => [p.gx - p.r, p.gy - p.r, p.gx + p.r, p.gy + p.r]),
    ...PLOTS.flatMap(p => ROW_OFF.map(o => [p.gx + 0.05, p.gy + o - 0.2, p.gx + p.w - 0.05, p.gy + o + 0.2])),
  ];
  function blocked(x, y) {
    if (x < 0.5 || y < 0.5 || x > N - 0.5 || y > N - 0.5) return true;
    if (inPond(x, y, 0.15)) return true;
    const r = 0.22;
    return solids.some(([a, b, c, d]) => x + r > a && x - r < c && y + r > b && y - r < d);
  }

  // ───── 상태 ─────
  let canvas, ctx, bg = null, bgUnlocked = -1, fg = null, state = null, hooks = {};
  let zoom = 3, dpr = 1, t = 0, last = 0, running = false, tod = 'auto';
  const BG_OX = 720, BG_OY = 200;
  const cam = { x: 0, y: 200, snap: true };
  const player = { gx: 12, gy: 6.9, dir: 'down', frame: 0, ft: 0, moving: false, target: null, onArrive: null, stuck: 0 };
  const keys = new Set();
  let particles = [], floats = [], near = null, hovered = null, marker = null, smokeT = 0;
  const butterflies = Array.from({ length: 6 }, (_, i) => ({ gx: 3 + i * 3.4, gy: 8 + (i % 3) * 5, a: i * 1.3, col: ['#ffffff', '#f9e27a', '#f7a1c4', '#b9e0ff', '#ffffff', '#f9e27a'][i] }));
  const fireflies = Array.from({ length: 30 }, () => ({ gx: 1 + Math.random() * 22, gy: 8 + Math.random() * 15, p: Math.random() * 10 }));
  const clouds = Array.from({ length: 3 }, (_, i) => ({ x: -500 + i * 380, y: 60 + i * 120, s: 0.9 + i * 0.25 }));
  const habitAt = i => state && state.habits.find(h => h.plot === i);

  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

  // ───── 바닥 (정적) ─────
  function tileType(gx, gy) {
    if (gx < 0 || gy < 0 || gx >= N || gy >= N) return 'F';
    for (let i = 0; i < PLOTS.length; i++) {
      const p = PLOTS[i];
      if (gx >= p.gx && gx < p.gx + p.w && gy >= p.gy && gy < p.gy + p.d) return i < bgUnlocked ? 's' : 'w';
    }
    if ((gy === 6 || gy === 7) && gx >= 0) return 'p';
    if ((gx === 11 || gx === 12) && gy >= 6 && gy < 23) return 'p';
    if (gx >= 15 && gx < 23 && gy >= 21 && gy < 24) return 'L';
    return 'g';
  }
  function renderBG() {
    bg = Pix.canvas(1440, 860);
    const c = bg.getContext('2d'), rnd = rng(11);
    c.fillStyle = '#3f6a30'; c.fillRect(0, 0, bg.width, bg.height);
    const O = (gx, gy, z = 0) => { const [x, y] = iso(gx, gy, z); return [x + BG_OX, y + BG_OY]; };
    const diamond = (gx, gy, col) => Pix.poly(c, [O(gx, gy), O(gx + 1, gy), O(gx + 1, gy + 1), O(gx, gy + 1)], col);
    const COLORS = {
      g: ['#7cbc4c', '#78b848', '#80c050'], F: ['#4f8a3a', '#4b8636', '#538e3e'], p: ['#d8b07a', '#d3aa72', '#dcb682'],
      s: ['#8f5e38', '#8a5a34', '#946240'], w: ['#5f9e40', '#5b9a3c', '#63a244'], L: ['#6aa84a', '#66a446', '#6aa84a'],
    };
    for (let gy = -10; gy < N + 10; gy++) for (let gx = -10; gx < N + 10; gx++) {
      const ty = tileType(gx, gy);
      diamond(gx, gy, COLORS[ty][rnd() * 3 | 0]);
    }
    // 잔디 · 꽃 · 길 가장자리
    for (let gy = -10; gy < N + 10; gy++) for (let gx = -10; gx < N + 10; gx++) {
      const ty = tileType(gx, gy), [x, y] = O(gx + 0.5, gy + 0.5);
      if (ty === 'g' || ty === 'F' || ty === 'w') {
        const dark = ty === 'F' ? '#3d7030' : ty === 'w' ? '#477e30' : '#5f9e3c';
        const n = ty === 'w' ? 5 : 2;
        for (let k = 0; k < n; k++) if (rnd() < 0.7) { const tx = x + (rnd() * 18 - 9) | 0, ty2 = y + (rnd() * 8 - 4) | 0; R(c, tx, ty2, 1, 2, dark); R(c, tx + 2, ty2, 1, 2, dark); R(c, tx + 1, ty2 + 1, 1, 2, dark); }
        if (ty === 'g' && rnd() < 0.12) { const fx = x + (rnd() * 16 - 8) | 0, fy = y + (rnd() * 6 - 3) | 0; R(c, fx, fy, 2, 2, ['#ffffff', '#ffe066', '#f7a1c4', '#c9b6ef'][rnd() * 4 | 0]); R(c, fx, fy + 2, 1, 1, '#4f8f37'); }
      }
      if (ty === 'p') {
        for (let k = 0; k < 4; k++) R(c, x + (rnd() * 20 - 10) | 0, y + (rnd() * 8 - 4) | 0, 1, 1, rnd() < 0.5 ? '#c49a63' : '#e8cba0');
        if (rnd() < 0.3) { const px = x + (rnd() * 12 - 6) | 0, py = y + (rnd() * 4 - 2) | 0; R(c, px, py, 3, 2, '#b8a890'); R(c, px, py, 2, 1, '#d8cbb6'); }
        const edge = (nx, ny, a, b) => { if (tileType(nx, ny) !== 'p') { const A = O(...a), B = O(...b); Pix.line(c, A[0], A[1], B[0], B[1], '#b98a50'); } };
        edge(gx, gy - 1, [gx, gy], [gx + 1, gy]); edge(gx + 1, gy, [gx + 1, gy], [gx + 1, gy + 1]);
        edge(gx, gy + 1, [gx, gy + 1], [gx + 1, gy + 1]); edge(gx - 1, gy, [gx, gy], [gx, gy + 1]);
      }
    }
    // 밭: 고랑 + 나무 테두리
    PLOTS.forEach((p, i) => {
      if (i < bgUnlocked) {
        for (let g = p.gy + 0.25; g < p.gy + p.d; g += 0.5) {
          const A = O(p.gx + 0.1, g), B = O(p.gx + p.w - 0.1, g);
          Pix.line(c, A[0], A[1], B[0], B[1], '#6e4428'); Pix.line(c, A[0], A[1] - 1, B[0], B[1] - 1, '#a57850');
        }
      }
      const e = [[p.gx, p.gy], [p.gx + p.w, p.gy], [p.gx + p.w, p.gy + p.d], [p.gx, p.gy + p.d]];
      for (let k = 0; k < 4; k++) { const A = O(...e[k]), B = O(...e[(k + 1) % 4]); Pix.line(c, A[0], A[1], B[0], B[1], i < bgUnlocked ? '#5e3a20' : '#4a7a32'); Pix.line(c, A[0], A[1] + 1, B[0], B[1] + 1, i < bgUnlocked ? '#7a5230' : '#5f9e40'); }
    });
    // 연못
    const ell = (m, col) => { const pts = []; for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; pts.push(O(POND.cx + Math.cos(a) * (POND.rx + m), POND.cy + Math.sin(a) * (POND.ry + m))); } Pix.poly(c, pts, col); };
    ell(0.35, '#e2c48f'); ell(0.18, '#2a1a24'); ell(0.1, '#5aa9d6'); ell(-0.5, '#4a98c8');
    for (const [gx, gy] of [[2.2, 21.6], [3.9, 22.9], [4.4, 21.5]]) { const [x, y] = O(gx, gy); R(c, x, y, 7, 3, '#5fa043'); R(c, x + 1, y, 4, 1, '#78c25a'); R(c, x + 5, y + 1, 2, 1, '#4a98c8'); }
    { const [x, y] = O(3.9, 22.9); R(c, x + 2, y - 1, 2, 2, '#f7a1c4'); }
    // 라벤더 밭
    for (let g = 21.3; g < 23.9; g += 0.42) {
      for (let gx = 15.1; gx < 22.9; gx += 0.13) {
        const [x, y] = O(gx, g);
        R(c, x, y - 1, 2, 2, '#4f7d3a');
        const col = (gx * 10 | 0) % 3 ? '#9b7fd1' : '#8a6cc4';
        R(c, x, y - 5, 2, 4, col); R(c, x, y - 5, 1, 1, '#c9b6ef');
      }
    }
    // 뒤쪽 숲 (항상 플레이어 뒤)
    const trees = [];
    for (let gx = -6; gx < N + 2; gx += 1.3) for (const gy of [-1.2, -2.9, -4.6]) trees.push([gx + (rnd() - 0.5) * 0.6, gy + (rnd() - 0.5) * 0.5]);
    for (let gy = 0; gy < N + 2; gy += 1.3) for (const gx of [-1.2, -2.9, -4.6]) trees.push([gx + (rnd() - 0.5) * 0.6, gy + (rnd() - 0.5) * 0.5]);
    trees.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(([gx, gy]) => {
      const cv = rnd() < 0.45 ? Sprites.cypress(34 + (rnd() * 12 | 0)) : Sprites.tree(rnd() < 0.15);
      const [x, y] = O(gx, gy); c.drawImage(cv, x - (cv.width >> 1), y - cv.height + 2);
    });
    // 앞쪽 경계: 덤불 (전경 레이어)
    fg = Pix.canvas(1440, 860);
    const f = fg.getContext('2d'), bushCv = Sprites.bush();
    const front = [];
    for (let g = 0; g <= N; g += 0.75) { front.push([N + 0.35, g]); front.push([g, N + 0.35]); }
    front.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1])).forEach(([gx, gy]) => { const [x, y] = O(gx, gy); f.drawImage(bushCv, x - 9, y - 11); });
  }

  // ───── 입력 ─────
  const toWorld = (cx, cy) => [(cx * dpr + Math.round(cam.x * zoom - canvas.width / 2)) / zoom, (cy * dpr + Math.round(cam.y * zoom - canvas.height / 2)) / zoom];
  function hitTest(wx, wy) {
    for (const it of INTER) {
      for (let z = 0; z <= it.h; z += 6) {
        const [gx, gy] = toGrid(wx, wy + z);
        if (gx >= it.x0 && gx < it.x1 && gy >= it.y0 && gy < it.y1) return it;
      }
    }
    return null;
  }
  function walkTo(g, cb) { player.target = g; player.onArrive = cb; player.stuck = 0; }
  function act(it) { if (it.kind === 'plot') hooks.onPlot(it.i); else hooks.onBuilding(it.id); }
  function onPointerDown(e) {
    if (UI.isBlocking()) return;
    const [wx, wy] = toWorld(e.clientX, e.clientY), hit = hitTest(wx, wy);
    if (hit) { if (interDist(hit, player.gx, player.gy) < hit.range + 0.3) act(hit); else walkTo(hit.approach, () => act(hit)); }
    else { const g = toGrid(wx, wy); walkTo(g, null); marker = { g, t: 0 }; }
  }
  function onPointerMove(e) {
    const [wx, wy] = toWorld(e.clientX, e.clientY);
    hovered = hitTest(wx, wy);
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  }
  function onKey(e, down) {
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key.toLowerCase();
    if (down) keys.add(k); else keys.delete(k);
    if (UI.isBlocking()) return;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (down && !e.repeat && (k === 'e' || k === ' ' || k === 'enter') && near) act(near);
  }

  // ───── 업데이트 ─────
  function arrive() { const cb = player.onArrive; player.target = null; player.onArrive = null; player.stuck = 0; if (cb) cb(); }
  function update(dt) {
    t += dt;
    const blocking = UI.isBlocking();
    let sx = 0, sy = 0;
    if (!blocking) {
      if (keys.has('arrowleft') || keys.has('a')) sx--;
      if (keys.has('arrowright') || keys.has('d')) sx++;
      if (keys.has('arrowup') || keys.has('w')) sy--;
      if (keys.has('arrowdown') || keys.has('s')) sy++;
    }
    let mx = 0, my = 0;
    if (sx || sy) { player.target = null; mx = sx / 2 + sy; my = sy - sx / 2; }
    else if (player.target && !blocking) {
      const dx = player.target[0] - player.gx, dy = player.target[1] - player.gy, d = Math.hypot(dx, dy);
      if (d < 0.08) arrive(); else { mx = dx; my = dy; }
    }
    player.moving = !!(mx || my);
    if (player.moving) {
      const len = Math.hypot(mx, my); mx /= len; my /= len;
      const sp = 3.4 * dt, ox = player.gx, oy = player.gy;
      if (!blocked(player.gx + mx * sp, player.gy)) player.gx += mx * sp;
      if (!blocked(player.gx, player.gy + my * sp)) player.gy += my * sp;
      const scx = mx - my, scy = (mx + my) / 2;
      player.dir = Math.abs(scx) > Math.abs(scy) * 1.6 ? (scx > 0 ? 'right' : 'left') : (scy > 0 ? 'down' : 'up');
      player.ft += dt;
      if (player.target) {
        player.stuck = Math.hypot(player.gx - ox, player.gy - oy) < sp * 0.3 ? player.stuck + dt : 0;
        if (player.stuck > 0.35) arrive();
      }
    } else player.ft = 0;
    player.frame = player.moving ? Math.floor(player.ft * 8) % 4 : 0;

    near = null;
    let best = 1e9;
    for (const it of INTER) { const d = interDist(it, player.gx, player.gy); if (d < it.range && d < best) { best = d; near = it; } }

    const [px, py] = iso(player.gx, player.gy);
    const vw = canvas.width / zoom, vh = canvas.height / zoom;
    const tx = clamp(px, -400 + vw / 2, 400 - vw / 2) || 0, ty = clamp(py - 10, -80 + vh / 2, 430 - vh / 2) || 190;
    const fx = vw >= 800 ? 0 : tx, fy = vh >= 510 ? 175 : ty;
    if (cam.snap) { cam.x = fx; cam.y = fy; cam.snap = false; }
    else { cam.x += (fx - cam.x) * Math.min(1, dt * 6); cam.y += (fy - cam.y) * Math.min(1, dt * 6); }

    particles = particles.filter(p => { p.t += dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.t < p.life; });
    floats = floats.filter(f => (f.t += dt) < 1.4);
    if (marker && (marker.t += dt) > 0.5) marker = null;
    smokeT += dt;
    if (smokeT > 0.4) {
      smokeT = 0;
      for (const [gx, gy] of [[10.35, 2.25], [13.65, 2.25]]) { const [x, y] = iso(gx, gy, 66); particles.push({ x: x + Math.random() * 3, y, vx: 4 + Math.random() * 3, vy: -10, life: 2.6, t: 0, col: '#e8e8ee', s: 2, smoke: true }); }
    }
    butterflies.forEach(b => {
      b.a += (Math.random() - 0.5) * 3 * dt; b.gx += Math.cos(b.a) * 0.7 * dt; b.gy += Math.sin(b.a) * 0.7 * dt;
      if (b.gx < 1 || b.gx > N - 1 || b.gy < 7 || b.gy > N - 1) b.a += Math.PI;
    });
    clouds.forEach(cl => { cl.x += 7 * dt; if (cl.x > 640) cl.x = -640; });
  }

  // ───── 그리기 ─────
  function todMode() {
    if (tod !== 'auto') return tod;
    const h = new Date().getHours();
    return h >= 6 && h < 16 ? 'day' : h >= 16 && h < 19 ? 'golden' : h >= 19 && h < 21 ? 'dusk' : 'night';
  }
  function shadow(x, y, rx, ry) {
    ctx.fillStyle = 'rgba(30,40,20,.28)';
    for (let k = -ry; k <= ry; k++) { const w = Math.round(rx * Math.sqrt(1 - (k / (ry + 0.5)) ** 2)); ctx.fillRect(Math.round(x - w), Math.round(y + k), w * 2, 1); }
  }
  const blit = (s, gx, gy) => { const [x, y] = iso(gx, gy); ctx.drawImage(s.cv, Math.round(x - s.ox), Math.round(y - s.oy)); };
  const objKey = (x0, y0, x1, y1) => clamp(player.gx, x0, x1) + clamp(player.gy, y0, y1);

  function rowsFor(h) {
    const v = VARIETIES[h.variety], total = h.grapes.length, size = v.size, harvested = h.harvested || 0;
    const growth = total === 0 ? 0 : Math.min(1, 0.35 + total / 30);
    const cap = Math.max(1, Math.floor((3.6 * growth + 0.2) / 0.85));
    const nb = Math.ceil(total / size), start = Math.max(0, nb - cap * 2);
    const list = [];
    for (let k = start; k < nb; k++) list.push({ frac: Math.min(size, total - k * size) / size, harvested: k < harvested });
    const half = Math.ceil(list.length / 2);
    return [list.slice(0, half), list.slice(half)].map((b, ri) => Sprites.vineRow(h.variety, b, growth, `${h.id}|${ri}|${total}|${harvested}|${h.variety}`));
  }

  function draw() {
    const cw = canvas.width, ch = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#3f6a30'; ctx.fillRect(0, 0, cw, ch);
    const ox = Math.round(cam.x * zoom - cw / 2), oy = Math.round(cam.y * zoom - ch / 2);
    const S = (x, y) => [x * zoom - ox, y * zoom - oy];
    ctx.setTransform(zoom, 0, 0, zoom, -ox, -oy);
    ctx.drawImage(bg, -BG_OX, -BG_OY);

    // 물결
    for (let k = 0; k < 7; k++) {
      if (Math.sin(t * 2 + k * 1.7) < 0) continue;
      const [x, y] = iso(POND.cx + Math.sin(t * 0.5 + k * 2.1) * 1.4, POND.cy - 0.8 + (k * 0.27) % 1.6);
      R(ctx, Math.round(x), Math.round(y), 4, 1, '#bfe6fa');
    }
    // 하이라이트 · 클릭 표시
    const hl = hovered || near;
    if (hl) {
      const a = 0.55 + Math.sin(t * 6) * 0.3, col = `rgba(255,246,190,${a})`;
      const e = [[hl.x0, hl.y0], [hl.x1, hl.y0], [hl.x1, hl.y1], [hl.x0, hl.y1]].map(([x, y]) => iso(x, y));
      for (let k = 0; k < 4; k++) Pix.line(ctx, e[k][0], e[k][1], e[(k + 1) % 4][0], e[(k + 1) % 4][1], col);
    }
    if (marker) {
      const [x, y] = iso(...marker.g), s = 4 + marker.t * 14;
      ctx.globalAlpha = 1 - marker.t / 0.5;
      Pix.poly(ctx, [[x, y - s / 2], [x + s, y], [x, y + s / 2], [x - s, y]], '#fff6c4');
      Pix.poly(ctx, [[x, y - s / 2 + 1], [x + s - 2, y], [x, y + s / 2 - 1], [x - s + 2, y]], 'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
    }

    // 그림자
    { const [x, y] = iso(player.gx, player.gy); shadow(x, y, 6, 2); }
    PROPS.forEach(p => { if (p.r > 0.3) { const [x, y] = iso(p.gx, p.gy); shadow(x, y, p.r * 22, p.r * 9); } });

    // 깊이 정렬해서 그리기
    const ds = [];
    BUILDINGS.forEach(b => ds.push({ k: objKey(b.gx, b.gy, b.gx + b.w, b.gy + b.d), f: () => blit(b.sprite(), b.gx, b.gy) }));
    PROPS.forEach(p => ds.push({ k: objKey(p.gx, p.gy, p.gx, p.gy), f: () => blit(p.sprite(), p.gx, p.gy) }));
    PLOTS.forEach((p, i) => {
      if (i >= state.plotsUnlocked) {
        if (i === state.plotsUnlocked) ds.push({ k: objKey(p.gx + 2, p.gy + 1.5, p.gx + 2, p.gy + 1.5), f: () => { const s = Sprites.plotSign(); blit({ cv: s, ox: s.width >> 1, oy: s.height - 2 }, p.gx + 2, p.gy + 1.5); } });
        return;
      }
      const h = habitAt(i);
      if (!h) return;
      const rows = rowsFor(h);
      ROW_OFF.forEach((o, ri) => ds.push({ k: objKey(p.gx + 0.2, p.gy + o, p.gx + 3.8, p.gy + o), f: () => blit(rows[ri], p.gx, p.gy + o) }));
    });
    ds.push({ k: player.gx + player.gy, f: () => { const s = Sprites.charSprite(state.look, state.gender, player.dir, player.frame); const [x, y] = iso(player.gx, player.gy); ctx.drawImage(s, Math.round(x) - 10, Math.round(y) - 27); } });
    ds.sort((a, b) => a.k - b.k).forEach(d => d.f());
    ctx.drawImage(fg, -BG_OX, -BG_OY);

    particles.forEach(p => {
      ctx.globalAlpha = p.smoke ? Math.max(0, 0.75 - p.t / p.life) : Math.max(0, 1 - p.t / p.life);
      const s = p.smoke ? p.s + (p.t * 1.6 | 0) : p.s;
      R(ctx, Math.round(p.x), Math.round(p.y), s, s, p.col);
    });
    ctx.globalAlpha = 1;

    const mode = todMode();
    if (mode === 'day' || mode === 'golden') butterflies.forEach(b => {
      const [x, y] = iso(b.gx, b.gy, 14 + Math.sin(t * 3 + b.a) * 3), f = Math.sin(t * 22 + b.a) > 0;
      R(ctx, Math.round(x) - (f ? 2 : 1), Math.round(y), f ? 2 : 1, 2, b.col); R(ctx, Math.round(x) + 1, Math.round(y), f ? 2 : 1, 2, b.col); R(ctx, Math.round(x), Math.round(y), 1, 2, '#3b2a1c');
    });
    ctx.fillStyle = 'rgba(20,40,10,.08)';
    clouds.forEach(cl => { ctx.beginPath(); ctx.ellipse(cl.x, cl.y, 90 * cl.s, 34 * cl.s, 0, 0, Math.PI * 2); ctx.fill(); });

    // 시간대 조명
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const TINT = { golden: 'rgb(255,210,160)', dusk: 'rgb(200,160,205)', night: 'rgb(78,92,165)' }[mode];
    if (TINT) {
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = TINT; ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'lighter';
      if (mode !== 'golden') {
        const k = mode === 'night' ? 1 : 0.55;
        LIGHTS.forEach(([gx, gy, z, lr]) => {
          const [wx, wy] = iso(gx, gy, z), [sx, sy] = S(wx, wy), rr = lr * zoom * (1 + Math.sin(t * 3 + gx) * 0.03);
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
          g.addColorStop(0, `rgba(255,200,110,${0.45 * k})`); g.addColorStop(1, 'rgba(255,170,80,0)');
          ctx.fillStyle = g; ctx.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
        });
        if (mode === 'night') fireflies.forEach(f => {
          const a = Math.max(0, Math.sin(t * 2 + f.p));
          const [wx, wy] = iso(f.gx + Math.sin(t * 0.6 + f.p) * 0.6, f.gy + Math.cos(t * 0.5 + f.p) * 0.4, 10);
          const [sx, sy] = S(wx, wy), rr = 5 * zoom;
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, rr);
          g.addColorStop(0, `rgba(230,255,140,${a})`); g.addColorStop(1, 'rgba(230,255,140,0)');
          ctx.fillStyle = g; ctx.fillRect(sx - rr, sy - rr, rr * 2, rr * 2);
        });
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    drawLabels(S);
  }

  // ───── 라벨 (픽셀 폰트) ─────
  const fontPx = () => 9 * Math.max(1, Math.round(dpr * 1.5));
  function label(text, sx, sy, o = {}) {
    const fs = fontPx() * (o.big ? 1.25 : 1), u = Math.max(1, Math.round(fs / 9));
    ctx.font = `${fs}px Galmuri9, Galmuri11, monospace`;
    const icon = o.icon ? Pix.icon(o.icon) : null, is = icon ? 14 * u : 0;
    const tw = Math.ceil(ctx.measureText(text).width) + (icon ? is + 3 * u : 0);
    const padX = 5 * u, hh = Math.max(fs, is) + 6 * u;
    const x = Math.round(sx - tw / 2 - padX), y = Math.round(sy - hh / 2), w = tw + padX * 2;
    const bgc = o.bg || '#3e2414', bd = o.border || '#1e1008';
    ctx.fillStyle = bd; ctx.fillRect(x + u, y, w - 2 * u, hh); ctx.fillRect(x, y + u, w, hh - 2 * u);
    ctx.fillStyle = bgc; ctx.fillRect(x + u, y + u, w - 2 * u, hh - 2 * u);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + 2 * u, y + u, w - 4 * u, u);
    let cx = x + padX;
    if (icon) { ctx.imageSmoothingEnabled = false; ctx.drawImage(icon, cx, Math.round(y + (hh - is) / 2), is, is); cx += is + 3 * u; }
    ctx.fillStyle = o.color || '#fff6e3'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, y + hh / 2 + u);
  }
  function iconAt(name, sx, sy) { const u = Math.max(2, Math.round(dpr * 2)), ic = Pix.icon(name); ctx.drawImage(ic, Math.round(sx - 7 * u), Math.round(sy - 7 * u), 14 * u, 14 * u); }

  function drawLabels(S) {
    ctx.imageSmoothingEnabled = false;
    const today = Logic.todayStr(), u = Math.max(1, Math.round(dpr * 1.5));
    let hintDone = false;
    PLOTS.forEach((p, i) => {
      const [sx, sy] = S(...iso(p.gx + p.w / 2 + 0.3, p.gy + p.d + 0.3));
      if (i >= state.plotsUnlocked) {
        if (i === state.plotsUnlocked) label(`부지 확장  ${PLOT_COSTS[i].bunches}송이 · ${PLOT_COSTS[i].coins}`, sx, sy, { icon: 'lock', bg: '#2e2a26' });
        return;
      }
      const h = habitAt(i);
      if (!h) {
        label('포도나무 심기', sx, sy, { icon: 'sprout', bg: '#fff6e3', color: '#5e3a20', border: '#5e3a20' });
        if (!state.habits.length && !hintDone) {
          hintDone = true;
          const [hx, hy] = S(...iso(p.gx + 2, p.gy + 1.5, 26));
          label('여기를 눌러 심어보세요!', hx, hy + Math.round(Math.sin(t * 5) * 3) * u, { bg: '#6b3fa0', border: '#2a1a24', big: true });
        }
        return;
      }
      const info = Logic.bunchInfo(h), v = VARIETIES[h.variety], done = h.grapes.some(g => g.date === today);
      const cur = info.partial === 0 && info.total > 0 && info.harvestable > 0 ? info.size : info.partial;
      label(`${h.name} ${cur}/${v.size}`, sx, sy, { icon: done ? 'check' : 'grape', bg: done ? '#2f5a22' : '#3e2414' });
      const [ix, iy] = S(...iso(p.gx + 2, p.gy + 1.5, 36));
      const bob = Math.round(Math.sin(t * 4 + i) * 2) * u;
      if (info.harvestable > 0) label('수확!', ix, iy + bob, { icon: 'basket', bg: '#f4c542', color: '#5e3a20', border: '#2a1a24', big: true });
      else if (!done) iconAt('drop', ix, iy + bob);
    });
    BUILDINGS.forEach(b => { const [sx, sy] = S(...iso(b.door[0], b.door[1] + 0.2)); label(b.name, sx, sy + 8 * u, { icon: b.icon, bg: '#7a4a2a', border: '#2a1a24' }); });
    const [px, py] = S(...iso(player.gx, player.gy, 33));
    label(state.nickname, px, py, { bg: '#fff6e3', color: '#3e2414', border: '#2a1a24' });
    if (near) {
      let text;
      if (near.kind === 'building') text = BUILDINGS.find(b => b.id === near.id).name.split(' · ')[0] + ' 들어가기';
      else { const h = habitAt(near.i); text = near.i >= state.plotsUnlocked ? '부지 확장하기' : h ? `${h.name} 돌보기` : '새 포도나무 심기'; }
      label(`[E] ${text}`, px, py - 22 * u, { bg: '#fff6e3', color: '#3e2414', border: '#2a1a24', big: true });
    }
    floats.forEach(f => {
      const [sx, sy] = S(f.x, f.y);
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
      label(f.text, sx, sy - f.t * 30 * u, { icon: f.icon, bg: '#6b3fa0', border: '#2a1a24' });
      ctx.globalAlpha = 1;
    });
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (state) {
      if (state.plotsUnlocked !== bgUnlocked) { bgUnlocked = state.plotsUnlocked; renderBG(); }
      update(dt); draw();
    }
    requestAnimationFrame(frame);
  }
  function resize() {
    dpr = window.devicePixelRatio || 1;
    const w = innerWidth, h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const zc = Math.max(2, Math.min(5, Math.floor(Math.min(w / 440, h / 280))));
    zoom = Math.max(1, Math.round(zc * dpr));
    cam.snap = true;
  }

  // ───── 외부 API ─────
  function init(cv, hk) {
    canvas = cv; ctx = cv.getContext('2d'); hooks = hk;
    resize();
    addEventListener('resize', resize);
    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onPointerMove);
    addEventListener('keydown', e => onKey(e, true));
    addEventListener('keyup', e => onKey(e, false));
    addEventListener('blur', () => keys.clear());
  }
  function start() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  function setState(s) { state = s; }
  function setTimeMode(m) { tod = m; }
  function burst(i, kind) {
    const p = PLOTS[i];
    if (!p) return;
    const cols = {
      grape: ['#b58fd1', '#7a4b98', '#fff3b0', '#e8d5ff'], harvest: ['#f4c542', '#fff3b0', '#ffd76a', '#ffffff'],
      plant: ['#9b6b42', '#7a4e2a', '#78c25a', '#5fa043'], unlock: ['#78c25a', '#fff3b0', '#a9e07a', '#ffffff'],
    }[kind];
    const [cx, cy] = iso(p.gx + 2, p.gy + 1.5, 14);
    for (let k = 0; k < (kind === 'harvest' ? 80 : 44); k++) {
      particles.push({ x: cx + (Math.random() - 0.5) * 60, y: cy + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 80, vy: -Math.random() * 90 - 20, g: 150, life: 0.8 + Math.random() * 0.7, t: 0, col: cols[k % cols.length], s: Math.random() < 0.35 ? 2 : 1 });
    }
  }
  function floatText(i, text, icon) { const p = PLOTS[i]; if (!p) return; const [x, y] = iso(p.gx + 2, p.gy + 1.5, 30); floats.push({ x, y, text, icon, t: 0 }); }
  function walkToPlot(i) { const it = INTER.find(x => x.kind === 'plot' && x.i === i); if (it) walkTo(it.approach, () => act(it)); }

  return { init, start, setState, setTimeMode, burst, floatText, walkToPlot, todMode, PLOTS };
})();
