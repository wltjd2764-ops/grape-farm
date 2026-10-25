'use strict';
// ───────── 화면 UI: HUD · 모달 · 픽셀 스티커판 ─────────
const UI = (() => {
  let user = null, state = null, shownCoins = 0, coinRaf = 0, lastLv = 0;
  const stack = [];
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const ic = Pix.img, F = Pix.fmt;
  const habit = id => state.habits.find(h => h.id === id);
  const isBlocking = () => stack.length > 0;

  // ───── 시작 · 저장 ─────
  function start(u, s) {
    user = u; state = s; shownCoins = s.coins; lastLv = 0;
    Sfx.setEnabled(s.settings.sound !== false);
    World.setTimeMode(s.settings.tod || 'auto');
    World.setState(s);
    refreshHUD();
    const acts = { today: openToday, journal: openJournal, wardrobe: openWardrobe, minigame: openMinigame };
    $$('#dock button').forEach(b => { b.onclick = () => { Sfx.click(); acts[b.dataset.act](); }; });
    $('#btn-settings').onclick = () => { Sfx.click(); openSettings(); };
    Store.onStatus(st => {
      const el = $('#hud-sync');
      el.className = 'sync-' + st;
      el.innerHTML = { local: '', saving: `${ic('cloud')}저장 중…`, saved: `${ic('cloud')}저장됨`, error: `${ic('cloud')}오프라인 · 재시도 중` }[st];
    });
    if (!s.habits.length) setTimeout(() => toast('{sprout} 빈 밭을 눌러 첫 포도나무를 심어보세요!', 4000), 900);
    else {
      const n = s.habits.filter(h => !Logic.checkedToday(h)).length;
      if (n) setTimeout(() => toast(`{drop} 오늘 돌봐야 할 포도나무가 ${n}그루 있어요`, 3200), 900);
    }
  }
  function persist() { Store.save(user, state); World.setState(state); refreshHUD(); }

  function refreshHUD() {
    const tot = Logic.totals(state), lv = Logic.levelInfo(tot.grapes);
    $('#hud-name').textContent = state.nickname;
    $('#hud-lv').textContent = 'Lv.' + lv.lv;
    $('#hud-xp').style.width = (lv.cur / lv.need * 100) + '%';
    $('#hud-grapes').textContent = tot.grapes;
    $('#hud-bunches').textContent = tot.bunches;
    tweenCoins(state.coins);
    drawAvatar($('#hud-avatar'));
    const pending = state.habits.filter(h => !Logic.checkedToday(h)).length;
    const dot = $('#dock [data-act=today] .dot');
    dot.textContent = pending; dot.hidden = !pending;
    if (lastLv && lv.lv > lastLv) setTimeout(() => { Sfx.fanfare(); toast(`{star} 농장 레벨 업! Lv.${lv.lv}`, 3000); }, 700);
    lastLv = lv.lv;
  }
  function tweenCoins(target) {
    const el = $('#hud-coins'), from = shownCoins;
    cancelAnimationFrame(coinRaf);
    if (from === target) { el.textContent = target; return; }
    const t0 = performance.now(), dur = Math.min(1200, 300 + Math.abs(target - from) * 5);
    const step = now => {
      const k = Math.max(0, Math.min(1, (now - t0) / dur));
      shownCoins = Math.round(from + (target - from) * (1 - (1 - k) ** 3));
      el.textContent = shownCoins;
      if (k < 1) coinRaf = requestAnimationFrame(step);
      else { const p = el.closest('.res-pill'); p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
    };
    coinRaf = requestAnimationFrame(step);
  }
  function drawAvatar(cv) {
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(Sprites.charSprite(state.look, state.gender, 'down', 0), 0, 1);
  }
  function flyCoins(fromEl, n) {
    const [sx, sy] = FX.center(fromEl), [ex, ey] = FX.center($('#hud-coins').closest('.res-pill'));
    FX.coins(sx, sy, ex, ey, n, i => { if (i % 3 === 0) Sfx.coin(); });
  }

  // ───── 모달 · 토스트 ─────
  function modal({ title, icon, body = '', cls = '', onClose }) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal px-panel ${cls}" role="dialog" aria-modal="true">
      <div class="modal-title"><span></span><button class="x" aria-label="닫기">X</button></div>
      <div class="modal-body"></div></div>`;
    const m = back.firstElementChild, bodyEl = $('.modal-body', m);
    $('.modal-title span', m).innerHTML = (icon ? ic(icon) : '') + title;
    if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.append(body);
    $('#modal-root').append(back);
    const api = { el: m, body: bodyEl, closed: false, close, onClose, setTitle: (tt, i2) => { $('.modal-title span', m).innerHTML = (i2 ? ic(i2) : '') + tt; } };
    function close() {
      if (api.closed) return;
      api.closed = true;
      back.classList.add('out');
      setTimeout(() => back.remove(), 160);
      stack.splice(stack.indexOf(api), 1);
      if (api.onClose) api.onClose();
    }
    $('.x', m).onclick = () => { Sfx.click(); close(); };
    back.addEventListener('pointerdown', e => { if (e.target === back) close(); });
    stack.push(api);
    return api;
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close(); });

  function toast(msg, ms = 2400) {
    const t = document.createElement('div');
    t.className = 'toast px-panel'; t.innerHTML = F(msg);
    $('#toast-root').append(t);
    setTimeout(() => t.classList.add('out'), ms);
    setTimeout(() => t.remove(), ms + 400);
  }

  // ───── 픽셀 포도 스티커판 ─────
  const urlCache = {};
  const cvUrl = (key, fn) => urlCache[key] || (urlCache[key] = fn().toDataURL());
  const stickerUrl = v => cvUrl('s' + v, () => Sprites.grapeSticker(v));
  const emptyUrl = () => cvUrl('e', () => Sprites.emptySticker());
  const stemUrl = () => cvUrl('stem', () => Sprites.stemSprite());

  function layout(variety, s) {
    const rows = VARIETIES[variety].rows, d = 16 * s, dx = Math.round(d * 0.92), dy = Math.round(d * 0.8);
    const maxRow = Math.max(...rows), top = 10 * s, W = maxRow * dx + Math.round(d * 0.6), pts = [];
    rows.forEach((n, ri) => {
      const stag = ri > 0 && rows[ri - 1] === n ? Math.round(d * 0.28) * (ri % 2 ? 1 : -1) : 0;
      for (let k = 0; k < n; k++) pts.push([Math.round(W / 2 - (n - 1) * dx / 2 + k * dx + stag - d / 2), top + ri * dy]);
    });
    return { W, H: top + (rows.length - 1) * dy + d, pts, d };
  }
  const boardScale = variety => (innerWidth < 480 ? 2 : 3) + (VARIETIES[variety].size <= 20 && innerWidth >= 480 ? 1 : 0);
  function bunchBoard(variety, grapes, opts = {}) {
    const s = boardScale(variety), L = layout(variety, s);
    let html = `<div class="bunch" style="width:${L.W}px;height:${L.H}px">
      <img class="stem" src="${stemUrl()}" style="width:${20 * s}px;left:${Math.round(L.W / 2 - 11 * s)}px;top:0" alt="">`;
    L.pts.forEach(([x, y], i) => {
      const g = grapes[i];
      const cls = g ? `stk filled${i === opts.newIdx ? ' g-new' : ''}` : `stk empty${i === opts.next ? ' g-next' : ''}`;
      html += `<button class="${cls}" data-i="${i}" style="left:${x}px;top:${y}px;width:${L.d}px;height:${L.d}px;background-image:url(${g ? stickerUrl(variety) : emptyUrl()})" title="${g ? esc(g.date) : ''}">${g ? '' : `<span>${i + 1}</span>`}</button>`;
    });
    return html + '</div>';
  }
  // 작은 미리보기용 송이 이미지 (한 장으로 합성)
  function bunchImg(variety, filled, scale = 1) {
    const url = cvUrl(`b|${variety}|${filled}`, () => {
      const L = layout(variety, 1), cv = Pix.canvas(L.W, L.H), c = cv.getContext('2d');
      c.drawImage(Sprites.stemSprite(), Math.round(L.W / 2 - 11), 0);
      L.pts.forEach(([x, y], i) => c.drawImage(i < filled ? Sprites.grapeSticker(variety) : Sprites.emptySticker(), x, y));
      return cv;
    });
    const w = layout(variety, 1).W * scale;
    return `<img class="bimg" src="${url}" style="width:${w}px" alt="">`;
  }
  const grapeDot = (variety, cls = '') => `<img class="gdot ${cls}" src="${stickerUrl(variety)}" alt="">`;

  // ───── 포도나무 (스티커판) ─────
  function openVine(hid, opts = {}) {
    const h = habit(hid);
    if (!h) return;
    const v = VARIETIES[h.variety];
    const m = modal({ title: `${grapeDot(h.variety)} ${esc(h.name)}`, cls: 'vine-modal' });
    let sel = opts.bunch ?? null;

    function render(newIdx) {
      const info = Logic.bunchInfo(h), nb = info.complete + 1;
      if (sel === null || sel >= nb) sel = info.harvestable > 0 ? (h.harvested || 0) : info.current;
      const harvested = h.harvested || 0;
      const inBunch = h.grapes.slice(sel * v.size, (sel + 1) * v.size);
      const isCurrent = sel === info.current, isDone = inBunch.length === v.size, isHarvested = sel < harvested;
      const done = Logic.checkedToday(h);

      const tabs = Array.from({ length: nb }, (_, k) => {
        const st = k < harvested ? 'basket' : k < info.complete ? 'spark' : 'sprout';
        return `<button class="tab${k === sel ? ' on' : ''}" data-b="${k}">${ic(st)}${k + 1}송이</button>`;
      }).join('');

      let cap, actions = '';
      if (isHarvested) {
        const day = (h.harvestLog && h.harvestLog[sel]) || inBunch[inBunch.length - 1].date;
        cap = `${ic('basket')} ${Logic.fmtDate(day)} 수확 완료<br><small>이 송이는 나무에 영원히 남아요</small>`;
      } else if (isDone) {
        cap = `${ic('spark')} 송이가 다 익었어요! 수확해서 코인을 받으세요`;
        actions = sel === harvested
          ? `<button class="btn gold big shine-btn" data-act="harvest">${ic('basket')}수확하기 <small>+${v.reward}</small>${ic('coin')}</button>`
          : '<p class="muted">앞 송이부터 차례로 수확해요</p>';
      } else {
        cap = `<b>${inBunch.length}</b> / ${v.size}알 · 수확까지 <b>${v.size - inBunch.length}알</b>`;
        actions = done
          ? `<button class="btn done big" disabled>${ic('check')}오늘의 포도알 완료!</button><button class="btn ghost" data-act="past">${ic('cal')}지난 날</button>`
          : `<button class="btn grape big" data-act="checkin">${ic('grape')}오늘의 포도알 붙이기</button><button class="btn ghost" data-act="past">${ic('cal')}지난 날</button>`;
      }
      m.body.innerHTML = `
        <div class="vine-head">
          <span class="variety-badge" style="--c:${v.c.mid}">${v.name} · ${v.size}알 · ${v.kind}</span>
          <span class="chip">${ic('fire')}연속 ${Logic.streak(h)}일</span><span class="chip">${ic('grape')}${h.grapes.length}알</span><span class="chip">${ic('basket')}${harvested}송이</span>
        </div>
        <div class="bunch-tabs">${tabs}</div>
        <div class="board">
          <div class="board-ribbon">${ic('star')} 칭찬 포도 스티커 ${ic('star')}</div>
          ${bunchBoard(h.variety, inBunch, { newIdx: newIdx != null ? newIdx - sel * v.size : -1, next: isCurrent && !done ? inBunch.length : -1 })}
          <div class="board-cap">${cap}</div>
        </div>
        <div class="vine-actions">${actions}</div>
        <div class="heat-wrap"><div class="heat-title">최근 5주</div>${heatmap(h)}</div>
        <div class="vine-manage"><button class="link" data-act="rename">${ic('pencil')}이름 바꾸기</button><button class="link danger" data-act="remove">${ic('axe')}나무 뽑기</button></div>`;

      $$('.tab', m.body).forEach(b => { b.onclick = () => { Sfx.click(); sel = +b.dataset.b; render(); }; });
      $$('.stk', m.body).forEach(g => {
        g.onclick = () => {
          const gi = sel * v.size + +g.dataset.i;
          if (g.classList.contains('filled')) openGrape(h, gi);
          else if (isCurrent) openCheckin(h, res => after(res));
        };
      });
      const on = (act, fn) => { const b = $(`[data-act=${act}]`, m.body); if (b) b.onclick = fn; };
      on('checkin', () => openCheckin(h, res => after(res)));
      on('past', () => openCheckin(h, res => after(res), Logic.addDays(Logic.todayStr(), -1)));
      on('harvest', e => doHarvest(h, e.currentTarget, () => render()));
      on('rename', () => {
        const name = prompt('새 이름을 입력하세요', h.name);
        if (name && name.trim()) { h.name = name.trim().slice(0, 16); persist(); m.setTitle(`${grapeDot(h.variety)} ${esc(h.name)}`); }
      });
      on('remove', () => {
        if (!confirm(`'${h.name}' 포도나무를 뽑을까요?\n포도알 ${h.grapes.length}개의 기록이 모두 사라져요.`)) return;
        state.habits.splice(state.habits.indexOf(h), 1);
        persist(); m.close(); toast('{axe} 포도나무를 뽑았어요');
      });
    }
    function after(res) { sel = null; render(res.index); afterCheckin(h, res); }
    render();
  }

  function heatmap(h) {
    const set = new Set(h.grapes.map(g => g.date)), v = VARIETIES[h.variety];
    const today = Logic.todayStr(), startDs = Logic.addDays(today, -(28 + new Date().getDay()));
    let cells = '';
    for (let k = 0; k < 35; k++) {
      const ds = Logic.addDays(startDs, k), on = set.has(ds);
      cells += `<i class="hc${on ? ' on' : ''}${ds === today ? ' today' : ''}${ds > today ? ' future' : ''}" title="${ds}" style="${on ? `background:${v.c.mid}` : ''}"></i>`;
    }
    return `<div class="heat">${cells}</div>`;
  }

  function afterCheckin(h, res) {
    World.burst(h.plot, 'grape');
    World.floatText(h.plot, `+${CHECKIN_COINS}`, 'coin');
    if (res.completed) setTimeout(() => { Sfx.fanfare(); FX.confetti(innerWidth / 2, innerHeight * 0.4, 120); toast('{spark} 포도송이 완성! 수확할 수 있어요', 3200); }, 450);
  }

  // ───── 포도알 붙이기 (기록) ─────
  function openCheckin(h, onDone, defaultDate) {
    const today = Logic.todayStr(), v = VARIETIES[h.variety];
    let date = defaultDate || (Logic.checkedToday(h) ? Logic.addDays(today, -1) : today), mood = '';
    const m = modal({
      title: `포도알 #${h.grapes.length + 1} 붙이기`, icon: 'grape', cls: 'checkin-modal',
      body: `
        <div class="checkin-hero">${grapeDot(h.variety, 'xl')}<div><b>${esc(h.name)}</b><small>${v.name} · 지금 송이 ${h.grapes.length % v.size}/${v.size}</small></div></div>
        <label class="field"><span>${ic('cal')}생성일</span><input type="date" name="date" max="${today}" value="${date}"></label>
        <div class="field"><span>${ic('smile')}오늘의 기분</span><div class="moods">${MOODS.map(e => `<button type="button" data-m="${e}">${ic(e)}</button>`).join('')}</div></div>
        <label class="field"><span>${ic('pencil')}소감</span><textarea name="note" rows="3" maxlength="300" placeholder="오늘은 어땠나요? 한 줄이라도 남겨보세요"></textarea></label>
        <p class="err" hidden></p>
        <button class="btn grape big wide" data-act="ok">${ic('grape')}붙이기!</button>`,
    });
    $$('.moods button', m.body).forEach(b => {
      b.onclick = () => { mood = mood === b.dataset.m ? '' : b.dataset.m; $$('.moods button', m.body).forEach(x => x.classList.toggle('on', x.dataset.m === mood)); Sfx.click(); };
    });
    $('[data-act=ok]', m.body).onclick = e => {
      date = $('[name=date]', m.body).value;
      const err = $('.err', m.body);
      const fail = msg => { err.textContent = msg; err.hidden = false; Sfx.error(); };
      if (!date) return fail('날짜를 선택해 주세요.');
      if (date > today) return fail('미래의 포도알은 미리 붙일 수 없어요.');
      if (Logic.hasDate(h, date)) return fail('이 날은 이미 포도알을 붙였어요. 하루에 한 알!');
      const res = Logic.addGrape(state, h, { date, note: $('[name=note]', m.body).value.trim(), mood });
      Sfx.pop();
      flyCoins(e.currentTarget, 3);
      persist();
      m.close();
      if (onDone) onDone(res); else afterCheckin(h, res);
    };
  }

  function openGrape(h, i) {
    const g = h.grapes[i], v = VARIETIES[h.variety];
    const m = modal({ title: `포도알 #${i + 1}`, icon: 'grape', cls: 'grape-modal' });
    function render(edit) {
      m.body.innerHTML = `
        <div class="grape-card">
          <div class="gc-top">${grapeDot(h.variety, 'xl')}<div><div class="gc-habit">${esc(h.name)} · ${v.name}</div><div class="gc-date">${Logic.fmtDate(g.date)}</div></div><div class="gc-mood">${g.mood ? ic(g.mood, 'lg') : ''}</div></div>
          ${edit
            ? `<textarea class="gc-edit" rows="4" maxlength="300">${esc(g.note)}</textarea><div class="row"><button class="btn grape" data-act="save">저장</button><button class="btn ghost" data-act="cancel">취소</button></div>`
            : `<blockquote class="gc-note">${g.note ? esc(g.note) : '<i>남긴 소감이 없어요</i>'}</blockquote><div class="row"><button class="btn ghost" data-act="edit">${ic('pencil')}소감 수정</button></div>`}
          <small class="muted">${i + 1}번째 포도알 · 기록 시각 ${new Date(g.at).toLocaleString('ko-KR')}</small>
        </div>`;
      const on = (a, fn) => { const b = $(`[data-act=${a}]`, m.body); if (b) b.onclick = fn; };
      on('edit', () => render(true));
      on('cancel', () => render(false));
      on('save', () => { g.note = $('.gc-edit', m.body).value.trim(); persist(); Sfx.click(); render(false); });
    }
    render(false);
  }

  // ───── 수확 ─────
  function doHarvest(h, btn, onDone) {
    const reward = Logic.harvest(state, h);
    if (!reward) return;
    const k = h.harvested - 1, v = VARIETIES[h.variety];
    Sfx.fanfare();
    flyCoins(btn, 12);
    FX.confetti(innerWidth / 2, innerHeight * 0.35, 180);
    World.burst(h.plot, 'harvest');
    World.floatText(h.plot, `+${reward}`, 'coin');
    persist();
    if (onDone) onDone();
    const m = modal({
      title: '수확 성공!', icon: 'basket', cls: 'celebrate-modal',
      body: `<div class="celebrate"><div class="rays"></div>
        <div class="cel-bunch">${bunchImg(h.variety, v.size, 2)}</div>
        <h2>${esc(h.name)} · ${k + 1}번째 송이</h2>
        <div class="cel-reward">+${reward} ${ic('coin', 'lg')}</div>
        <p>${v.size}번의 노력이 한 송이가 되었어요.<br>이 포도송이는 나무에 영원히 남아 당신을 응원할 거예요</p>
        <button class="btn gold big" data-act="ok">좋아요!</button></div>`,
    });
    $('[data-act=ok]', m.body).onclick = () => m.close();
  }

  // ───── 심기 · 확장 ─────
  function openPlant(plot) {
    let variety = 'meoru';
    const m = modal({
      title: '새 포도나무 심기', icon: 'sprout', cls: 'plant-modal',
      body: `
        <label class="field"><span>어떤 습관을 키울까요?</span><input name="name" maxlength="16" placeholder="예) 운동 30분, 독서, 물 2L"></label>
        <div class="presets">${HABIT_PRESETS.map(p => `<button type="button" class="chip-btn">${p}</button>`).join('')}</div>
        <div class="field"><span>포도 품종 고르기</span>
          <div class="variety-grid">${VARIETY_ORDER.map(id => {
            const v = VARIETIES[id];
            return `<button type="button" class="variety-card${id === variety ? ' on' : ''}" data-v="${id}">
              <div class="vc-img">${bunchImg(id, v.size)}</div><b>${v.name}</b><span class="vc-size">${v.size}알 · ${v.kind}</span><small>${v.desc}</small></button>`;
          }).join('')}</div></div>
        <p class="err" hidden></p>
        <button class="btn big wide" data-act="ok">${ic('sprout')}심기</button>`,
    });
    const input = $('[name=name]', m.body);
    setTimeout(() => input.focus(), 50);
    $$('.chip-btn', m.body).forEach(b => { b.onclick = () => { input.value = b.textContent; Sfx.click(); }; });
    $$('.variety-card', m.body).forEach(b => {
      b.onclick = () => { variety = b.dataset.v; $$('.variety-card', m.body).forEach(x => x.classList.toggle('on', x === b)); Sfx.click(); };
    });
    $('[data-act=ok]', m.body).onclick = () => {
      const name = input.value.trim();
      if (!name) { const err = $('.err', m.body); err.textContent = '습관 이름을 입력해 주세요.'; err.hidden = false; Sfx.error(); return; }
      const h = { id: Store.uid(), name, variety, plot, createdAt: Logic.todayStr(), grapes: [], harvested: 0, harvestLog: [] };
      state.habits.push(h);
      persist();
      Sfx.plant();
      World.burst(plot, 'plant');
      m.close();
      toast(`{sprout} '${esc(name)}' 포도나무를 심었어요!`);
      setTimeout(() => openVine(h.id), 350);
    };
  }

  function openExpand(plot) {
    if (plot > state.plotsUnlocked) { toast('{lock} 앞쪽 부지부터 차례로 확장할 수 있어요'); return; }
    const cost = PLOT_COSTS[plot], tot = Logic.totals(state);
    const okB = tot.bunches >= cost.bunches, okC = state.coins >= cost.coins;
    const m = modal({
      title: '포도밭 부지 확장', icon: 'sign', cls: 'expand-modal',
      body: `<div class="expand">
        <div class="ex-icon">${ic('sign', 'xl')}</div>
        <p>${plot + 1}번째 포도밭을 열면 새 습관을 하나 더 키울 수 있어요.</p>
        <ul class="req">
          <li class="${okB ? 'ok' : ''}">${ic('basket')}수확한 송이 <b>${tot.bunches} / ${cost.bunches}</b> ${okB ? ic('check') : ''}</li>
          <li class="${okC ? 'ok' : ''}">${ic('coin')}코인 <b>${state.coins} / ${cost.coins}</b> ${okC ? ic('check') : ''}</li>
        </ul>
        <button class="btn big wide" data-act="ok" ${okB && okC ? '' : 'disabled'}>${okB && okC ? `${ic('coin')}${cost.coins} 내고 확장하기` : '조건이 부족해요'}</button></div>`,
    });
    $('[data-act=ok]', m.body).onclick = () => {
      state.coins -= cost.coins;
      state.plotsUnlocked++;
      persist();
      Sfx.fanfare();
      FX.confetti(innerWidth / 2, innerHeight * 0.4, 100);
      World.burst(plot, 'unlock');
      m.close();
      toast('{sign} 새 부지가 열렸어요! 포도나무를 심어보세요');
    };
  }

  // ───── 오늘의 포도 ─────
  function openToday() {
    const m = modal({ title: '오늘의 포도', icon: 'grape', cls: 'today-modal' });
    function render() {
      if (!state.habits.length) {
        m.body.innerHTML = `<div class="empty">${ic('sprout', 'xl')}<p>아직 포도나무가 없어요.<br>밭에 첫 습관을 심어볼까요?</p><button class="btn big" data-act="go">빈 밭으로 가기</button></div>`;
        $('[data-act=go]', m.body).onclick = () => {
          m.close();
          const free = World.PLOTS.findIndex((_, i) => i < state.plotsUnlocked && !state.habits.some(h => h.plot === i));
          if (free >= 0) World.walkToPlot(free);
        };
        return;
      }
      const done = state.habits.filter(Logic.checkedToday).length, n = state.habits.length;
      m.body.innerHTML = `
        <div class="today-sum"><div class="pxbar big"><i style="width:${done / n * 100}%"></i><b>${done}/${n}</b></div>
          <div><b>${done === n ? '오늘 포도 농사 끝!' : `${n - done}그루가 물을 기다려요`}</b><small>${Logic.fmtDate(Logic.todayStr())}</small></div></div>
        <ul class="today-list">${[...state.habits].sort((a, b) => a.plot - b.plot).map(h => {
          const info = Logic.bunchInfo(h), v = VARIETIES[h.variety], ok = Logic.checkedToday(h);
          const cur = info.harvestable > 0 && info.partial === 0 ? v.size : info.partial;
          return `<li class="${ok ? 'ok' : ''}">
            ${grapeDot(h.variety, 'lg')}
            <button class="tl-name" data-open="${h.id}"><b>${esc(h.name)}</b><small>${v.name} · ${ic('fire')}${Logic.streak(h)}일${info.harvestable > 0 ? ` · <em>${ic('basket')}수확 가능</em>` : ''}</small>
              <span class="pxbar"><i style="width:${cur / v.size * 100}%;background:${v.c.mid}"></i></span></button>
            ${ok ? `<span class="tl-done">${ic('check', 'lg')}</span>` : `<button class="btn grape small" data-check="${h.id}">붙이기</button>`}</li>`;
        }).join('')}</ul>`;
      $$('[data-open]', m.body).forEach(b => { b.onclick = () => openVine(b.dataset.open); });
      $$('[data-check]', m.body).forEach(b => {
        b.onclick = () => { const h = habit(b.dataset.check); openCheckin(h, res => { render(); afterCheckin(h, res); }); };
      });
    }
    render();
  }

  // ───── 기록장 (샤토) ─────
  function openJournal() {
    const m = modal({ title: '샤토 기록장', icon: 'book', cls: 'journal-modal wide' });
    let tab = 'diary', filter = 'all';
    const now = new Date();
    let ym = [now.getFullYear(), now.getMonth()];

    function render() {
      const tot = Logic.totals(state), lv = Logic.levelInfo(tot.grapes);
      const best = Math.max(0, ...state.habits.map(Logic.bestStreak));
      let content = '';
      if (tab === 'diary') {
        const entries = [];
        state.habits.forEach(h => h.grapes.forEach((g, i) => { if (filter === 'all' || filter === h.id) entries.push({ h, g, i }); }));
        entries.sort((a, b) => b.g.date.localeCompare(a.g.date) || b.g.at - a.g.at);
        let lastDate = '';
        content = `<div class="chips">${[['all', '전체'], ...state.habits.map(h => [h.id, h.name])].map(([id, n]) => `<button class="chip-btn${filter === id ? ' on' : ''}" data-f="${id}">${esc(n)}</button>`).join('')}</div>
          <div class="diary">${entries.length ? entries.slice(0, 150).map(({ h, g, i }) => {
            const head = g.date !== lastDate ? `<div class="d-date">${Logic.fmtDate(g.date)}</div>` : '';
            lastDate = g.date;
            return `${head}<button class="d-item" data-h="${h.id}" data-i="${i}">${grapeDot(h.variety)}<span class="d-habit">${esc(h.name)} <small>#${i + 1}</small></span><span class="d-note">${g.note ? esc(g.note) : '<i>소감 없음</i>'}</span><span class="d-mood">${g.mood ? ic(g.mood) : ''}</span></button>`;
          }).join('') : `<div class="empty">${ic('book', 'xl')}<p>포도알을 붙이면 여기에 일기가 쌓여요</p></div>`}</div>`;
      } else if (tab === 'collection') {
        const cards = [];
        state.habits.forEach(h => {
          const v = VARIETIES[h.variety];
          for (let k = 0; k < (h.harvested || 0); k++) {
            const day = (h.harvestLog && h.harvestLog[k]) || h.grapes[(k + 1) * v.size - 1].date;
            cards.push(`<div class="col-card">${bunchImg(h.variety, v.size)}<b>${esc(h.name)}</b><small>${k + 1}번째 ${v.name}<br>${day}</small></div>`);
          }
        });
        content = cards.length ? `<div class="col-grid">${cards.join('')}</div>` : `<div class="empty">${ic('basket', 'xl')}<p>첫 송이를 수확하면 여기에 전시돼요</p></div>`;
      } else {
        const [y, mo] = ym, first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
        const byDate = {};
        state.habits.forEach(h => h.grapes.forEach(g => { (byDate[g.date] = byDate[g.date] || []).push(h); }));
        let cells = '일월화수목금토'.split('').map(d => `<i class="cal-h">${d}</i>`).join('');
        for (let k = 0; k < first; k++) cells += '<i></i>';
        const today = Logic.todayStr();
        for (let d = 1; d <= days; d++) {
          const ds = Logic.dateStr(new Date(y, mo, d)), hs = byDate[ds] || [];
          cells += `<div class="cal-d${ds === today ? ' today' : ''}"><span>${d}</span><div>${hs.slice(0, 6).map(h => grapeDot(h.variety, 'xs')).join('')}</div></div>`;
        }
        content = `<div class="cal-nav"><button class="btn ghost small" data-cal="-1">◀</button><b>${y}년 ${mo + 1}월</b><button class="btn ghost small" data-cal="1">▶</button></div>
          <div class="cal">${cells}</div>
          <div class="cal-legend">${state.habits.map(h => `<span>${grapeDot(h.variety, 'xs')} ${esc(h.name)}</span>`).join('')}</div>`;
      }
      m.body.innerHTML = `
        <div class="stats">
          <div class="stat">${ic('grape', 'lg')}<b>${tot.grapes}</b><small>모은 포도알</small></div>
          <div class="stat">${ic('basket', 'lg')}<b>${tot.bunches}</b><small>수확한 송이</small></div>
          <div class="stat">${ic('fire', 'lg')}<b>${best}일</b><small>최장 연속</small></div>
          <div class="stat">${ic('star', 'lg')}<b>Lv.${lv.lv}</b><small>농장 레벨</small></div>
        </div>
        <div class="tabs-row">${[['diary', 'book', '포도알 일기'], ['collection', 'basket', '송이 컬렉션'], ['calendar', 'cal', '달력']].map(([id, i2, n]) => `<button class="tab${tab === id ? ' on' : ''}" data-t="${id}">${ic(i2)}${n}</button>`).join('')}</div>
        <div class="j-content">${content}</div>`;
      $$('[data-t]', m.body).forEach(b => { b.onclick = () => { tab = b.dataset.t; Sfx.click(); render(); }; });
      $$('[data-f]', m.body).forEach(b => { b.onclick = () => { filter = b.dataset.f; render(); }; });
      $$('[data-cal]', m.body).forEach(b => {
        b.onclick = () => { const d = new Date(ym[0], ym[1] + +b.dataset.cal, 1); ym = [d.getFullYear(), d.getMonth()]; render(); };
      });
      $$('.d-item', m.body).forEach(b => { b.onclick = () => openGrape(habit(b.dataset.h), +b.dataset.i); });
    }
    render();
  }

  // ───── 옷장 (부티크) ─────
  function openWardrobe() {
    let slot = 'hat', tryOn = null, raf = 0;
    const m = modal({ title: '부티크 · 옷 입히기', icon: 'hat', cls: 'wardrobe-modal wide', onClose: () => cancelAnimationFrame(raf) });
    m.body.innerHTML = `
      <div class="wardrobe">
        <div class="wr-left">
          <div class="seg gender-seg"><button data-g="f">여자</button><button data-g="m">남자</button></div>
          <div class="wr-stage"><canvas class="wr-preview" width="20" height="30"></canvas></div>
          <div class="wr-buy"></div>
        </div>
        <div class="wr-right"><div class="tabs-row wr-tabs"></div><div class="wr-grid"></div></div>
      </div>`;
    const prev = $('.wr-preview', m.body), pc = prev.getContext('2d');
    const dirs = ['down', 'right', 'up', 'left'], t0 = performance.now();
    const loop = now => {
      const s = (now - t0) / 1000;
      pc.clearRect(0, 0, 20, 30);
      pc.drawImage(Sprites.charSprite(tryOn || state.look, state.gender, dirs[Math.floor(s / 1.6) % 4], Math.floor(s * 6) % 4), 0, 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    function render() {
      $$('.gender-seg button', m.body).forEach(b => {
        b.classList.toggle('on', b.dataset.g === state.gender);
        b.onclick = () => {
          if (state.gender === b.dataset.g) return;
          state.gender = b.dataset.g;
          if (confirm('성별에 맞는 기본 일꾼 복장으로 갈아입을까요?')) state.look = { ...DEFAULT_LOOKS[state.gender] };
          tryOn = null; persist(); Sfx.click(); render();
        };
      });
      $('.wr-tabs', m.body).innerHTML = SLOTS.map(([id, n]) => `<button class="tab${slot === id ? ' on' : ''}" data-s="${id}">${n}</button>`).join('');
      const items = ITEMS.filter(i => i.slot === slot);
      $('.wr-grid', m.body).innerHTML = items.map(it => {
        const owned = state.owned.includes(it.id), worn = state.look[slot] === it.id;
        return `<button class="wr-item${worn ? ' worn' : ''}${tryOn && tryOn[slot] === it.id ? ' trying' : ''}" data-id="${it.id}">
          <canvas width="20" height="30"></canvas><b>${it.name}</b>
          <span class="tag ${owned ? 'own' : ''}">${worn ? '착용 중' : owned ? '보유' : `${ic('coin')}${it.price}`}</span></button>`;
      }).join('');
      $$('.wr-item', m.body).forEach(b => {
        const it = ITEM_MAP[b.dataset.id];
        b.querySelector('canvas').getContext('2d').drawImage(Sprites.charSprite({ ...state.look, [slot]: it.id }, state.gender, 'down', 0), 0, 0);
        b.onclick = () => {
          Sfx.click();
          if (state.owned.includes(it.id)) { state.look[slot] = it.id; tryOn = null; persist(); }
          else tryOn = { ...state.look, [slot]: it.id };
          render();
        };
      });
      $$('[data-s]', m.body).forEach(b => { b.onclick = () => { slot = b.dataset.s; tryOn = null; Sfx.click(); render(); }; });
      const buy = $('.wr-buy', m.body);
      const pending = tryOn && ITEM_MAP[tryOn[slot]];
      if (pending && !state.owned.includes(pending.id)) {
        buy.innerHTML = `<p><b>${pending.name}</b> 입어보는 중</p><button class="btn gold wide" data-act="buy">${ic('coin')}${pending.price} 구매하기</button><button class="link" data-act="undo">벗기</button>`;
        $('[data-act=buy]', buy).onclick = e => {
          if (state.coins < pending.price) { Sfx.error(); toast('{coin} 코인이 부족해요. 포도를 수확해 보세요!'); return; }
          state.coins -= pending.price;
          state.owned.push(pending.id);
          state.look[slot] = pending.id;
          tryOn = null;
          persist(); Sfx.coin(); FX.confetti(...FX.center(e.currentTarget), 50);
          toast(`{spark} ${pending.name} 구매 완료!`);
          render();
        };
        $('[data-act=undo]', buy).onclick = () => { tryOn = null; render(); };
      } else buy.innerHTML = `<p class="muted">보유 ${ic('coin')}<b>${state.coins}</b><br>아이템을 눌러 입어보세요</p>`;
    }
    render();
  }

  // ───── 미니게임 (와인 저장고) ─────
  function openMinigame() {
    Minigame.open({
      coins: () => state.coins,
      best: () => state.best || 0,
      spend: cost => { if (state.coins < cost) return false; state.coins -= cost; persist(); return true; },
      finish: score => {
        const reward = Math.floor(score / 2), newBest = score > (state.best || 0);
        if (newBest) state.best = score;
        state.coins += reward;
        persist();
        return { reward, best: state.best, newBest };
      },
    });
  }

  // ───── 이스터에그: 비밀의 연못 ─────
  function openPondPrompt() {
    Sfx.pop();
    const m = modal({
      title: '…?', icon: 'drop', cls: 'pond-prompt',
      body: `<div class="pond-ask">${ic('spark', 'xl')}
        <p>연못 속에서 무언가 <b>반짝</b>이고 있어요…<br>뛰어들어 보시겠어요?</p>
        <div class="row"><button class="btn grape big" data-act="go">${ic('drop')}입장하기</button><button class="btn ghost" data-act="no">그만두기</button></div></div>`,
    });
    $('[data-act=no]', m.body).onclick = () => m.close();
    $('[data-act=go]', m.body).onclick = () => {
      m.close();
      Sfx.splash();
      if (!state.pondFound) {
        state.pondFound = true;
        state.coins += 50;
        persist();
        setTimeout(() => { Sfx.fanfare(); toast('{spark} 숨겨진 연못을 발견했어요! 보너스 {coin}50', 3600); }, 400);
      }
      Pond.open({
        look: () => state.look,
        best: () => state.pondBest || 0,
        finish: score => {
          const reward = Math.floor(score / 5), newBest = score > (state.pondBest || 0);
          if (newBest) state.pondBest = score;
          state.coins += reward;
          persist();
          return { reward, best: state.pondBest, newBest };
        },
      });
    };
  }

  // ───── 설정 ─────
  function openSettings() {
    const m = modal({ title: '설정', icon: 'gear', cls: 'settings-modal' });
    function render() {
      const s = state.settings;
      m.body.innerHTML = `
        <div class="field"><span>하늘 (지금: ${{ day: '낮', golden: '노을', dusk: '해질녘', night: '밤' }[World.todMode()]})</span>
          <div class="seg">${[['auto', '', '실제 시간'], ['day', 'sun', '낮'], ['golden', 'sunset', '노을'], ['night', 'moon', '밤']].map(([id, i2, n]) => `<button class="${s.tod === id ? 'on' : ''}" data-tod="${id}">${i2 ? ic(i2) : ''}${n}</button>`).join('')}</div></div>
        <div class="field"><span>${ic('sound')}효과음</span><div class="seg"><button class="${s.sound ? 'on' : ''}" data-snd="1">켜기</button><button class="${!s.sound ? 'on' : ''}" data-snd="0">끄기</button></div></div>
        <div class="help"><b>조작법</b><br>클릭/탭: 그곳으로 이동 · 밭/건물 클릭: 바로 열기<br>WASD·방향키: 이동 · E/스페이스: 상호작용</div>
        <button class="btn gold wide" data-act="guide">${ic('book')}농장 운영 안내서 보기</button>
        ${user === 'demo' ? '' : `<button class="btn ghost wide" data-act="pw">${ic('lock')}비밀번호 바꾸기</button>`}
        <p class="muted">${esc(user)} (${esc(state.nickname)}) · ${Store.mode() === 'cloud' ? `${ic('cloud')}클라우드에 저장 중 (어느 기기에서든 로그인 가능)` : '이 브라우저에만 저장 중'}</p>
        <button class="btn danger wide" data-act="logout">${ic('door')}로그아웃</button>`;
      $$('[data-tod]', m.body).forEach(b => { b.onclick = () => { s.tod = b.dataset.tod; World.setTimeMode(s.tod); persist(); Sfx.click(); render(); }; });
      $$('[data-snd]', m.body).forEach(b => { b.onclick = () => { s.sound = b.dataset.snd === '1'; Sfx.setEnabled(s.sound); persist(); Sfx.click(); render(); }; });
      $('[data-act=guide]', m.body).onclick = () => { Sfx.click(); Guide.open(); };
      const pwBtn = $('[data-act=pw]', m.body);
      if (pwBtn) pwBtn.onclick = () => { Sfx.click(); openPassword(); };
      $('[data-act=logout]', m.body).onclick = async () => { await Store.logout(); location.hash = ''; location.reload(); };
    }
    render();
  }

  function openPassword() {
    const m = modal({
      title: '비밀번호 바꾸기', icon: 'lock', cls: 'pw-modal',
      body: `
        <label class="field"><span>현재 비밀번호</span><input type="password" name="old" autocomplete="current-password"></label>
        <label class="field"><span>새 비밀번호</span><input type="password" name="new" autocomplete="new-password" placeholder="6자 이상"></label>
        <label class="field"><span>새 비밀번호 확인</span><input type="password" name="new2" autocomplete="new-password"></label>
        <p class="muted">다른 사이트에서 쓰지 않는, 영문·숫자·기호를 섞은 8자 이상 비밀번호를 추천해요.</p>
        <p class="err" hidden></p>
        <button class="btn grape big wide" data-act="ok">${ic('lock')}바꾸기</button>`,
    });
    const v = n => $(`[name=${n}]`, m.body).value, err = $('.err', m.body);
    const fail = msg => { err.textContent = msg; err.hidden = false; Sfx.error(); };
    $('[data-act=ok]', m.body).onclick = async e => {
      if (!v('old')) return fail('현재 비밀번호를 입력해 주세요.');
      if (v('new').length < 6) return fail('새 비밀번호는 6자 이상이어야 해요.');
      if (v('new') !== v('new2')) return fail('새 비밀번호 확인이 일치하지 않아요.');
      if (v('new') === v('old')) return fail('지금과 다른 비밀번호를 입력해 주세요.');
      const btn = e.currentTarget;
      btn.disabled = true;
      const r = await Store.changePassword(v('old'), v('new'));
      btn.disabled = false;
      if (!r.ok) return fail(r.msg);
      Sfx.coin();
      m.close();
      toast('{lock} 비밀번호를 바꿨어요!');
    };
  }

  // ───── 월드에서 밭/건물을 눌렀을 때 ─────
  const worldHooks = {
    onPlot(i) {
      Sfx.click();
      const h = state.habits.find(x => x.plot === i);
      if (h) openVine(h.id);
      else if (i < state.plotsUnlocked) openPlant(i);
      else openExpand(i);
    },
    onPond() { openPondPrompt(); },
    onBuilding(id) {
      Sfx.click();
      ({ chateau: openJournal, boutique: openWardrobe, cave: openMinigame })[id]();
    },
  };

  return { start, isBlocking, modal, toast, worldHooks, openToday, openVine, bunchImg };
})();
