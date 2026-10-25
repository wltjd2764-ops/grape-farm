'use strict';
// ───────── 로그인 배경: 픽셀 노을 포도밭 (320x180) ─────────
const Scene = (() => {
  const W = 320, H = 180, R = Pix.R;
  let cv, c, back, front, raf = 0, t0 = 0;
  const clouds = [{ x: 30, y: 26, s: 1 }, { x: 150, y: 44, s: 0.7 }, { x: 250, y: 18, s: 1.2 }];
  const birds = [{ x: -20, y: 40 }, { x: -34, y: 48 }, { x: -10, y: 52 }];
  const motes = Array.from({ length: 22 }, () => ({ x: Math.random() * W, y: 90 + Math.random() * 90, p: Math.random() * 6 }));

  function hill(ctx, base, amp, freq, phase, col) {
    for (let x = 0; x < W; x++) { const y = Math.round(base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase) * amp * 0.25); R(ctx, x, y, 1, H - y, col); }
  }
  const hillY = (x, base, amp, freq, phase) => Math.round(base + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase) * amp * 0.25);

  function build() {
    back = Pix.canvas(W, H);
    const b = back.getContext('2d');
    const bands = ['#4a3a7a', '#5e4688', '#7a5296', '#9a5c98', '#bd6690', '#da7484', '#ec8a76', '#f6a46c', '#f9bd72', '#fbd286'];
    const bh = 11;
    bands.forEach((col, i) => {
      R(b, 0, i * bh, W, bh, col);
      if (i > 0) for (let x = 0; x < W; x++) if ((x + i) % 2 === 0) R(b, x, i * bh, 1, 1, bands[i - 1]);
      if (i > 0) for (let x = 0; x < W; x += 2) R(b, x + (i % 2), i * bh + 1, 1, 1, bands[i - 1]);
    });
    R(b, 0, bands.length * bh, W, H, bands[bands.length - 1]);
    // 해 (레트로 줄무늬)
    Pix.disc(b, 214, 104, 30, '#fbe2a0'); Pix.disc(b, 214, 104, 25, '#fff3c4');
    for (let k = 0; k < 5; k++) R(b, 184, 98 + k * 5 + k, 62, 1 + (k >> 1), '#f9c47a');
    // 먼 산 + 샤토 실루엣
    hill(b, 112, 6, 0.02, 1, '#9a76b0');
    hill(b, 120, 5, 0.035, 3, '#80629e');
    const cx = 72, cy = hillY(72, 120, 5, 0.035, 3);
    R(b, cx - 14, cy - 12, 28, 12, '#5e4a7e'); Pix.poly(b, [[cx - 17, cy - 12], [cx + 17, cy - 12], [cx + 11, cy - 20], [cx - 11, cy - 20]], '#5e4a7e');
    R(b, cx - 9, cy - 25, 3, 6, '#5e4a7e'); R(b, cx + 6, cy - 25, 3, 6, '#5e4a7e');
    for (const wx of [-9, -3, 3, 9]) R(b, cx + wx - 1, cy - 8, 2, 3, '#ffd27a');
    for (let k = 0; k < 6; k++) { const x = 100 + k * 7, y = hillY(x, 120, 5, 0.035, 3); for (let i = 0; i < 9; i++) { const hw = Math.max(1, Math.round(1.6 * Math.sin(Math.PI * i / 9))); R(b, x - hw, y - 9 + i, hw * 2, 1, '#4e3e6a'); } }

    front = Pix.canvas(W, H);
    const f = front.getContext('2d');
    // 중간 언덕 + 포도밭 줄
    hill(f, 132, 7, 0.018, 0.4, '#7aa04c');
    for (let r = 0; r < 6; r++) {
      for (let x = (r % 2) * 3; x < W; x += 6) {
        const y = hillY(x, 132, 7, 0.018, 0.4) + 4 + r * 5;
        R(f, x, y, 4, 2, '#4f7d36'); R(f, x + 1, y - 1, 2, 1, '#6a9a44');
        if ((x + r * 7) % 18 === 0) R(f, x + 1, y + 2, 2, 2, '#5a2f78');
      }
    }
    // 앞 언덕 + 큰 포도 줄
    hill(f, 152, 6, 0.014, 2.2, '#5f9040');
    for (let r = 0; r < 4; r++) {
      for (let x = (r % 2) * 5; x < W; x += 10) {
        const y = hillY(x, 152, 6, 0.014, 2.2) + 5 + r * 8;
        R(f, x, y - 2, 8, 4, '#3f6e2e'); R(f, x + 1, y - 3, 5, 1, '#5a8e3e'); R(f, x + 2, y - 2, 2, 1, '#7ab052');
        if ((x / 10 + r) % 3 === 0) { R(f, x + 2, y + 2, 3, 3, '#4a2762'); R(f, x + 2, y + 2, 1, 1, '#9a6fc0'); R(f, x + 3, y + 5, 1, 1, '#4a2762'); }
      }
    }
    // 사이프러스
    const cyp = (x, y, h) => { for (let i = 0; i < h; i++) { const hw = Math.max(1, Math.round(4.5 * Math.sin(Math.PI * Math.pow(i / h, 0.7)))); R(f, x - hw, y - h + i, hw * 2, 1, '#2f4e2a'); if (hw > 1) R(f, x - hw, y - h + i, 1, 1, '#45703a'); } R(f, x - 1, y, 2, 3, '#3a2a1a'); };
    cyp(18, 150, 46); cyp(32, 154, 36); cyp(292, 148, 48); cyp(306, 152, 34);
  }

  function frame(now) {
    const s = (now - t0) / 1000;
    c.drawImage(back, 0, 0);
    clouds.forEach(cl => {
      const x = Math.round(((cl.x + s * 3 * cl.s) % (W + 80)) - 40), y = cl.y;
      const w = Math.round(34 * cl.s);
      R(c, x, y + 4, w, 5, '#f7c7a4'); R(c, x + 5, y, w - 14, 5, '#fbd9b8'); R(c, x + 9, y - 3, w - 22, 3, '#fde6c8'); R(c, x + 2, y + 8, w - 4, 2, '#d99a98');
    });
    c.drawImage(front, 0, 0);
    birds.forEach((bd, i) => {
      const x = Math.round(((bd.x + s * 14) % (W + 60)) - 20), y = Math.round(bd.y + Math.sin(s * 2 + i) * 2), up = Math.sin(s * 8 + i) > 0;
      R(c, x, y, 1, 1, '#4a3050'); R(c, x - 1, y - (up ? 1 : 0), 1, 1, '#4a3050'); R(c, x + 1, y - (up ? 1 : 0), 1, 1, '#4a3050'); R(c, x - 2, y - (up ? 2 : 0), 1, 1, '#4a3050'); R(c, x + 2, y - (up ? 2 : 0), 1, 1, '#4a3050');
    });
    motes.forEach(m => {
      if (Math.sin(s * 2 + m.p) < 0.2) return;
      const y = Math.round(m.y - ((s * 6 + m.p * 10) % 40)), x = Math.round(m.x + Math.sin(s + m.p) * 3);
      R(c, x, y, 1, 1, '#fff3b0');
    });
    raf = requestAnimationFrame(frame);
  }

  function start(canvas) {
    cv = canvas; c = cv.getContext('2d');
    build();
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { cancelAnimationFrame(raf); }
  return { start, stop };
})();
