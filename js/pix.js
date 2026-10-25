'use strict';
// ───────── 픽셀 엔진: 도트 도형 · 자동 외곽선 · 픽셀 아이콘 ─────────
const Pix = (() => {
  const OUTLINE = '#2a1a24';
  const P = {
    k: '#2a1a24', w: '#ffffff', y: '#f4c542', Y: '#ffe58a', o: '#c98a1e', p: '#7a4b98', P: '#b58fd1', d: '#4a2762',
    g: '#5fa043', G: '#8fd36a', n: '#3d6e2a', b: '#8a5a36', B: '#c48a55', D: '#5e3a20', r: '#e8584a', R: '#a8342a',
    s: '#9cd2f0', S: '#4a98c8', c: '#fff6e3', e: '#8c8c9a', E: '#d0d0dc', f: '#f48fb1', l: '#ffd9b8',
  };

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function R(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function disc(c, cx, cy, r, col) {
    c.fillStyle = col;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) c.fillRect(x, y, 1, 1);
      }
    }
  }
  // 안티앨리어싱 없는 다각형 채우기 (스캔라인)
  function poly(c, pts, col) {
    c.fillStyle = col;
    const ys = pts.map(p => p[1]);
    const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y < y1; y++) {
      const sy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + (sy - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const xa = Math.round(xs[i]), xb = Math.round(xs[i + 1]);
        if (xb > xa) c.fillRect(xa, y, xb - xa, 1);
      }
    }
  }
  // 2:1 아이소메트릭 직선
  function line(c, x0, y0, x1, y1, col) {
    c.fillStyle = col;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 1, 1);
  }
  const hex = col => { const n = parseInt(col.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  // 불투명 픽셀 주위에 1px 외곽선을 둘러 새 캔버스로 (크기 +2)
  function outline(src, col = OUTLINE) {
    const w = src.width, h = src.height, out = canvas(w + 2, h + 2), oc = out.getContext('2d');
    const sd = src.getContext('2d').getImageData(0, 0, w, h).data;
    const od = oc.createImageData(w + 2, h + 2), o = od.data;
    const a = (x, y) => x >= 0 && y >= 0 && x < w && y < h && sd[(y * w + x) * 4 + 3] > 100;
    const [r, g, b] = hex(col);
    for (let y = 0; y < h + 2; y++) {
      for (let x = 0; x < w + 2; x++) {
        const sx = x - 1, sy = y - 1, i = (y * (w + 2) + x) * 4;
        if (a(sx, sy)) { const j = (sy * w + sx) * 4; o[i] = sd[j]; o[i + 1] = sd[j + 1]; o[i + 2] = sd[j + 2]; o[i + 3] = 255; }
        else if (a(sx - 1, sy) || a(sx + 1, sy) || a(sx, sy - 1) || a(sx, sy + 1)) { o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255; }
      }
    }
    oc.putImageData(od, 0, 0);
    return out;
  }
  function make(w, h, draw, ol = true) { const c = canvas(w, h); draw(c.getContext('2d')); return ol ? outline(c) : c; }

  // ───── 아이콘 (12x12 → 외곽선 포함 14x14) ─────
  const face = (c, fn) => { disc(c, 6, 6, 6, P.o); disc(c, 6, 6, 5.2, P.y); R(c, 3, 2, 3, 1, P.Y); R(c, 2, 3, 1, 2, P.Y); fn(c); };
  const ICONS = {
    coin: c => { disc(c, 6, 6, 6, P.o); disc(c, 6, 6, 5, P.y); R(c, 3, 3, 2, 1, P.Y); R(c, 3, 4, 1, 2, P.Y); R(c, 6, 3, 1, 6, P.o); R(c, 5, 4, 1, 1, P.o); R(c, 5, 8, 3, 1, P.o); },
    grape: c => {
      R(c, 6, 0, 1, 3, P.D); R(c, 7, 0, 3, 2, P.g); R(c, 8, 0, 1, 1, P.G);
      for (const [x, y] of [[3, 4.5], [6, 4.5], [9, 4.5], [4.5, 7.2], [7.5, 7.2], [6, 10]]) { disc(c, x, y, 1.8, P.d); disc(c, x - 0.3, y - 0.3, 1.2, P.p); R(c, Math.floor(x - 1), Math.floor(y - 1), 1, 1, P.P); }
    },
    basket: c => {
      R(c, 3, 1, 6, 1, P.D); R(c, 2, 2, 1, 4, P.D); R(c, 9, 2, 1, 4, P.D);
      R(c, 3, 4, 6, 2, P.p); R(c, 4, 4, 1, 1, P.P); R(c, 7, 4, 1, 1, P.P); R(c, 5, 3, 2, 1, P.g);
      R(c, 1, 6, 10, 1, P.D); R(c, 2, 7, 8, 4, P.B); R(c, 3, 11, 6, 1, P.b);
      for (const [x, y] of [[3, 8], [5, 8], [7, 8], [4, 9], [6, 9], [8, 9]]) R(c, x, y, 1, 1, P.b);
    },
    gear: c => {
      disc(c, 6, 6, 4.6, P.e);
      for (const [x, y] of [[5, 0], [5, 10], [0, 5], [10, 5], [1, 1], [9, 1], [1, 9], [9, 9]]) R(c, x, y, 2, 2, P.e);
      R(c, 4, 3, 2, 1, P.E); R(c, 3, 4, 1, 2, P.E); c.clearRect(5, 5, 2, 2);
    },
    book: c => { R(c, 2, 1, 8, 10, P.R); R(c, 3, 1, 1, 10, '#7a2a20'); R(c, 9, 2, 1, 8, P.c); R(c, 5, 3, 3, 2, P.y); R(c, 5, 7, 3, 1, '#c7493d'); },
    hat: c => { R(c, 4, 2, 4, 1, P.y); R(c, 3, 3, 6, 3, P.y); R(c, 4, 3, 2, 1, P.Y); R(c, 3, 6, 6, 1, P.r); R(c, 0, 7, 12, 2, P.y); R(c, 1, 9, 10, 1, P.o); },
    game: c => {
      R(c, 2, 3, 8, 1, P.E); R(c, 1, 4, 10, 5, P.E); R(c, 0, 5, 1, 3, P.E); R(c, 11, 5, 1, 3, P.E); R(c, 1, 9, 3, 1, P.E); R(c, 8, 9, 3, 1, P.E);
      R(c, 3, 5, 1, 3, P.k); R(c, 2, 6, 3, 1, P.k); R(c, 8, 5, 1, 1, P.r); R(c, 9, 6, 1, 1, P.S); R(c, 7, 6, 1, 1, P.y); R(c, 8, 7, 1, 1, P.g);
    },
    drop: c => {
      const rows = [[5, 2], [5, 2], [4, 4], [4, 4], [3, 6], [2, 8], [2, 8], [2, 8], [3, 6], [4, 4]];
      rows.forEach(([x, w], i) => R(c, x, i + 1, w, 1, P.S));
      R(c, 4, 6, 1, 2, P.s); R(c, 5, 5, 1, 1, P.s);
    },
    fire: c => {
      [[6, 1], [5, 2], [5, 3], [4, 4], [3, 6], [3, 7], [2, 8], [2, 8], [2, 8], [3, 6], [4, 4]].forEach(([x, w], i) => R(c, x, i + 1, w, 1, P.r));
      [[6, 1], [5, 3], [4, 4], [4, 4], [5, 2]].forEach(([x, w], i) => R(c, x, i + 6, w, 1, P.y));
    },
    heart: c => {
      [[2, 3, 7, 3], [1, 10], [1, 10], [1, 10], [2, 8], [3, 6], [4, 4], [5, 2]].forEach((r, i) => { R(c, r[0], i + 2, r[1], 1, P.r); if (r[2]) R(c, r[2], i + 2, r[3], 1, P.r); });
      R(c, 2, 3, 2, 1, '#ffb3a8');
    },
    heartE: c => { [[2, 3, 7, 3], [1, 10], [1, 10], [1, 10], [2, 8], [3, 6], [4, 4], [5, 2]].forEach((r, i) => { R(c, r[0], i + 2, r[1], 1, P.E); if (r[2]) R(c, r[2], i + 2, r[3], 1, P.E); }); },
    lock: c => { R(c, 3, 1, 6, 1, P.e); R(c, 3, 1, 1, 4, P.e); R(c, 8, 1, 1, 4, P.e); R(c, 2, 5, 8, 6, P.y); R(c, 2, 10, 8, 1, P.o); R(c, 3, 5, 6, 1, P.Y); R(c, 5, 7, 2, 3, P.k); },
    spark: c => { R(c, 5, 0, 2, 12, P.Y); R(c, 0, 5, 12, 2, P.Y); R(c, 4, 4, 4, 4, P.Y); R(c, 5, 5, 2, 2, P.w); },
    check: c => { R(c, 1, 6, 2, 2, P.g); R(c, 3, 8, 2, 2, P.g); R(c, 5, 6, 2, 2, P.g); R(c, 7, 4, 2, 2, P.g); R(c, 9, 2, 2, 2, P.g); R(c, 2, 7, 2, 2, P.g); R(c, 4, 7, 2, 2, P.g); },
    sprout: c => { R(c, 5, 5, 2, 5, P.n); R(c, 1, 3, 4, 3, P.g); R(c, 2, 2, 2, 1, P.g); R(c, 4, 5, 2, 1, P.g); R(c, 7, 2, 4, 3, P.G); R(c, 8, 1, 2, 1, P.G); R(c, 6, 4, 2, 1, P.G); R(c, 2, 10, 8, 2, P.b); },
    cal: c => { R(c, 1, 2, 10, 9, P.c); R(c, 1, 2, 10, 3, P.r); R(c, 3, 1, 1, 2, P.e); R(c, 8, 1, 1, 2, P.e); for (const [x, y] of [[3, 6], [5, 6], [7, 6], [3, 8], [7, 8]]) R(c, x, y, 1, 1, P.e); R(c, 5, 8, 1, 1, P.r); },
    pencil: c => { for (let i = 0; i < 7; i++) R(c, 8 - i, 1 + i, 2, 2, P.y); R(c, 9, 0, 2, 2, P.f); R(c, 1, 8, 2, 2, P.l); R(c, 1, 10, 1, 1, P.k); },
    axe: c => { for (let i = 0; i < 8; i++) R(c, 3 + i, 3 + i, 1, 1, P.B); R(c, 1, 1, 5, 3, P.E); R(c, 1, 3, 3, 2, P.e); R(c, 2, 1, 2, 1, P.w); },
    star: c => { [[5, 2], [5, 2], [4, 4], [0, 12], [1, 10], [2, 8], [3, 6], [2, 8], [2, 3, 7, 3], [1, 2, 9, 2]].forEach((r, i) => { R(c, r[0], i + 1, r[1], 1, P.y); if (r[2]) R(c, r[2], i + 1, r[3], 1, P.y); }); R(c, 5, 4, 1, 2, P.Y); },
    sign: c => { R(c, 1, 1, 10, 6, P.B); R(c, 1, 6, 10, 1, P.b); R(c, 3, 3, 6, 1, P.D); R(c, 5, 7, 2, 5, P.b); },
    trophy: c => { R(c, 2, 1, 8, 5, P.y); R(c, 3, 6, 6, 1, P.y); R(c, 4, 7, 4, 1, P.o); R(c, 5, 8, 2, 2, P.o); R(c, 3, 10, 6, 2, P.b); R(c, 0, 2, 2, 3, P.y); R(c, 10, 2, 2, 3, P.y); R(c, 3, 2, 2, 1, P.Y); },
    sun: c => { disc(c, 6, 6, 3.6, P.y); for (const [x, y] of [[5, 0], [5, 11], [0, 5], [11, 5], [1, 1], [10, 1], [1, 10], [10, 10]]) R(c, x, y, x === 5 || y === 5 ? 2 : 1, x === 5 || y === 5 ? 1 : 1, P.o); R(c, 0, 5, 1, 2, P.o); R(c, 11, 5, 1, 2, P.o); R(c, 5, 0, 2, 1, P.o); R(c, 5, 11, 2, 1, P.o); },
    moon: c => { disc(c, 6, 6, 5, P.Y); c.clearRect(0, 0, 0, 0); const t = canvas(12, 12), tc = t.getContext('2d'); disc(tc, 8.5, 4.5, 4.4, '#000'); c.globalCompositeOperation = 'destination-out'; c.drawImage(t, 0, 0); c.globalCompositeOperation = 'source-over'; },
    sunset: c => { disc(c, 6, 9, 5, P.o); disc(c, 6, 9, 4, '#f6a04a'); c.clearRect(0, 9, 12, 3); R(c, 0, 9, 12, 1, P.r); R(c, 2, 11, 8, 1, P.r); },
    sound: c => { R(c, 1, 4, 3, 4, P.e); R(c, 4, 3, 1, 6, P.e); R(c, 5, 2, 1, 8, P.e); R(c, 7, 4, 1, 4, P.S); R(c, 9, 2, 1, 8, P.S); },
    door: c => { R(c, 2, 1, 8, 11, P.b); R(c, 3, 2, 6, 10, P.B); R(c, 7, 7, 1, 1, P.y); },
    cloud: c => { disc(c, 4, 7.5, 3, P.w); disc(c, 7.3, 5.5, 3.6, P.w); disc(c, 9.6, 8, 2.4, P.w); R(c, 2, 8, 9, 3, P.w); R(c, 2, 10, 9, 1, P.E); R(c, 5, 3, 2, 1, P.s); },
    plus: c => { R(c, 5, 1, 2, 10, P.g); R(c, 1, 5, 10, 2, P.g); },
    // 기분
    love: c => face(c, c2 => { R(c2, 2, 4, 2, 2, P.r); R(c2, 3, 3, 1, 1, P.r); R(c2, 8, 4, 2, 2, P.r); R(c2, 8, 3, 1, 1, P.r); R(c2, 4, 8, 4, 1, P.k); R(c2, 3, 7, 1, 1, P.k); R(c2, 8, 7, 1, 1, P.k); }),
    joy: c => face(c, c2 => { R(c2, 2, 5, 1, 1, P.k); R(c2, 3, 4, 1, 1, P.k); R(c2, 4, 5, 1, 1, P.k); R(c2, 7, 5, 1, 1, P.k); R(c2, 8, 4, 1, 1, P.k); R(c2, 9, 5, 1, 1, P.k); R(c2, 4, 7, 4, 2, P.R); R(c2, 5, 9, 2, 1, P.R); }),
    smile: c => face(c, c2 => { R(c2, 4, 4, 1, 2, P.k); R(c2, 7, 4, 1, 2, P.k); R(c2, 4, 8, 4, 1, P.k); R(c2, 3, 7, 1, 1, P.k); R(c2, 8, 7, 1, 1, P.k); R(c2, 2, 6, 1, 1, P.f); R(c2, 9, 6, 1, 1, P.f); }),
    meh: c => face(c, c2 => { R(c2, 4, 4, 1, 2, P.k); R(c2, 7, 4, 1, 2, P.k); R(c2, 4, 8, 4, 1, P.k); }),
    tired: c => face(c, c2 => { R(c2, 3, 5, 2, 1, P.k); R(c2, 7, 5, 2, 1, P.k); R(c2, 4, 8, 1, 1, P.k); R(c2, 5, 9, 2, 1, P.k); R(c2, 7, 8, 1, 1, P.k); R(c2, 10, 1, 1, 2, P.S); R(c2, 9, 3, 2, 1, P.S); }),
  };
  ICONS.mood_fire = ICONS.fire;

  const cache = {}, urls = {};
  function icon(name) {
    if (!cache[name]) cache[name] = make(12, 12, ICONS[name] || ICONS.star);
    return cache[name];
  }
  function url(name) { return urls[name] || (urls[name] = icon(name).toDataURL()); }
  const img = (name, cls = '') => `<img class="pi ${cls}" src="${url(name)}" alt="" draggable="false">`;
  // "{coin} 100" 같은 문자열의 {아이콘} 토큰을 이미지로
  const fmt = s => String(s).replace(/\{(\w+)\}/g, (m, n) => ICONS[n] ? img(n) : m);

  return { P, OUTLINE, canvas, R, disc, poly, line, outline, make, icon, url, img, fmt };
})();
