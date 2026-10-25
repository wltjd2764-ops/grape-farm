'use strict';
// ───────── 미니게임: 포도 받기 ─────────
const Minigame = (() => {
  const W = 180, H = 240, COST = 20, DURATION = 40;
  const R = Pix.R;
  const GOLD = { px: 3, c: { mid: '#f4c542', dark: '#c99a1e', hi: '#fff6c4' } };
  const VALUE = { grape: 1, shine: 2, gold: 5, bee: 0 };
  let bgCache = null;

  function makeBG() {
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    const c = b.getContext('2d');
    ['#ffb88c', '#ffc59a', '#ffd3a8', '#ffe0b6', '#ffecc4', '#fff3cf'].forEach((col, i) => R(c, 0, i * 22, W, 22, col));
    for (let y = -10; y <= 10; y++) { const w = Math.round(Math.sqrt(100 - y * y)); R(c, 130 - w, 60 + y, w * 2, 1, '#fff6d0'); }
    for (let x = 0; x < W; x++) { const h1 = 118 + Math.round(Math.sin(x * 0.045) * 7 + Math.sin(x * 0.13) * 2); R(c, x, h1, 1, H - h1, '#c8b3d8'); }
    for (let x = 0; x < W; x++) { const h2 = 138 + Math.round(Math.sin(x * 0.03 + 2) * 6); R(c, x, h2, 1, H - h2, '#9cc463'); }
    [[20, 140], [30, 142], [160, 138]].forEach(([x, y]) => { for (let i = 0; i < 22; i++) { const w = Math.max(1, Math.round(3 * Math.sin(Math.PI * Math.pow(i / 22, 0.75)))); R(c, x - w, y - 22 + i, w * 2, 1, '#4f7d3e'); } });
    for (let r = 0; r < 4; r++) {
      const y = 160 + r * 16;
      R(c, 0, y, W, 16, r % 2 ? '#86b551' : '#7fae4a');
      for (let x = (r % 2) * 4; x < W; x += 8) { R(c, x, y + 2, 6, 5, '#4f8a36'); R(c, x + 1, y + 2, 3, 2, '#6aa84a'); if ((x + r * 8) % 24 === 0) R(c, x + 2, y + 7, 2, 3, '#5a2f78'); }
    }
    R(c, 0, H - 10, W, 10, '#b98a5a');
    for (let x = 0; x < W; x += 6) R(c, x, H - 10 + (x % 12 ? 3 : 6), 3, 1, '#a0744a');
    return b;
  }

  function open(api) {
    bgCache = bgCache || makeBG();
    let raf = 0;
    const m = UI.modal({
      title: '포도 받기', icon: 'game', cls: 'mg-modal', onClose: () => { cancelAnimationFrame(raf); removeEventListener('keydown', kd); removeEventListener('keyup', ku); },
      body: `<div class="mg-wrap">
        <div class="mg-hud"><span>점수 <b class="mg-score">0</b></span><span class="mg-hearts"></span><span>남은 시간 <b class="mg-time">${DURATION}</b></span></div>
        <div class="mg-stage"><canvas class="mg-canvas" width="${W}" height="${H}"></canvas><div class="mg-overlay"></div></div>
      </div>`,
    });
    const cv = m.body.querySelector('canvas'), c = cv.getContext('2d'), ov = m.body.querySelector('.mg-overlay');
    const $score = m.body.querySelector('.mg-score'), $time = m.body.querySelector('.mg-time'), $hearts = m.body.querySelector('.mg-hearts');
    let st = 'ready', items = [], parts = [], floats = [], score = 0, hearts = 3, time = DURATION, bx = W / 2, tx = W / 2, spawnT = 0, combo = 0, shake = 0, last = 0, gt = 0;
    const keys = {};
    const kd = e => { keys[e.key] = true; }, ku = e => { keys[e.key] = false; };
    addEventListener('keydown', kd); addEventListener('keyup', ku);
    const setX = e => { const r = cv.getBoundingClientRect(); tx = Math.max(12, Math.min(W - 12, (e.clientX - r.left) / r.width * W)); };
    cv.addEventListener('pointermove', setX);
    cv.addEventListener('pointerdown', setX);

    function showReady(msg = '') {
      ov.hidden = false;
      ov.innerHTML = `<div class="mg-card">
        <h3>${Pix.img("basket")} 포도 받기</h3>
        <p>바구니를 움직여 떨어지는 포도를 받아요!</p>
        <ul class="mg-legend"><li>${Pix.img("grape")}머루 +1</li><li>${Pix.img("spark")}황금 +5</li><li>샤인머스켓 +2</li><li>벌은 피하기!</li></ul>
        <p class="mg-small">10콤보부터 점수 2배 · 받은 점수의 절반을 코인으로</p>
        <p class="mg-small">최고 기록 <b>${api.best()}</b>점 · 보유 ${Pix.img("coin")}${api.coins()}</p>
        ${msg ? `<p class="err">${msg}</p>` : ''}
        <button class="btn grape big mg-start">${Pix.img("coin")}${COST} 내고 시작</button></div>`;
      ov.querySelector('.mg-start').onclick = startGame;
    }
    function startGame() {
      if (!api.spend(COST)) { Sfx.error(); showReady('코인이 부족해요. 포도를 수확해서 모아보세요!'); return; }
      Sfx.coin();
      items = []; parts = []; floats = []; score = 0; hearts = 3; time = DURATION; combo = 0; spawnT = 0; gt = 0;
      ov.hidden = true; st = 'play';
    }
    function end() {
      st = 'over';
      const r = api.finish(score);
      Sfx.fanfare();
      ov.hidden = false;
      ov.innerHTML = `<div class="mg-card">
        <h3>${r.newBest ? Pix.img('trophy') + ' 신기록!' : '수고했어요!'}</h3>
        <div class="mg-big">${score}<small>점</small></div>
        <p>보상 ${Pix.img("coin")}<b>${r.reward}</b> · 최고 기록 ${r.best}점</p>
        <button class="btn grape big mg-start">${Pix.img("coin")}${COST} 다시 하기</button></div>`;
      ov.querySelector('.mg-start').onclick = startGame;
      if (r.newBest) FX.confetti(innerWidth / 2, innerHeight / 2, 90);
    }

    function spawn() {
      const el = DURATION - time, r = Math.random();
      const type = r < 0.14 + el * 0.004 ? 'bee' : r < 0.2 + el * 0.004 ? 'gold' : r < 0.42 ? 'shine' : 'grape';
      items.push({ type, x: 12 + Math.random() * (W - 24), y: -10, vy: 42 + el * 2.4 + Math.random() * 22, wob: Math.random() * 6 });
    }
    function update(dt) {
      gt += dt;
      if (shake > 0) shake -= dt;
      parts = parts.filter(p => { p.t += dt; p.vy += 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; return p.t < p.life; });
      floats = floats.filter(f => (f.t += dt) < 0.9);
      if (st !== 'play') return;
      time -= dt;
      if (keys.ArrowLeft || keys.a) tx -= 170 * dt;
      if (keys.ArrowRight || keys.d) tx += 170 * dt;
      tx = Math.max(12, Math.min(W - 12, tx));
      bx += (tx - bx) * Math.min(1, dt * 14);
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = Math.max(0.24, 0.8 - (DURATION - time) * 0.014); }
      items = items.filter(it => {
        it.y += it.vy * dt;
        if (it.type === 'bee') it.x += Math.sin(gt * 4 + it.wob) * 26 * dt;
        if (it.y > H - 27 && it.y < H - 15 && Math.abs(it.x - bx) <= 14) {
          if (it.type === 'bee') { hearts--; combo = 0; shake = 0.3; Sfx.bad(); floats.push({ x: it.x, y: it.y, text: '아야!', t: 0 }); }
          else {
            combo++;
            const pts = VALUE[it.type] * (combo >= 10 ? 2 : 1);
            score += pts; Sfx.pop();
            floats.push({ x: it.x, y: it.y - 4, text: '+' + pts + (combo >= 10 ? ' x2' : ''), t: 0 });
            const col = it.type === 'shine' ? '#b9e07a' : it.type === 'gold' ? '#f4c542' : '#b58fd1';
            for (let k = 0; k < 8; k++) parts.push({ x: it.x, y: it.y, vx: (Math.random() - 0.5) * 70, vy: -Math.random() * 60, t: 0, life: 0.5, col });
          }
          return false;
        }
        if (it.y > H + 10) { if (it.type !== 'bee') combo = 0; return false; }
        return true;
      });
      if (hearts <= 0 || time <= 0) { time = Math.max(0, time); end(); }
    }
    function draw() {
      const sx = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0, sy = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
      c.setTransform(1, 0, 0, 1, sx, sy);
      c.imageSmoothingEnabled = false;
      c.drawImage(bgCache, 0, 0);
      items.forEach(it => {
        const x = Math.round(it.x), y = Math.round(it.y);
        if (it.type === 'grape') Sprites.drawBunch(c, x - 4, y - 4, VARIETIES.meoru, 1);
        else if (it.type === 'shine') Sprites.drawBunch(c, x - 4, y - 4, VARIETIES.shine, 1);
        else if (it.type === 'gold') { Sprites.drawBunch(c, x - 4, y - 4, GOLD, 1); if (Math.sin(gt * 12) > 0) { R(c, x + 5, y - 6, 1, 3, '#fff'); R(c, x + 4, y - 5, 3, 1, '#fff'); } }
        else {
          const f = Math.sin(gt * 30) > 0 ? 1 : 0;
          R(c, x - 2, y - 4 - f, 3, 2, 'rgba(255,255,255,.85)'); R(c, x + 1, y - 4 - f, 3, 2, 'rgba(255,255,255,.85)');
          R(c, x - 3, y - 2, 7, 5, '#f4c542'); R(c, x - 1, y - 2, 1, 5, '#2b1d1d'); R(c, x + 1, y - 2, 1, 5, '#2b1d1d');
          R(c, x - 3, y - 1, 1, 1, '#2b1d1d'); R(c, x + 4, y, 1, 1, '#2b1d1d');
        }
      });
      const b = Math.round(bx);
      R(c, b - 8, H - 29, 1, 7, '#8a5a36'); R(c, b + 7, H - 29, 1, 7, '#8a5a36'); R(c, b - 7, H - 30, 14, 1, '#8a5a36');
      for (let i = 0; i < Math.min(8, Math.floor(score / 4)); i++) { R(c, b - 10 + i * 3, H - 24 - (i % 2), 3, 3, i % 3 ? '#5e2f8c' : '#8cc04a'); }
      R(c, b - 12, H - 21, 24, 10, '#b07a4b');
      for (let row = 0; row < 3; row++) for (let i = 0; i < 6; i++) R(c, b - 12 + i * 4 + (row % 2) * 2, H - 19 + row * 3, 2, 1, '#8a5a36');
      R(c, b - 13, H - 22, 26, 2, '#8a5a36'); R(c, b - 12, H - 22, 24, 1, '#c99566');
      parts.forEach(p => { c.globalAlpha = Math.max(0, 1 - p.t / p.life); R(c, Math.round(p.x), Math.round(p.y), 2, 2, p.col); });
      c.globalAlpha = 1;
      c.font = '10px Jua, sans-serif'; c.textAlign = 'center'; c.lineWidth = 3;
      floats.forEach(f => { c.globalAlpha = Math.max(0, 1 - f.t / 0.9); c.strokeStyle = '#4a2672'; c.strokeText(f.text, f.x, f.y - f.t * 18); c.fillStyle = '#fff'; c.fillText(f.text, f.x, f.y - f.t * 18); });
      c.globalAlpha = 1;
      if (st === 'play' && combo >= 5) { c.font = '11px Jua, sans-serif'; c.lineWidth = 3; c.strokeStyle = '#4a2672'; c.strokeText(`${combo} COMBO`, W / 2, 20); c.fillStyle = '#f4c542'; c.fillText(`${combo} COMBO`, W / 2, 20); }
      $score.textContent = score;
      $time.textContent = Math.ceil(time);
      const hk = Math.max(0, hearts); if ($hearts.dataset.n !== String(hk)) { $hearts.dataset.n = hk; $hearts.innerHTML = Pix.img('heart').repeat(hk) + Pix.img('heartE').repeat(3 - hk); }
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
  return { open, COST };
})();
