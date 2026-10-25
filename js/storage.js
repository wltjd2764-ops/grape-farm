'use strict';
// ───────── 계정 · 저장 ─────────
// 클라우드 모드: js/firebase-config.js 에 설정이 있고 http(s) 로 열렸을 때 → Firebase Auth + Firestore
// 로컬 모드: 그 외 (또는 체험 계정) → 브라우저 localStorage
const Store = (() => {
  const USERS = 'grapefarm.users', SESSION = 'grapefarm.session', DATA = u => 'grapefarm.data.' + u;
  const read = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

  const cloud = typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined' && !!FIREBASE_CONFIG
    && location.protocol.startsWith('http');
  let auth = null, db = null, cloudUser = null, session = null; // session = { id, mode: 'cloud' | 'local' }
  if (cloud) {
    firebase.initializeApp(FIREBASE_CONFIG);
    auth = firebase.auth();
    db = firebase.firestore();
  }
  const emailOf = id => `${id.toLowerCase()}@grape-farm.app`;
  const idOf = email => email.split('@')[0];
  const userDoc = () => db.collection('users').doc(cloudUser.uid);

  async function hash(pw, salt) {
    const text = salt + ':' + pw;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 2166136261;
    for (const ch of text) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return 'f' + (h >>> 0).toString(16);
  }

  function newState(nickname, gender = 'f') {
    return {
      v: 2, nickname, gender, coins: START_COINS, plotsUnlocked: 4,
      look: { ...DEFAULT_LOOKS[gender] }, owned: [...FREE_ITEMS], habits: [], best: 0,
      settings: { tod: 'auto', sound: true }, createdAt: Date.now(),
    };
  }
  function normalize(s) {
    const gender = s.gender === 'm' ? 'm' : 'f';
    const out = Object.assign(newState(s.nickname || '농부', gender), s);
    out.gender = gender;
    // v1 → v2: 일꾼 복장으로 갈아입히기
    out.look = s.v >= 2 ? { ...DEFAULT_LOOKS[gender], ...s.look } : { ...DEFAULT_LOOKS[gender] };
    out.v = 2;
    out.settings = { tod: 'auto', sound: true, ...s.settings };
    out.owned = [...new Set([...FREE_ITEMS, ...(s.owned || [])])];
    out.habits = (s.habits || []).map(h => ({
      harvested: 0, ...h,
      grapes: (h.grapes || []).map(g => ({ ...g, mood: MOOD_FROM_EMOJI[g.mood] || g.mood || '' })),
    }));
    return out;
  }

  // ───── 저장 상태 알림 (HUD 표시용) ─────
  let statusFn = () => {};
  const setStatus = st => statusFn(st);
  function onStatus(fn) { statusFn = fn; fn(session && session.mode === 'cloud' ? 'saved' : 'local'); }

  // ───── 세션 ─────
  function setLocalSession(id) { try { localStorage.setItem(SESSION, id); } catch { /* 무시 */ } }
  function localSession() {
    try {
      const id = localStorage.getItem(SESSION);
      if (!id || !read(USERS, {})[id]) return null;
      return !cloud || id === 'demo' ? id : null;
    } catch { return null; }
  }
  // 앱 시작 시 로그인 상태 확인 → 아이디 또는 null
  function init() {
    return new Promise(resolve => {
      const local = () => { const id = localSession(); session = id ? { id, mode: 'local' } : null; resolve(id); };
      if (!cloud) return local();
      const off = auth.onAuthStateChanged(u => {
        off();
        cloudUser = u;
        if (u) { session = { id: idOf(u.email), mode: 'cloud' }; resolve(session.id); } else local();
      });
    });
  }

  function errMsg(e) {
    return {
      'auth/email-already-in-use': '이미 사용 중인 아이디예요.',
      'auth/invalid-credential': '아이디 또는 비밀번호가 맞지 않아요.',
      'auth/invalid-login-credentials': '아이디 또는 비밀번호가 맞지 않아요.',
      'auth/wrong-password': '아이디 또는 비밀번호가 맞지 않아요.',
      'auth/user-not-found': '아이디 또는 비밀번호가 맞지 않아요.',
      'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
      'auth/invalid-email': '아이디는 영문/숫자/_ 로만 만들어 주세요.',
      'auth/network-request-failed': '인터넷 연결을 확인해 주세요.',
      'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 해 주세요.',
      'auth/operation-not-allowed': 'Firebase에서 이메일/비밀번호 로그인을 켜 주세요.',
      'permission-denied': 'Firestore 보안 규칙을 확인해 주세요.',
    }[e.code] || ('오류: ' + (e.message || e));
  }

  // ───── 가입 · 로그인 · 로그아웃 ─────
  async function signup(id, pw, nickname, gender) {
    if (cloud) {
      try {
        const cred = await auth.createUserWithEmailAndPassword(emailOf(id), pw);
        cloudUser = cred.user;
        session = { id, mode: 'cloud' };
        const s = newState(nickname, gender);
        s.userId = id;
        await userDoc().set(s);
        return { ok: true };
      } catch (e) { return { ok: false, msg: errMsg(e) }; }
    }
    const users = read(USERS, {});
    if (users[id]) return { ok: false, msg: '이미 사용 중인 아이디예요.' };
    const salt = uid() + uid();
    users[id] = { salt, hash: await hash(pw, salt), created: Date.now() };
    if (!write(USERS, users)) return { ok: false, msg: '브라우저 저장소에 접근할 수 없어요.' };
    write(DATA(id), newState(nickname, gender));
    setLocalSession(id);
    session = { id, mode: 'local' };
    return { ok: true };
  }
  async function login(id, pw) {
    if (cloud) {
      try {
        const cred = await auth.signInWithEmailAndPassword(emailOf(id), pw);
        cloudUser = cred.user;
        session = { id, mode: 'cloud' };
        return { ok: true };
      } catch (e) { return { ok: false, msg: errMsg(e) }; }
    }
    const u = read(USERS, {})[id];
    if (!u) return { ok: false, msg: '존재하지 않는 아이디예요.' };
    if (await hash(pw, u.salt) !== u.hash) return { ok: false, msg: '비밀번호가 맞지 않아요.' };
    setLocalSession(id);
    session = { id, mode: 'local' };
    return { ok: true };
  }
  async function logout() {
    await flush();
    try { localStorage.removeItem(SESSION); } catch { /* 무시 */ }
    if (cloud && cloudUser) await auth.signOut();
    session = null; cloudUser = null;
  }

  // ───── 불러오기 · 저장 ─────
  async function load(id) {
    if (session && session.mode === 'cloud') {
      const cacheKey = DATA('cloud.' + id);
      try {
        const snap = await userDoc().get();
        if (snap.exists) { const s = normalize(snap.data()); write(cacheKey, s); return s; }
      } catch (e) {
        const cached = read(cacheKey, null);
        if (cached) { setStatus('error'); return normalize(cached); }
        throw new Error(errMsg(e));
      }
      const s = newState(id);
      s.userId = id;
      return s;
    }
    return normalize(read(DATA(id), null) || newState(id));
  }
  let pending = null, timer = 0;
  function save(id, s) {
    if (session && session.mode === 'cloud') {
      write(DATA('cloud.' + id), s);
      pending = s;
      setStatus('saving');
      clearTimeout(timer);
      timer = setTimeout(flush, 800);
      return;
    }
    write(DATA(id), s);
  }
  function flush() {
    clearTimeout(timer);
    if (!pending || !cloudUser) return Promise.resolve();
    const s = pending;
    pending = null;
    return userDoc().set(JSON.parse(JSON.stringify(s)))
      .then(() => { if (!pending) setStatus('saved'); })
      .catch(() => { pending = pending || s; setStatus('error'); timer = setTimeout(flush, 5000); });
  }
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  addEventListener('pagehide', () => flush());

  // 시연용 체험 계정 (항상 이 브라우저에만 저장): 지난 날짜로 기록이 채워져 있어 바로 수확/완성 장면을 보여줄 수 있음
  function seedDemo(s) {
    const notes = ['상쾌했다!', '조금 힘들었지만 해냈다 💪', '컨디션 최고 🔥', '비 와서 실내에서 했다', '친구랑 같이 해서 즐거웠음',
      '짧게라도 했다는 게 중요!', '뿌듯해', '오늘은 겨우겨우…', '습관이 몸에 붙는 느낌', ''];
    const today = Logic.todayStr();
    const mk = (name, variety, plot, count, skip, harvested) => {
      const grapes = [];
      let d = Logic.addDays(today, -1), i = 0;
      while (grapes.length < count) {
        if (!skip || i % skip !== skip - 1) {
          grapes.unshift({ date: d, note: notes[(i * 3 + plot) % notes.length], mood: MOODS[(i + plot) % MOODS.length], at: Logic.toDate(d).getTime() + 21 * 3600e3 });
        }
        d = Logic.addDays(d, -1); i++;
      }
      const size = VARIETIES[variety].size;
      const harvestLog = Array.from({ length: harvested }, (_, k) => grapes[(k + 1) * size - 1].date);
      return { id: uid(), name, variety, plot, createdAt: grapes[0].date, grapes, harvested, harvestLog };
    };
    s.habits = [
      mk('아침 운동 30분', 'meoru', 0, 52, 9, 1),
      mk('하루 30쪽 독서', 'kyoho', 1, 15, 3, 0),
      mk('물 2L 마시기', 'campbell', 2, 23, 0, 0),
      mk('영어 단어 20개', 'shine', 3, 47, 6, 2),
    ];
    s.coins = 480;
  }
  async function demo() {
    const users = read(USERS, {});
    if (!users.demo) {
      const salt = uid();
      users.demo = { salt, hash: await hash('demo1234', salt), created: Date.now() };
      write(USERS, users);
      const s = newState('포도농부', 'f');
      seedDemo(s);
      write(DATA('demo'), s);
    }
    setLocalSession('demo');
    session = { id: 'demo', mode: 'local' };
    return 'demo';
  }

  return { cloud, init, signup, login, logout, load, save, flush, demo, uid, onStatus, mode: () => session && session.mode };
})();
