'use strict';
// ───────── 스프라이트: 캐릭터 · 아이소메트릭 건물 · 포도 덩굴 · 소품 ─────────
// 모든 스프라이트는 한 번 그려서 캐시하고, Pix.outline 으로 외곽선을 두른다.
const Sprites = (() => {
  const { R, disc, poly, line } = Pix;
  const EYE = '#2a1a24';
  const cache = new Map();
  const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

  function look(l) {
    const g = s => ITEM_MAP[l && l[s]] || ITEM_MAP[DEFAULT_LOOK[s]];
    return { skin: g('skin'), hair: g('hair'), hc: g('hairColor'), hat: g('hat'), top: g('top'), bottom: g('bottom'), shoes: g('shoes') };
  }

  // ───── 캐릭터 (16x24, 발끝 y=23) → 외곽선 포함 20x30 ─────
  function charSprite(lk, gender = 'f', dir = 'down', frame = 0) {
    return memo(`ch|${JSON.stringify(lk)}|${gender}|${dir}|${frame}`, () => {
      const cv = Pix.canvas(18, 28), c = cv.getContext('2d');
      if (dir === 'left') { c.translate(18, 0); c.scale(-1, 1); }
      drawChar(c, look(lk), gender, dir === 'left' ? 'right' : dir, frame);
      return Pix.outline(cv);
    });
  }
  function drawChar(c, L, gender, dir, frame) {
    const r = (x, y, w, h, col) => R(c, x + 1, y + 3, w, h, col);
    const S = L.skin.c, SS = L.skin.c2, H = L.hc.c, HD = L.hc.c2, T = L.top, B = L.bottom, SH = L.shoes, hs = L.hair.style;
    const side = dir === 'right', back = dir === 'up', walk = frame % 2 === 1, fem = gender === 'f';

    // 다리 · 신발
    const legs = side ? (walk ? (frame === 1 ? [[3, 0], [8, 0]] : [[4, 0], [7, 0]]) : [[6, 0]])
      : [[4, frame === 1 ? -1 : 0], [9, frame === 3 ? -1 : 0]];
    for (const [lx, l] of legs) {
      if (B.style === 'pants') r(lx, 19 + l, 3, 3, B.c);
      else if (B.style === 'shorts') { r(lx, 19 + l, 3, 1, B.c); r(lx, 20 + l, 3, 2, S); }
      else r(lx, 20 + l, 3, 2, S);
      if (SH.style === 'boots') { r(lx, 20 + l, 3, 3, SH.c); r(lx, 20 + l, 3, 1, SH.c2); }
      else r(lx, 22 + l, 3, 1, SH.c);
      r(lx, 23 + l, side ? 4 : 3, 1, SH.c2);
    }
    // 하의 엉덩이 부분
    const hx = side ? 5 : 4, hw = side ? 6 : 8;
    if (B.style === 'skirt') { r(hx - 1, 17, hw + 2, 3, B.c); r(hx - 1, 19, hw + 2, 1, B.c2); }
    else { r(hx, 17, hw, 2, B.c); r(hx, 17, hw, 1, B.c2); }

    // 상체
    const tx = side ? 5 : 4, tw = side ? 6 : 8;
    r(tx, 11, tw, 6, T.c);
    r(tx, 16, tw, 1, T.c2);
    if (!side) r(11, 11, 1, 5, T.c2); else r(5, 11, 1, 5, T.c2);
    // 팔
    const arm = (x, shade) => {
      r(x, 11, 2, 3, shade ? T.c2 : T.c);
      r(x, 14, 2, 2, T.rolled ? S : (shade ? T.c2 : T.c));
      r(x, 16, 2, 1, S);
    };
    if (!side) { arm(2, false); arm(12, true); }
    // 옷 디테일
    if (T.style === 'overall') {
      if (back) { r(5, 11, 1, 6, T.c2); r(10, 11, 1, 6, T.c2); }
      else if (side) { r(9, 13, 2, 4, T.c2); r(8, 11, 1, 2, T.c2); }
      else { r(5, 13, 6, 4, T.c2); r(5, 11, 1, 2, T.c2); r(10, 11, 1, 2, T.c2); r(5, 13, 1, 1, '#f4c542'); r(10, 13, 1, 1, '#f4c542'); r(7, 14, 2, 1, '#3a5a8a'); }
    }
    if (T.style === 'suspender') {
      if (side) r(8, 11, 1, 6, T.c2); else { r(5, 11, 1, 6, T.c2); r(10, 11, 1, 6, T.c2); }
    }
    if (T.style === 'stripe') { r(side ? 5 : 2, 12, side ? 6 : 12, 1, T.c2); r(tx, 14, tw, 1, T.c2); }
    if (T.style === 'hoodie') { if (back) r(5, 11, 6, 2, T.c2); else if (!side) { r(7, 13, 2, 2, T.mark); r(5, 15, 6, 1, T.c2); } }
    if (T.style === 'apron') {
      if (back) r(4, 13, 8, 1, T.c2);
      else if (side) r(10, 12, 2, 8, T.c2);
      else { r(5, 12, 6, 8, T.c2); r(6, 11, 1, 1, T.c2); r(9, 11, 1, 1, T.c2); r(6, 15, 4, 1, '#5e1a30'); }
    }
    if (T.kerchief && !back) { if (side) r(9, 11, 3, 1, '#c0392b'); else { r(6, 11, 4, 1, '#c0392b'); r(7, 12, 2, 1, '#c0392b'); } }
    if (side) { const ax = walk ? (frame === 1 ? 9 : 6) : 7; r(ax, 11, 2, 3, T.c2); r(ax, 14, 2, 2, T.rolled ? S : T.c2); r(ax, 16, 2, 1, S); }

    // 뒤로 늘어지는 머리
    if (hs === 'long' && back) r(3, 10, 10, 4, H);

    // 얼굴
    if (side) { r(6, 4, 6, 6, S); r(7, 10, 4, 1, S); r(12, 7, 1, 1, S); r(7, 7, 1, 2, SS); }
    else { r(4, 4, 8, 6, S); r(5, 10, 6, 1, S); r(3, 7, 1, 2, S); r(12, 7, 1, 2, S); }
    if (!back) {
      if (side) {
        r(10, 7, 1, 2, EYE);
        if (fem) { r(11, 7, 1, 1, EYE); r(10, 9, 2, 1, '#f4a6a6'); } else r(10, 6, 2, 1, HD);
      } else {
        r(6, 7, 1, 2, EYE); r(9, 7, 1, 2, EYE);
        if (fem) { r(5, 7, 1, 1, EYE); r(10, 7, 1, 1, EYE); r(5, 9, 1, 1, '#f4a6a6'); r(10, 9, 1, 1, '#f4a6a6'); }
        else { r(6, 6, 1, 1, HD); r(9, 6, 1, 1, HD); }
        r(7, 10, 2, 1, '#c9705f');
      }
    }

    // 머리카락
    if (hs === 'bun') { r(6, -1, 4, 2, H); r(7, -1, 2, 1, HD); }
    r(5, 1, 6, 1, H); r(4, 2, 8, 1, H); r(3, 3, 10, 2, H);
    if (back) {
      r(3, 5, 10, 5, H); r(4, 10, 8, 1, HD);
      if (hs === 'bob') r(2, 6, 12, 4, H);
    } else if (side) {
      r(3, 5, 4, hs === 'short' ? 2 : 4, H); r(10, 5, 2, 1, HD);
      if (hs === 'long') r(3, 5, 3, 9, H);
      if (hs === 'bob') r(3, 5, 4, 5, H);
    } else {
      r(4, 5, 2, 1, HD); r(9, 5, 3, 1, HD);
      if (hs === 'short' || hs === 'bun') { r(3, 5, 1, 2, H); r(12, 5, 1, 2, H); }
      if (hs === 'bob') { r(3, 5, 1, 5, H); r(12, 5, 1, 5, H); r(2, 6, 1, 4, H); r(13, 6, 1, 4, H); }
      if (hs === 'long') { r(2, 5, 2, 9, H); r(12, 5, 2, 9, H); r(2, 13, 2, 1, HD); r(12, 13, 2, 1, HD); }
      if (hs === 'braids') { r(3, 5, 1, 3, H); r(12, 5, 1, 3, H); }
    }
    if (hs === 'braids') {
      for (const x of side ? [3] : [2, 13]) { r(x, 8, 1, 7, H); r(x, 10, 1, 1, HD); r(x, 12, 1, 1, HD); r(x, 15, 1, 1, '#e74c3c'); }
    }

    // 모자
    const ht = L.hat;
    switch (ht.style) {
      case 'straw':
        r(4, -1, 8, 4, ht.c); r(5, -1, 3, 1, '#f6dc93'); r(4, 2, 8, 1, ht.c2);
        r(side ? 1 : 0, 3, side ? 15 : 16, 1, ht.c); r(side ? 2 : 1, 4, side ? 13 : 14, 1, '#c99a40'); break;
      case 'cap':
        r(4, -1, 8, 1, ht.c); r(3, 0, 10, 3, ht.c); r(5, 0, 3, 1, '#a88866'); r(7, -1, 2, 1, ht.c2);
        if (side) r(11, 3, 4, 1, ht.c2); else r(3, 3, 10, 1, ht.c2); break;
      case 'beret':
        r(4, 0, 8, 1, ht.c); r(3, 1, 11, 2, ht.c); r(3, 2, 11, 1, ht.c2); r(7, -1, 1, 1, ht.c2); break;
      case 'bandana':
        r(3, 1, 10, 3, ht.c); r(5, 1, 1, 1, ht.c2); r(8, 2, 1, 1, ht.c2); r(11, 1, 1, 1, ht.c2); r(4, 3, 1, 1, ht.c2);
        if (back || side) r(back ? 7 : 2, 4, 2, 2, ht.c); break;
      case 'flower':
        r(3, 2, 10, 1, '#5a9a3a'); r(3, 0, 2, 2, '#f48fb1'); r(6, 1, 2, 1, '#fff59d'); r(9, 0, 2, 2, '#fdfdfd'); r(12, 1, 1, 2, '#f48fb1');
        r(4, 1, 1, 1, '#e91e63'); r(10, 1, 1, 1, '#f4c542'); break;
      case 'crown':
        r(4, 0, 8, 3, '#f4c542'); r(4, -1, 1, 1, '#f4c542'); r(7, -2, 2, 2, '#f4c542'); r(11, -1, 1, 1, '#f4c542');
        r(4, 2, 8, 1, '#d4a017'); r(7, 1, 2, 1, '#7d3c98'); r(8, -2, 1, 1, '#fff6c4'); break;
    }
  }

  // ───── 작은 포도송이 (외곽선 없이, 농장/미니게임용) ─────
  const T_SMALL = [[0, 0], [1, 0], [2, 0], [3, 0], [0.5, 1], [1.5, 1], [2.5, 1], [1, 2], [2, 2], [1.5, 3]];
  const T_BIG = [[0, 0], [1, 0], [2, 0], [0.5, 1], [1.5, 1], [1, 2]];
  const UNRIPE = { mid: '#a9cf74', dark: '#7ba84b', hi: '#d9f0b0', light: '#c2e290' };
  const bunchWidth = v => (v.px >= 4 ? 3 : 4) * v.px;
  function drawBunch(c, x, y, v, frac, opts = {}) {
    const s = v.px, T = (s >= 4 ? T_BIG : T_SMALL).map(([u, w]) => [Math.round(u * s), Math.round(w * s)]), bw = bunchWidth(v);
    const ripe = frac >= 1 ? T.length : Math.min(T.length - 1, Math.ceil(frac * T.length));
    const cx = x + (bw >> 1);
    R(c, cx - 1, y - 3, 1, 3, '#6b4a2b'); R(c, cx, y - 3, 2, 1, '#5fa043');
    T.forEach(([dx, dy], i) => {
      const col = i < ripe ? v.c : UNRIPE;
      R(c, x + dx, y + dy, s, s, col.mid);
      R(c, x + dx, y + dy + s - 1, s, 1, col.dark);
      R(c, x + dx + s - 1, y + dy, 1, s, col.dark);
      R(c, x + dx, y + dy, 1, 1, col.hi);
      if (s >= 4) R(c, x + dx + 1, y + dy, 1, 1, col.hi);
    });
    if (opts.harvested) { R(c, cx - 3, y - 2, 2, 2, '#f4c542'); R(c, cx - 3, y - 2, 1, 1, '#fff3b0'); }
  }

  // ───── 스티커판용 포도알 · 로고용 큰 송이 ─────
  function grapeSticker(variety) {
    return memo('stk|' + variety, () => {
      const v = VARIETIES[variety];
      return Pix.make(14, 14, c => {
        disc(c, 7, 7, 7, v.c.dark); disc(c, 6.5, 6.5, 6, v.c.mid); disc(c, 5.6, 5.4, 3.6, v.c.light);
        R(c, 3, 4, 2, 1, v.c.hi); R(c, 4, 3, 2, 1, v.c.hi); R(c, 3, 5, 1, 1, v.c.hi); R(c, 9, 10, 1, 1, v.c.light);
      });
    });
  }
  function emptySticker() {
    return memo('stk-empty', () => {
      const cv = Pix.canvas(16, 16), c = cv.getContext('2d');
      disc(c, 8, 8, 7.5, '#d4b88a');
      disc(c, 8, 8, 6.4, '#fffaf0');
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8), a = Math.atan2(y + 0.5 - 8, x + 0.5 - 8);
        if (d > 6.4 && d <= 7.5 && Math.floor((a + Math.PI) / (Math.PI / 8)) % 2) c.clearRect(x, y, 1, 1);
      }
      disc(c, 6, 6, 1.2, '#ffffff');
      return cv;
    });
  }
  function stemSprite() {
    return memo('stem', () => Pix.make(18, 12, c => {
      R(c, 8, 4, 2, 8, '#6b4a2b'); R(c, 9, 2, 2, 3, '#6b4a2b'); R(c, 10, 1, 2, 2, '#6b4a2b');
      disc(c, 4.5, 5, 4.2, '#4f9a39'); disc(c, 4, 4.5, 2.8, '#6fbf4f'); R(c, 2, 3, 2, 1, '#9be07a');
      R(c, 12, 3, 3, 1, '#7fbf5a'); R(c, 15, 4, 1, 2, '#7fbf5a'); R(c, 14, 6, 1, 1, '#7fbf5a');
    }));
  }
  function bigBunch(variety) {
    return memo('big|' + variety, () => {
      const v = VARIETIES[variety];
      return Pix.make(26, 30, c => {
        R(c, 12, 0, 2, 6, '#6b4a2b'); R(c, 13, 0, 3, 2, '#6b4a2b');
        disc(c, 18, 4, 4, '#4f9a39'); disc(c, 17.4, 3.4, 2.6, '#6fbf4f'); R(c, 16, 2, 2, 1, '#9be07a');
        const rows = [[4, 9], [4, 13.5], [3, 18], [2, 22.5], [1, 27]];
        rows.forEach(([n, y], ri) => {
          for (let k = 0; k < n; k++) {
            const x = 13 - (n - 1) * 2.6 + k * 5.2 + (ri === 1 ? 1 : 0);
            disc(c, x, y, 3, v.c.dark); disc(c, x - 0.4, y - 0.4, 2.4, v.c.mid); R(c, Math.floor(x - 2), Math.floor(y - 2), 2, 1, v.c.hi); R(c, Math.floor(x - 2), Math.floor(y - 1), 1, 1, v.c.light);
          }
        });
      });
    });
  }

  // ───── 아이소메트릭 헬퍼 ─────
  const I3 = (T, gx, gy, z = 0) => [T[0] + (gx - gy) * 16, T[1] + (gx + gy) * 8 - z];
  function box(c, p, gx, gy, w, d, z, h, top, left, right) {
    const q = (a, b, zz) => p(gx + a, gy + b, z + zz);
    poly(c, [q(0, d, 0), q(w, d, 0), q(w, d, h), q(0, d, h)], left);
    poly(c, [q(w, 0, 0), q(w, d, 0), q(w, d, h), q(w, 0, h)], right);
    poly(c, [q(0, 0, h), q(w, 0, h), q(w, d, h), q(0, d, h)], top);
  }
  const quadL = (c, p, D, a, z, w, h, col) => poly(c, [p(a, D, z), p(a + w, D, z), p(a + w, D, z + h), p(a, D, z + h)], col);
  const quadR = (c, p, W, b, z, w, h, col) => poly(c, [p(W, b, z), p(W, b + w, z), p(W, b + w, z + h), p(W, b, z + h)], col);
  const seg = (c, a, b, col) => line(c, a[0], a[1], b[0], b[1], col);

  // 박공지붕 건물. st: 색 + 디테일 콜백
  function building(W, D, h, rh, st) {
    const pad = 34, T = [(D + 1) * 16, h + rh + pad];
    const cv = Pix.canvas((W + D + 2) * 16, T[1] + (W + D) * 8 + 10), c = cv.getContext('2d');
    const p = (gx, gy, z = 0) => I3(T, gx, gy, z), o = 0.35;
    poly(c, [p(-o, D / 2, h + rh), p(W + o, D / 2, h + rh), p(W + o, -o, h - 2), p(-o, -o, h - 2)], st.roofB);
    if (st.chimneys) st.chimneys(c, p, W, D, h, rh);
    poly(c, [p(0, D), p(W, D), p(W, D, h), p(0, D, h)], st.wallL);
    poly(c, [p(W, 0), p(W, D), p(W, D, h), p(W, 0, h)], st.wallR);
    poly(c, [p(W, 0, h), p(W, D, h), p(W, D / 2, h + rh)], st.wallR);
    st.walls(c, p, W, D, h, rh);
    poly(c, [p(-o, D / 2, h + rh), p(W + o, D / 2, h + rh), p(W + o, D + o, h - 2), p(-o, D + o, h - 2)], st.roof);
    for (let k = 1; k < 6; k++) {
      const t = k / 6, gy = D / 2 + (D / 2 + o) * t, z = h + rh - (rh + 2) * t;
      seg(c, p(-o, gy, z), p(W + o, gy, z), st.roofLine);
    }
    seg(c, p(-o, D / 2, h + rh), p(W + o, D / 2, h + rh), st.ridge);
    seg(c, p(-o, D + o, h - 2), p(W + o, D + o, h - 2), st.ridge);
    if (st.after) st.after(c, p, W, D, h, rh);
    return { cv: Pix.outline(cv), ox: T[0] + 1, oy: T[1] + 1 };
  }
  function window2(c, p, D, a, z, w, h, frame, glass) {
    quadL(c, p, D, a - 0.05, z - 1, w + 0.1, h + 2, frame);
    quadL(c, p, D, a, z, w, h, glass);
    quadL(c, p, D, a, z + h - 3, w, 3, '#d6ecf8');
    seg(c, p(a + w / 2, D, z), p(a + w / 2, D, z + h), frame);
    seg(c, p(a, D, z + h / 2), p(a + w, D, z + h / 2), frame);
  }

  const chateau = () => memo('b-chateau', () => building(6, 4, 34, 24, {
    wallL: '#efe2c4', wallR: '#d2bf98', roof: '#5d6d86', roofB: '#46546a', roofLine: '#4b5970', ridge: '#3a4558',
    chimneys(c, p) { box(c, p, 1.1, 1.0, 0.5, 0.5, 44, 22, '#a8936b', '#c9b38a', '#b09a72'); box(c, p, 4.4, 1.0, 0.5, 0.5, 44, 22, '#a8936b', '#c9b38a', '#b09a72'); },
    walls(c, p, W, D, h) {
      for (const z of [7, 15, 23, 31]) for (let a = (z % 16 ? 0.2 : 0.55); a < W - 0.3; a += 0.75) seg(c, p(a, D, z), p(a + 0.4, D, z), '#dccaa3');
      for (const z of [7, 15, 23, 31]) for (let b = (z % 16 ? 0.2 : 0.5); b < D - 0.3; b += 0.75) seg(c, p(W, b, z), p(W, b + 0.4, z), '#bfac86');
      quadL(c, p, D, 0, 0, W, 3, '#cdb88f'); quadR(c, p, W, 0, 0, D, 3, '#b39f78');
      for (const a of [0.55, 1.55, 4.0, 5.0]) {
        quadL(c, p, D, a - 0.25, 8, 0.2, 13, '#7f9cc4'); quadL(c, p, D, a + 0.6, 8, 0.2, 13, '#7f9cc4');
        window2(c, p, D, a, 8, 0.55, 13, '#ffffff', '#8fbde0');
        quadL(c, p, D, a - 0.1, 5, 0.75, 3, '#8a5a3a');
        for (let k = 0; k < 4; k++) { const q = p(a - 0.05 + k * 0.2, D, 8); R(c, q[0], q[1] - 1, 2, 2, k % 2 ? '#f48fb1' : '#e8506a'); }
        window2(c, p, D, a + 0.05, 24, 0.45, 8, '#ffffff', '#8fbde0');
      }
      quadL(c, p, D, 2.5, 0, 1.0, 23, '#cdb88f');
      quadL(c, p, D, 2.6, 0, 0.8, 21, '#7a4a2a'); quadL(c, p, D, 2.68, 0, 0.64, 19, '#94603a');
      seg(c, p(3.0, D, 0), p(3.0, D, 19), '#5e3820');
      const k1 = p(2.88, D, 9), k2 = p(3.12, D, 9); R(c, k1[0], k1[1], 1, 1, '#f4c542'); R(c, k2[0], k2[1], 1, 1, '#f4c542');
      for (const a of [2.3, 3.6]) { quadL(c, p, D, a, 13, 0.12, 6, '#3b3b3b'); quadL(c, p, D, a + 0.02, 14, 0.08, 3, '#f6d365'); }
      for (const b of [0.7, 2.6]) { quadR(c, p, W, b - 0.2, 8, 0.18, 13, '#6f8ab0'); quadR(c, p, W, b, 8, 0.6, 13, '#ffffff'); quadR(c, p, W, b + 0.05, 9, 0.5, 11, '#7aa7cc'); quadR(c, p, W, b + 0.62, 8, 0.18, 13, '#6f8ab0'); }
      quadR(c, p, W, 1.7, h + 6, 0.6, 8, '#ffffff'); quadR(c, p, W, 1.78, h + 7, 0.44, 6, '#7aa7cc');
      for (let k = 0; k < 26; k++) { const q = p(0.05 + (k % 3) * 0.12, D, 2 + k * 1.2); R(c, q[0] - 1, q[1], 3, 2, k % 3 ? '#4f8f37' : '#6aae4a'); }
    },
  }));

  const boutique = () => memo('b-boutique', () => building(4, 3, 26, 16, {
    wallL: '#f8dfe3', wallR: '#e2bcc4', roof: '#c06a7a', roofB: '#9c5562', roofLine: '#a85a6a', ridge: '#7e3f4a',
    walls(c, p, W, D, h) {
      quadL(c, p, D, 0, 0, W, 3, '#d9a8b2'); quadR(c, p, W, 0, 0, D, 3, '#c3929c');
      seg(c, p(0.02, D, 0), p(0.02, D, h), '#fff'); seg(c, p(W - 0.02, D, 0), p(W - 0.02, D, h), '#fff');
      quadL(c, p, D, 0.3, 4, 1.2, 14, '#8a5a36'); quadL(c, p, D, 0.36, 5, 1.08, 12, '#a9d8ee'); quadL(c, p, D, 0.36, 14, 1.08, 3, '#d6ecf8');
      quadL(c, p, D, 0.75, 6, 0.3, 7, '#c0392b'); quadL(c, p, D, 0.82, 13, 0.16, 2, '#f2c4a0');
      quadL(c, p, D, 2.5, 4, 1.2, 14, '#8a5a36'); quadL(c, p, D, 2.56, 5, 1.08, 12, '#a9d8ee'); quadL(c, p, D, 2.56, 14, 1.08, 3, '#d6ecf8');
      quadL(c, p, D, 2.9, 6, 0.4, 6, '#f7f3ea'); seg(c, p(2.9, D, 8), p(3.3, D, 8), '#2c3e72'); seg(c, p(2.9, D, 10), p(3.3, D, 10), '#2c3e72');
      quadL(c, p, D, 1.68, 0, 0.66, 19, '#7a4a2a'); quadL(c, p, D, 1.76, 9, 0.5, 8, '#a9d8ee');
      quadR(c, p, W, 0.8, 7, 1.4, 11, '#ffffff'); quadR(c, p, W, 0.88, 8, 1.24, 9, '#93c4de');
      quadR(c, p, W, 1.25, h + 4, 0.5, 6, '#ffffff'); quadR(c, p, W, 1.32, h + 5, 0.36, 4, '#93c4de');
    },
    after(c, p, W, D) {
      for (let i = 0; i < 9; i++) {
        const a0 = 0.1 + i * 0.42, a1 = a0 + 0.42;
        poly(c, [p(a0, D, 22), p(a1, D, 22), p(a1, D + 0.6, 17), p(a0, D + 0.6, 17)], i % 2 ? '#fff4f2' : '#e8798c');
        poly(c, [p(a0 + 0.06, D + 0.6, 17), p(a1 - 0.06, D + 0.6, 17), p((a0 + a1) / 2, D + 0.6, 15)], i % 2 ? '#fff4f2' : '#e8798c');
      }
    },
  }));

  const barn = () => memo('b-barn', () => building(5, 4, 28, 22, {
    wallL: '#c0453a', wallR: '#9a382f', roof: '#5b5560', roofB: '#433e48', roofLine: '#4d4852', ridge: '#35303a',
    walls(c, p, W, D, h, rh) {
      for (let a = 0.25; a < W; a += 0.25) seg(c, p(a, D, 0), p(a, D, h), '#a83c32');
      for (let b = 0.25; b < D; b += 0.25) { const top = h + rh * (1 - Math.abs(b - D / 2) / (D / 2)); seg(c, p(W, b, 0), p(W, b, Math.min(h, top)), '#87322a'); }
      for (const [a, b] of [[[0.02, D], [0.02, D]], [[W - 0.02, D], [W - 0.02, D]]]) seg(c, p(a[0], a[1], 0), p(b[0], b[1], h), '#f3e9dc');
      seg(c, p(W, 0.02, 0), p(W, 0.02, h), '#f3e9dc');
      seg(c, p(0, D, h - 1), p(W, D, h - 1), '#f3e9dc'); seg(c, p(W, 0, h - 1), p(W, D, h - 1), '#e2d5c4');
      quadL(c, p, D, 1.7, 0, 1.6, 24, '#f3e9dc'); quadL(c, p, D, 1.8, 0, 1.4, 22, '#8e3329');
      seg(c, p(1.8, D, 0), p(3.2, D, 22), '#f3e9dc'); seg(c, p(1.8, D, 22), p(3.2, D, 0), '#f3e9dc'); seg(c, p(2.5, D, 0), p(2.5, D, 22), '#f3e9dc');
      for (const a of [0.55, 4.0]) { quadL(c, p, D, a, 12, 0.5, 9, '#f3e9dc'); quadL(c, p, D, a + 0.07, 13, 0.36, 7, '#5e2a22'); }
      quadR(c, p, W, 1.55, h + 3, 0.9, 10, '#f3e9dc'); quadR(c, p, W, 1.65, h + 4, 0.7, 8, '#5e2a22');
      for (let k = 0; k < 3; k++) { const q = p(W, 1.75 + k * 0.18, h + 5); R(c, q[0], q[1], 2, 2, '#e9c46a'); }
      for (const [x, y] of [[0, 0], [1, 0], [2, 0], [0.5, 1], [1.5, 1], [1, 2]]) { const q = p(2.3 + x * 0.14, D, 27 - y * 2.2); R(c, q[0], q[1], 2, 2, '#7a4b98'); }
    },
  }));

  // ───── 나무 · 소품 ─────
  const tree = (fruit = false) => memo('tree' + fruit, () => Pix.make(30, 36, c => {
    R(c, 13, 24, 4, 12, '#6b4226'); R(c, 13, 24, 1, 12, '#8a5a36'); R(c, 11, 34, 8, 2, '#6b4226');
    for (const [x, y, r] of [[15, 13, 11], [8, 18, 7], [22, 18, 7], [15, 22, 8]]) disc(c, x, y, r, '#2f6a2a');
    for (const [x, y, r] of [[14, 12, 9.5], [8, 16.5, 5.5], [21, 16.5, 5.5], [15, 20, 6]]) disc(c, x, y, r, '#4f9a39');
    for (const [x, y, r] of [[11, 8, 4.5], [6, 14, 2.5], [17, 6, 2.2]]) disc(c, x, y, r, '#78c25a');
    for (const [x, y] of [[9, 6], [12, 5], [5, 13], [16, 4]]) R(c, x, y, 1, 1, '#a6e080');
    if (fruit) for (const [x, y] of [[20, 12], [8, 20], [17, 21], [24, 18], [11, 14]]) { R(c, x, y, 2, 2, '#d8443a'); R(c, x, y, 1, 1, '#ff8a7a'); }
  }));
  const cypress = (h = 40) => memo('cyp' + h, () => Pix.make(14, h + 4, c => {
    R(c, 6, h, 2, 4, '#5a3820');
    for (let i = 0; i < h; i++) {
      const f = i / h, hw = Math.max(1, Math.round(6.2 * Math.sin(Math.PI * Math.pow(f, 0.7))));
      R(c, 7 - hw, i, hw * 2, 1, '#2f5e2a');
      if (hw > 2) { R(c, 7 - hw, i, Math.max(1, hw - 1), 1, (i >> 2) % 2 ? '#467a3a' : '#3d6e34'); }
    }
    for (let i = 4; i < h - 4; i += 5) R(c, 4, i, 2, 1, '#5f9a4a');
  }));
  const bush = () => memo('bush', () => Pix.make(18, 12, c => {
    disc(c, 9, 7, 6, '#2f6a2a'); disc(c, 4, 8, 4, '#2f6a2a'); disc(c, 14, 8, 4, '#2f6a2a');
    disc(c, 8.5, 6, 4.5, '#4f9a39'); disc(c, 4, 7.4, 2.6, '#4f9a39'); disc(c, 13.6, 7.4, 2.6, '#4f9a39'); R(c, 6, 3, 3, 1, '#78c25a');
  }));
  const haystack = () => memo('hay', () => Pix.make(28, 20, c => {
    for (let y = 0; y < 20; y++) { const hw = Math.round(13.5 * Math.sqrt(Math.min(1, (y + 3) / 14))); R(c, 14 - hw, y, hw * 2, 1, y > 14 ? '#c98a2e' : '#e8b04a'); }
    for (let k = 0; k < 14; k++) R(c, 4 + (k * 7) % 20, 4 + (k * 5) % 13, 3, 1, k % 2 ? '#f6d27a' : '#c98a2e');
    R(c, 9, 2, 6, 1, '#f6d27a');
  }));
  const barrel = () => memo('barrel', () => Pix.make(12, 15, c => {
    R(c, 1, 0, 10, 15, '#8a5a36'); R(c, 0, 2, 12, 11, '#8a5a36'); R(c, 2, 0, 2, 15, '#a8744a');
    R(c, 0, 3, 12, 1, '#4a3a2a'); R(c, 0, 11, 12, 1, '#4a3a2a'); R(c, 1, 0, 10, 2, '#b5835a'); R(c, 6, 0, 1, 15, '#74492b');
  }));
  const crate = variety => memo('crate' + variety, () => Pix.make(16, 14, c => {
    const v = VARIETIES[variety];
    for (let i = 0; i < 6; i++) { disc(c, 3 + i * 2, 4 + (i % 2), 1.8, v.c.mid); R(c, 2 + i * 2, 3 + (i % 2), 1, 1, v.c.hi); }
    R(c, 0, 5, 16, 9, '#c49a63'); R(c, 0, 9, 16, 1, '#a57b48'); R(c, 0, 5, 1, 9, '#a57b48'); R(c, 15, 5, 1, 9, '#a57b48'); R(c, 1, 5, 14, 1, '#dcb684');
  }));
  const lantern = () => memo('lantern', () => Pix.make(6, 24, c => {
    R(c, 2, 6, 2, 18, '#3b3b44'); R(c, 0, 22, 6, 2, '#3b3b44');
    R(c, 0, 1, 6, 6, '#3b3b44'); R(c, 1, 2, 4, 4, '#f6d365'); R(c, 1, 0, 4, 1, '#3b3b44'); R(c, 2, 2, 1, 1, '#fff6c4');
  }));
  const plotSign = () => memo('psign', () => Pix.make(18, 20, c => {
    R(c, 8, 8, 2, 12, '#7a5230'); R(c, 0, 0, 18, 10, '#e9d3a6'); R(c, 0, 9, 18, 1, '#b08a58'); R(c, 0, 0, 18, 1, '#f6e6c4');
    R(c, 3, 3, 12, 2, '#c0392b'); R(c, 5, 6, 8, 1, '#a57b48');
  }));
  const rock = () => memo('rock', () => Pix.make(12, 8, c => { disc(c, 6, 5, 4.5, '#8c8c9a'); disc(c, 5, 4, 3, '#a8a8b8'); R(c, 4, 2, 2, 1, '#c8c8d4'); c.clearRect(0, 7, 12, 1); }));
  const flowers = () => memo('flw', () => Pix.make(16, 8, c => {
    for (let k = 0; k < 6; k++) { const x = 1 + k * 2.4 | 0, y = 3 + (k % 2) * 2; R(c, x, y + 1, 1, 3, '#4f8f37'); R(c, x - 1, y - 1, 3, 2, ['#e8506a', '#f4c542', '#ffffff', '#f48fb1'][k % 4]); }
  }));
  const scarecrow = () => memo('scare', () => Pix.make(18, 28, c => {
    R(c, 8, 8, 2, 20, '#7a5230'); R(c, 1, 12, 16, 2, '#7a5230');
    R(c, 4, 11, 10, 9, '#6a8fc4'); R(c, 4, 15, 10, 1, '#4a6fa5'); R(c, 2, 12, 2, 4, '#e8b04a'); R(c, 14, 12, 2, 4, '#e8b04a');
    disc(c, 9, 6, 4, '#f3e3b8'); R(c, 7, 5, 1, 1, '#2a1a24'); R(c, 10, 5, 1, 1, '#2a1a24'); R(c, 8, 8, 2, 1, '#c0392b');
    R(c, 3, 2, 12, 1, '#e9c46a'); R(c, 5, 0, 8, 3, '#e9c46a'); R(c, 5, 2, 8, 1, '#c0392b');
  }));

  // ───── 포도 덩굴 한 줄 (gx 0~4 방향) ─────
  // 반환: { cv, ox, oy } — (ox, oy) 는 줄의 시작점(gx=0, z=0) 위치
  function vineRow(variety, bunches, growth, key) {
    return memo('row|' + key, () => {
      const v = VARIETIES[variety], O = [18, 34];
      const cv = Pix.canvas(4 * 16 + 36, 4 * 8 + 48), c = cv.getContext('2d');
      const p = (gx, z = 0) => [O[0] + gx * 16, O[1] + gx * 8 - z];
      for (const gx of [0.2, 3.8]) { const q = p(gx); R(c, q[0] - 1, q[1] - 20, 3, 20, '#7a5230'); R(c, q[0] - 1, q[1] - 20, 1, 20, '#a0703f'); R(c, q[0] - 2, q[1] - 21, 5, 1, '#5e3d22'); }
      seg(c, p(0.2, 16), p(3.8, 16), '#4b3a2a'); seg(c, p(0.2, 8), p(3.8, 8), '#6b5a48');
      const t0 = p(2);
      R(c, t0[0] - 1, t0[1] - 15, 3, 15, '#6b4226'); R(c, t0[0] - 1, t0[1] - 15, 1, 15, '#8a5a36'); R(c, t0[0] - 3, t0[1] - 8, 2, 2, '#6b4226');
      if (growth <= 0) {
        disc(c, t0[0] - 3, t0[1] - 17, 2.5, '#5fa043'); disc(c, t0[0] + 3, t0[1] - 19, 2.5, '#78c25a'); R(c, t0[0], t0[1] - 19, 1, 4, '#4f9a39');
      } else {
        const half = 1.8 * growth;
        let k = 0;
        for (let gx = 2 - half; gx <= 2 + half + 0.01; gx += 0.28, k++) {
          const q = p(gx, 16 + [0, 2, -1, 1][k % 4]);
          disc(c, q[0], q[1], 4.2, '#2f6a2a'); disc(c, q[0] - 0.6, q[1] - 0.9, 3.1, '#4f9a39');
          if (k % 2 === 0) R(c, q[0] - 2, q[1] - 3, 2, 1, '#78c25a');
        }
        const bw = bunchWidth(v), n = bunches.length;
        bunches.forEach((b, i) => {
          const gx = 2 + (i - (n - 1) / 2) * 0.85, q = p(gx, 12);
          drawBunch(c, Math.round(q[0] - bw / 2), Math.round(q[1]), v, b.frac, { harvested: b.harvested });
        });
      }
      return { cv: Pix.outline(cv), ox: O[0] + 1, oy: O[1] + 1 };
    });
  }

  return {
    look, charSprite, drawBunch, bunchWidth, grapeSticker, emptySticker, stemSprite, bigBunch,
    chateau, boutique, barn, tree, cypress, bush, haystack, barrel, crate, lantern, plotSign, rock, flowers, scarecrow, vineRow,
  };
})();
