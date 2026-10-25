'use strict';
// ───────── 화면 전체 이펙트: 꽃가루, 날아가는 코인 ─────────
const FX = (() => {
  let cv, c, parts = [], running = false, last = 0, dpr = 1;
  function init() { cv = document.getElementById('fx'); c = cv.getContext('2d'); resize(); addEventListener('resize', resize); }
  function resize() { dpr = devicePixelRatio || 1; cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; }
  function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); } }
  const ease = k => k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;

  function loop(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => {
      p.t += dt;
      if (p.type === 'conf') {
        p.vy += 520 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        const fh = Math.max(2, Math.round(Math.abs(Math.cos(p.t * p.flip)) * p.h / 2) * 2);
        c.fillStyle = p.col; c.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, p.w, fh);
        return p.t < p.life && p.y < innerHeight + 40;
      }
      if (p.t < 0) return true;
      const k = Math.min(1, p.t / p.dur), e = ease(k), u = 1 - e;
      const x = u * u * p.sx + 2 * u * e * p.cx + e * e * p.ex, y = u * u * p.sy + 2 * u * e * p.cy + e * e * p.ey;
      c.save(); c.translate(x, y); c.scale(Math.abs(Math.cos(p.t * 9)) * 0.8 + 0.2, 1);
      c.imageSmoothingEnabled = false; c.drawImage(Pix.icon('coin'), -14, -14, 28, 28);
      c.restore();
      if (k >= 1) { if (p.onArrive) p.onArrive(); return false; }
      return true;
    });
    if (parts.length) requestAnimationFrame(loop);
    else { running = false; c.clearRect(0, 0, innerWidth, innerHeight); }
  }

  function confetti(x = innerWidth / 2, y = innerHeight / 3, n = 150) {
    const cols = ['#f4c542', '#e8584a', '#7a4b98', '#9fd36b', '#5fb0d9', '#f48fb1', '#ffffff', '#b58fd1'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 180 + Math.random() * 440;
      parts.push({ type: 'conf', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 260, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, w: Math.random() < 0.5 ? 8 : 4, h: Math.random() < 0.5 ? 8 : 4, col: cols[i % cols.length], t: 0, life: 2.2 + Math.random(), flip: 4 + Math.random() * 8 });
    }
    kick();
  }
  function coins(sx, sy, ex, ey, n = 8, onEach) {
    for (let i = 0; i < n; i++) {
      parts.push({ type: 'coin', sx: sx + (Math.random() - 0.5) * 50, sy: sy + (Math.random() - 0.5) * 24, ex, ey, cx: (sx + ex) / 2 + (Math.random() - 0.5) * 220, cy: Math.min(sy, ey) - 60 - Math.random() * 120, t: -i * 0.06, dur: 0.7 + Math.random() * 0.25, onArrive: () => onEach && onEach(i) });
    }
    kick();
  }
  function center(el) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
  return { init, confetti, coins, center };
})();
