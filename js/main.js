'use strict';
// ───────── 시작: 로그인 → 농장 ─────────
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  // <i data-ic="coin"> 자리에 픽셀 아이콘 넣기
  $$('[data-ic]').forEach(el => { el.outerHTML = Pix.img(el.dataset.ic); });

  FX.init();
  World.init($('#world'), UI.worldHooks);
  Scene.start($('#scene'));
  $('#logo-bunch').src = Sprites.bigBunch('meoru').toDataURL();
  $('#guide-btn').onclick = () => { Sfx.click(); Guide.open(); };

  // 회원가입: 성별 선택 (일꾼 캐릭터 미리보기)
  let gender = 'f';
  $$('.gp').forEach(b => {
    b.querySelector('canvas').getContext('2d').drawImage(Sprites.charSprite(DEFAULT_LOOKS[b.dataset.g], b.dataset.g, 'down', 0), 0, 0);
    b.onclick = () => { gender = b.dataset.g; $$('.gp').forEach(x => x.classList.toggle('on', x === b)); Sfx.click(); };
  });

  $('#login-note').textContent = Store.cloud
    ? '계정은 클라우드에 저장돼 어느 기기에서든 이어서 할 수 있어요 (체험 계정은 제외)'
    : '계정과 기록은 이 브라우저에 저장돼요';

  async function enterGame(id) {
    let s;
    try { s = await Store.load(id); }
    catch (e) { const f = $('#login-form'); f.hidden = false; fail(f, '농장을 불러오지 못했어요. ' + e.message); return; }
    $('#login-screen').classList.add('leaving');
    setTimeout(() => {
      Scene.stop();
      $('#login-screen').hidden = true;
      $('#game-screen').hidden = false;
      World.start();
      UI.start(id, s);
    }, 450);
  }

  $$('.login-tabs button').forEach(b => {
    b.onclick = () => {
      $$('.login-tabs button').forEach(x => x.classList.toggle('on', x === b));
      $('#login-form').hidden = b.dataset.tab !== 'login';
      $('#signup-form').hidden = b.dataset.tab !== 'signup';
      $$('.login-card .err').forEach(e => { e.hidden = true; });
    };
  });
  function fail(form, msg) { const e = form.querySelector('.err'); e.textContent = msg; e.hidden = false; form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
  // 요청 중에는 버튼 잠그기
  async function busy(form, fn) {
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try { await fn(); } finally { btn.disabled = false; }
  }

  $('#login-form').onsubmit = e => {
    e.preventDefault();
    const f = e.target, id = f.id_.value.trim(), pw = f.pw.value;
    if (!id || !pw) return fail(f, '아이디와 비밀번호를 입력해 주세요.');
    busy(f, async () => { const r = await Store.login(id, pw); if (r.ok) await enterGame(id); else fail(f, r.msg); });
  };
  $('#signup-form').onsubmit = e => {
    e.preventDefault();
    const f = e.target, id = f.id_.value.trim(), pw = f.pw.value, pw2 = f.pw2.value, nick = f.nick.value.trim();
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(id)) return fail(f, '아이디는 영문/숫자/_ 3~16자로 만들어 주세요.');
    if (pw.length < 6) return fail(f, '비밀번호는 6자 이상이어야 해요.');
    if (pw !== pw2) return fail(f, '비밀번호 확인이 일치하지 않아요.');
    if (!nick || nick.length > 10) return fail(f, '닉네임은 1~10자로 입력해 주세요.');
    busy(f, async () => { const r = await Store.signup(id, pw, nick, gender); if (r.ok) await enterGame(id); else fail(f, r.msg); });
  };
  $('#demo-btn').onclick = async () => { await enterGame(await Store.demo()); };

  // 주소 끝에 #demo 를 붙이면 체험 계정으로 바로 입장 (발표용)
  Store.init().then(cur => {
    if (location.hash === '#demo') Store.demo().then(enterGame);
    else if (cur) enterGame(cur);
  });
})();
