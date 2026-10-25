'use strict';
// ───────── 이스터에그: 비밀의 연못 (물고기·해초 피해 헤엄치기) ─────────
const Pond = (() => {
  const W = 240, H = 160, SX = 72, R = Pix.R, { disc } = Pix; // SX: 헤엄치는 캐릭터의 x 위치
  const cache = {};
  const memo = (k, fn) => cache[k] || (cache[k] = fn());

  // ───── 스프라이트 ─────
  function swimmer(look, frame) {
    return memo(`sw|${JSON.stringify(look)}|${frame}`, () => {
      const L = Sprites.look(look), S = L.skin.c, H = L.hc.c, T = L.top, B = L.bottom;
      return Pix.make(20, 11, c => {
        const k = frame % 2;
        R(c, 0, 3 + k, 6, 2, B.c); R(c, 0, 6 - k, 6, 2, B.c);
        R(c, 0, 3 + k, 2, 2, S); R(c, 0, 6 - k, 2, 2, S);
        R(c, 5, 3, 8, 5, T.c); R(c, 5, 7, 8, 1, T.c2);
        if (frame < 2) R(c, 12, 1, 5, 2, S); else R(c, 12, 7, 5, 2, S);
        disc(c, 15, 5, 3.6, S);
        R(c, 12, 1, 6, 2, H); R(c, 11, 2, 3, 5, H);
        R(c, 15, 3, 4, 3, '#5fd3ff'); R(c, 16, 3, 1, 1, '#ffffff'); R(c, 13, 4, 2, 1, '#2a1a24');
        R(c, 18, 7, 1, 1, '#c9705f');
      });
    });
  }
  const koi = () => memo('koi', () => Pix.make(18, 9, c => {
    for (let y = 0; y < 9; y++) { const hw = Math.round(6.5 * Math.sqrt(Math.max(0, 1 - ((y - 4) / 4.6) ** 2))); R(c, 7 - hw, y, hw * 2, 1, '#f08a3c'); }
    R(c, 6, 1, 4, 3, '#fff3e6'); R(c, 9, 5, 3, 2, '#fff3e6'); R(c, 3, 2, 2, 2, '#d0602a');
    R(c, 13, 1, 2, 7, '#f08a3c'); R(c, 15, 0, 3, 3, '#f6a65c'); R(c, 15, 6, 3, 3, '#f6a65c');
    R(c, 2, 3, 1, 1, '#2a1a24'); R(c, 6, 8, 3, 1, '#f6a65c');
  }));
  const minnow = () => memo('minnow', () => Pix.make(11, 6, c => {
    R(c, 1, 1, 7, 4, '#5aa9d6'); R(c, 0, 2, 1, 2, '#5aa9d6'); R(c, 2, 3, 6, 1, '#cfeaff');
    R(c, 8, 0, 3, 2, '#3f8ac0'); R(c, 8, 4, 3, 2, '#3f8ac0'); R(c, 1, 2, 1, 1, '#2a1a24');
  }));
  const puffer = big => memo('puf' + big, () => Pix.make(16, 16, c => {
    const r = big ? 6.5 : 4.5;
    disc(c, 8, 8, r, '#f2cf4a'); disc(c, 7.4, 9.2, r * 0.6, '#fff1b0');
    if (big) for (const [x, y] of [[8, 0], [8, 15], [0, 8], [15, 8], [2, 2], [13, 2], [2, 13], [13, 13]]) R(c, x, y, 1, 1, '#c9952a');
    R(c, 5, 6, 2, 2, '#ffffff'); R(c, 5, 7, 1, 1, '#2a1a24'); R(c, 3, 9, 2, 1, '#e8584a');
    R(c, 13, 6, 2, 4, '#e0b43a');
  }));
  const pearl = () => memo('pearl', () => Pix.make(7, 7, c => { disc(c, 3.5, 3.5, 3.4, '#e8e4f4'); R(c, 2, 1, 2, 1, '#ffffff'); R(c, 1, 2, 1, 1, '#ffffff'); R(c, 4, 5, 2, 1, '#c8c0e0'); }));
  const goldGrape = () => memo('gg', () => Pix.make(10, 12, c => Sprites.drawBunch(c, 1, 3, { px: 2, c: { mid: '#f4c542', dark: '#c99a1e', hi: '#fff6c4' } }, 1)));

  // ───── 배경 ─────
  let bgCache = null;
  function makeBG() {
    const b = Pix.canvas(W, H), c = b.getContext('2d');
    const bands = ['#7fd0e8', '#5fbadc', '#4aa4cf', '#3a8ec0', '#2f78ad', '#28659a', '#225586', '#1d4774'];
    bands.forEach((col, i) => {
      R(c, 0, i * 20, W, 20, col);
      if (i) for (let x = (i % 2); x < W; x += 2) R(c, x, i * 20, 1, 1, bands[i - 1]);
    });
    for (let x = 0; x < W; x += 3) R(c, x, 0, 2, 2 + (x % 7 === 0 ? 2 : 0), '#c8f0fa');
    for (const [x, w] of [[30, 26], [120, 30], [196, 22]]) { R(c, x, 0, w, 3, '#4f9a39'); R(c, x + 3, 3, w - 6, 1, '#3f7d2e'); R(c, x + w - 6, 0, 4, 2, '#f7a1c4'); }
    for (let x = 0; x < W; x++) { const y = H - 12 + Math.round(Math.sin(x * 0.07) * 2 + Math.sin(x * 0.23)); R(c, x, y, 1, H - y, '#d8c48c'); }
    for (let i = 0; i < 40; i++) R(c, (i * 37) % W, H - 8 + (i % 5), 2, 1, i % 2 ? '#bfa870' : '#efdcaa');
    for (const [x, r] of [[40, 6], [150, 8], [210, 5]]) { disc(c, x, H - 9, r, '#6b7280'); disc(c, x - 1, H - 10, r - 2, '#8c93a0'); }
    for (let i = 0; i < 9; i++) { const x = 12 + i * 27, h = 20 + (i * 13) % 26; for (let y = 0; y < h; y++) R(c, x + Math.round(Math.sin(y * 0.3 + i) * 2), H - 12 - y, 2, 1, 'rgba(20,60,70,.35)'); }
    return b;
  }

  function open(api) {
    bgCache = bgCache || makeBG();
    let raf = 0;
    const m = UI.modal({
      title: '비밀의 연못', icon: 'drop', cls: 'mg-modal pond-modal',
      onClose: () => { cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); },
      body: `<div class="mg-wrap">
        <div class="mg-hud pond-hud"><span>점수 <b class="pd-score">0</b></span><span class="pd-hearts"></span><span>최고 <b class="pd-best">${api.best()}</b></span></div>
        <div class="mg-stage pond-stage"><canvas class="mg-canvas" width="${W}" height="${H}"></canvas><div class="mg-overlay"></div></div>
      </div>`,
    });
    const cv = m.body.querySelector('canvas'), c = cv.getContext('2d'), ov = m.body.querySelector('.mg-overlay');
    const $score = m.body.querySelector('.pd-score'), $hearts = m.body.querySelector('.pd-hearts');
    let st = 'ready', obs = [], items = [], bubbles = [], parts = [], floats = [];
    let lvl = 0, y = H / 2, ty = H / 2, hearts = 3, inv = 0, score = 0, bonus = 0, dist = 0, speed = 42, spawnT = 0, itemT = 1, gt = 0, last = 0, shake = 0;
    const keys = {};
    const kd = e => { keys[e.key] = true; if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); };
    const ku = e => { keys[e.key] = false; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const setY = e => { const r = cv.getBoundingClientRect(); ty = Math.max(12, Math.min(H - 20, (e.clientY - r.top) / r.height * H)); };
    cv.addEventListener('pointermove', setY);
    cv.addEventListener('pointerdown', setY);
    for (let i = 0; i < 14; i++) bubbles.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < 0.3 ? 2 : 1, v: 8 + Math.random() * 14 });

    function card(html) { ov.hidden = false; ov.innerHTML = `<div class="mg-card">${html}</div>`; const b = ov.querySelector('.mg-start'); if (b) b.onclick = start; }
    function showReady() {
      card(`<h3>${Pix.img('drop')} 비밀의 연못</h3>
        <p>연못 속 세상에 오신 걸 환영해요!<br>물고기와 해초를 피해 헤엄쳐 보세요.</p>
        <ul class="mg-legend"><li>진주 +5</li><li>${Pix.img('grape')}황금 포도 +30</li><li>물고기 피하기</li><li>해초 피하기</li></ul>
        <p class="mg-small">마우스·터치 위아래 또는 ↑↓ 키로 헤엄쳐요 · 무료 · 점수의 1/5을 코인으로</p>
        <button class="btn grape big mg-start">${Pix.img('drop')}잠수 시작!</button>`);
    }
    function start() {
      Sfx.splash();
      obs = []; items = []; parts = []; floats = [];
      y = ty = H / 2; lvl = 0; hearts = 3; inv = 0; score = 0; bonus = 0; dist = 0; speed = 42; spawnT = 0.6; itemT = 1; gt = 0;
      ov.hidden = true; st = 'play';
    }
    function end() {
      st = 'over';
      const r = api.finish(score);
      Sfx.fanfare();
      m.body.querySelector('.pd-best').textContent = r.best;
      card(`<h3>${r.newBest ? Pix.img('trophy') + ' 신기록!' : '뽀글뽀글… 수면 위로!'}</h3>
        <div class="mg-big">${score}<small>점</small></div>
        <p>헤엄친 거리 ${Math.floor(dist / 10)}m · 보상 ${Pix.img('coin')}<b>${r.reward}</b></p>
        <button class="btn grape big mg-start">${Pix.img('drop')}다시 잠수</button>`);
      if (r.newBest) FX.confetti(innerWidth / 2, innerHeight / 2, 90);
    }

    function spawn() {
      const r = Math.random(), lvl = Math.min(1, gt / 60);
      if (r < 0.32) obs.push({ k: 'weed', x: W + 8, h: 34 + Math.random() * (40 + lvl * 26), ph: Math.random() * 6 });
      else if (r < 0.56) obs.push({ k: 'koi', x: W + 10, y: 18 + Math.random() * (H - 50), v: 18 + Math.random() * 20, ph: Math.random() * 6 });
      else if (r < 0.74) { const by = 18 + Math.random() * (H - 60); for (let i = 0; i < 3; i++) obs.push({ k: 'minnow', x: W + 8 + i * 9, y: by + (i % 2) * 7, v: 30, ph: i }); }
      else obs.push({ k: 'puffer', x: W + 10, y: 24 + Math.random() * (H - 70), v: 8, ph: Math.random() * 6 });
    }
    function hitbox(o) {
      if (o.k === 'weed') { const top = H - 12 - o.h; return [o.x - 3, top, 7, o.h]; }
      if (o.k === 'koi') return [o.x + 2, o.y + 2, 14, 6];
      if (o.k === 'minnow') return [o.x + 1, o.y + 1, 9, 4];
      const big = Math.sin(gt * 1.6 + o.ph) > 0.2;
      return big ? [o.x + 2, o.y + 2, 13, 13] : [o.x + 4, o.y + 4, 9, 9];
    }
    const hit = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];

    function update(dt) {
      gt += dt;
      if (shake > 0) shake -= dt;
      bubbles.forEach(b => { b.y -= b.v * dt; b.x += Math.sin(gt * 2 + b.v) * 4 * dt - (st === 'play' ? speed * 0.3 * dt : 0); if (b.y < 0) { b.y = H; b.x = Math.random() * W; } if (b.x < 0) b.x += W; });
      parts = parts.filter(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.t < p.life; });
      floats = floats.filter(f => (f.t += dt) < 0.9);
      if (st !== 'play') return;
      if (keys.ArrowUp || keys.w || keys.W) ty -= 110 * dt;
      if (keys.ArrowDown || keys.s || keys.S) ty += 110 * dt;
      ty = Math.max(12, Math.min(H - 20, ty));
      y += Math.max(-95 * dt, Math.min(95 * dt, ty - y));
      // 시간이 지날수록 점점 빨라짐 (약 50초 뒤 최고 속도), 10초마다 알림
      speed = 45 + Math.min(135, gt * 2.6);
      if (Math.floor(gt / 10) > lvl) { lvl = Math.floor(gt / 10); floats.push({ x: W / 2, y: 34, text: '속도 UP!', t: 0 }); Sfx.coin(); }
      dist += speed * dt;
      inv = Math.max(0, inv - dt);
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = Math.max(0.32, 1.2 - gt * 0.018) + Math.random() * 0.3; }
      itemT -= dt;
      if (itemT <= 0) { items.push({ k: Math.random() < 0.12 ? 'gold' : 'pearl', x: W + 6, y: 16 + Math.random() * (H - 46) }); itemT = 0.9 + Math.random() * 1.2; }
      score = Math.floor(dist / 10) + bonus;
      const me = [SX + 2, y + 2, 15, 7];
      obs = obs.filter(o => {
        o.x -= (speed + (o.v || 0)) * dt;
        if (o.k === 'koi') o.y += Math.sin(gt * 2 + o.ph) * 10 * dt;
        if (o.k === 'puffer') o.y += Math.sin(gt * 1.3 + o.ph) * 14 * dt;
        if (inv <= 0 && hit(me, hitbox(o))) {
          hearts--; inv = 1.3; shake = 0.3; Sfx.bad();
          floats.push({ x: SX + 8, y, text: '앗!', t: 0 });
          for (let k = 0; k < 10; k++) parts.push({ x: SX + 10, y: y + 5, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, t: 0, life: 0.5, col: '#ffffff' });
          if (hearts <= 0) { end(); return false; }
        }
        return o.x > -30;
      });
      items = items.filter(it => {
        it.x -= speed * dt;
        if (hit(me, [it.x, it.y, 9, 10])) {
          const pts = it.k === 'gold' ? 30 : 5;
          bonus += pts; Sfx.pop();
          floats.push({ x: it.x, y: it.y, text: '+' + pts, t: 0 });
          for (let k = 0; k < 8; k++) parts.push({ x: it.x + 4, y: it.y + 4, vx: (Math.random() - 0.5) * 70, vy: (Math.random() - 0.5) * 70, t: 0, life: 0.45, col: it.k === 'gold' ? '#f4c542' : '#e8e4f4' });
          return false;
        }
        return it.x > -12;
      });
    }

    function draw() {
      const sx = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
      c.setTransform(1, 0, 0, 1, sx, 0);
      c.imageSmoothingEnabled = false;
      c.drawImage(bgCache, 0, 0);
      c.fillStyle = 'rgba(255,255,255,.07)';
      for (let k = 0; k < 4; k++) { const x0 = ((k * 70 - gt * 6) % (W + 80)) + 40; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + 18, 0); c.lineTo(x0 - 30, H); c.lineTo(x0 - 52, H); c.fill(); }
      bubbles.forEach(b => { R(c, Math.round(b.x), Math.round(b.y), b.s, b.s, 'rgba(220,250,255,.7)'); });
      obs.forEach(o => {
        if (o.k === 'weed') {
          for (let i = 0; i < o.h; i++) {
            const sway = Math.round(Math.sin(gt * 2 + o.ph + i * 0.12) * (i / o.h) * 4);
            R(c, Math.round(o.x) + sway - 2, H - 12 - i, 5, 1, i % 6 < 3 ? '#3f8a3a' : '#4f9a39');
            if (i % 9 === 4) R(c, Math.round(o.x) + sway + (i % 18 ? 3 : -5), H - 12 - i, 3, 2, '#5fb04a');
          }
          R(c, Math.round(o.x) - 3, H - 13, 7, 2, '#2f6a2a');
        } else {
          const s = o.k === 'koi' ? koi() : o.k === 'minnow' ? minnow() : puffer(Math.sin(gt * 1.6 + o.ph) > 0.2);
          c.drawImage(s, Math.round(o.x), Math.round(o.y));
        }
      });
      items.forEach(it => c.drawImage(it.k === 'gold' ? goldGrape() : pearl(), Math.round(it.x), Math.round(it.y + Math.sin(gt * 3 + it.x * 0.1) * 2)));
      if (st === 'play' || st === 'over') {
        if (!(inv > 0 && Math.floor(gt * 12) % 2)) c.drawImage(swimmer(api.look(), Math.floor(gt * 6) % 4), SX, Math.round(y) - 1);
        if (Math.floor(gt * 4) % 3 === 0) R(c, SX + 19, Math.round(y) - 2 - Math.floor(gt * 20) % 6, 2, 2, 'rgba(220,250,255,.8)');
      }
      parts.forEach(p => { c.globalAlpha = Math.max(0, 1 - p.t / p.life); R(c, Math.round(p.x), Math.round(p.y), 2, 2, p.col); });
      c.globalAlpha = 1;
      c.font = '10px Galmuri9, Galmuri11, monospace'; c.textAlign = 'center'; c.lineWidth = 3;
      floats.forEach(f => { c.globalAlpha = Math.max(0, 1 - f.t / 0.9); c.strokeStyle = '#1d4774'; c.strokeText(f.text, f.x, f.y - f.t * 18); c.fillStyle = '#fff'; c.fillText(f.text, f.x, f.y - f.t * 18); });
      c.globalAlpha = 1;
      $score.textContent = score;
      const hk = Math.max(0, hearts);
      if ($hearts.dataset.n !== String(hk)) { $hearts.dataset.n = hk; $hearts.innerHTML = Pix.img('heart').repeat(hk) + Pix.img('heartE').repeat(3 - hk); }
    }
    function loop(now) {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000 || 0));
      last = now;
      update(dt); draw();
      raf = requestAnimationFrame(loop);
    }
    showReady();
    raf = requestAnimationFrame(loop);
  }
  return { open };
})();
