'use strict';
// ───────── 게임 데이터 · 규칙 ─────────

const VARIETIES = {
  meoru: {
    id: 'meoru', name: '머루포도', size: 30, rows: [6, 6, 5, 5, 4, 3, 1], r: 15, px: 3, reward: 180,
    kind: '매일 루틴', desc: '작은 알 30개가 촘촘히. 매일 하는 습관에 딱!',
    c: { dark: '#2a1638', mid: '#4a2762', light: '#7a4b98', hi: '#b58fd1' },
  },
  campbell: {
    id: 'campbell', name: '캠벨', size: 24, rows: [6, 5, 5, 4, 3, 1], r: 17, px: 3, reward: 140,
    kind: '꾸준한 습관', desc: '새콤달콤 24알. 주 5회 이상 하는 습관에.',
    c: { dark: '#3b1a5c', mid: '#5e2f8c', light: '#8b5cc0', hi: '#c9a8ec' },
  },
  shine: {
    id: 'shine', name: '샤인머스켓', size: 20, rows: [5, 5, 4, 3, 2, 1], r: 19, px: 3, reward: 120,
    kind: '도전 습관', desc: '반짝이는 연둣빛 20알. 새로 도전하는 습관에.',
    c: { dark: '#5e8f2c', mid: '#8cc04a', light: '#b9e07a', hi: '#eefad0' },
  },
  kyoho: {
    id: 'kyoho', name: '거봉', size: 15, rows: [5, 4, 3, 2, 1], r: 23, px: 4, reward: 100,
    kind: '이벤트성', desc: '큼직한 15알. 가끔 하는 특별한 일에.',
    c: { dark: '#2d0f24', mid: '#5a1f45', light: '#8e3a6e', hi: '#e09ac2' },
  },
};
const VARIETY_ORDER = ['meoru', 'campbell', 'shine', 'kyoho'];

const MOODS = ['love', 'joy', 'smile', 'meh', 'tired', 'mood_fire'];
const MOOD_FROM_EMOJI = { '🥰': 'love', '😆': 'joy', '🙂': 'smile', '😐': 'meh', '😓': 'tired', '🔥': 'mood_fire' };
const CHECKIN_COINS = 5;
const START_COINS = 100;
const HABIT_PRESETS = ['운동 30분', '독서', '공부', '물 2L', '명상', '일기 쓰기', '영어 단어', '스트레칭'];

// 부지 확장 조건 (index = 밭 번호). 0~3번은 처음부터 열려 있음
const PLOT_COSTS = [null, null, null, null,
  { bunches: 1, coins: 100 }, { bunches: 2, coins: 150 }, { bunches: 3, coins: 200 }, { bunches: 4, coins: 250 },
  { bunches: 6, coins: 300 }, { bunches: 8, coins: 400 }, { bunches: 10, coins: 500 }, { bunches: 12, coins: 600 }];

// ───────── 옷 입히기 아이템 ─────────
const ITEMS = [
  // 모자
  { id: 'hat_none', slot: 'hat', name: '없음', price: 0, style: 'none' },
  { id: 'hat_straw', slot: 'hat', name: '밀짚모자', price: 0, style: 'straw', c: '#e9c46a', c2: '#c0392b' },
  { id: 'hat_cap', slot: 'hat', name: '헌팅캡', price: 0, style: 'cap', c: '#8a6a48', c2: '#5e4630' },
  { id: 'hat_beret', slot: 'hat', name: '빨간 베레모', price: 150, style: 'beret', c: '#c0392b', c2: '#952c21' },
  { id: 'hat_beret_navy', slot: 'hat', name: '네이비 베레모', price: 150, style: 'beret', c: '#2c3e72', c2: '#1f2c55' },
  { id: 'hat_bandana', slot: 'hat', name: '체크 반다나', price: 80, style: 'bandana', c: '#6a9a4a', c2: '#ffffff' },
  { id: 'hat_flower', slot: 'hat', name: '꽃 화관', price: 200, style: 'flower' },
  { id: 'hat_crown', slot: 'hat', name: '포도 왕관', price: 600, style: 'crown' },
  // 헤어
  { id: 'hair_short', slot: 'hair', name: '짧은 머리', price: 0, style: 'short' },
  { id: 'hair_bob', slot: 'hair', name: '단발', price: 0, style: 'bob' },
  { id: 'hair_long', slot: 'hair', name: '긴 생머리', price: 0, style: 'long' },
  { id: 'hair_braids', slot: 'hair', name: '양갈래 땋기', price: 0, style: 'braids' },
  { id: 'hair_bun', slot: 'hair', name: '똥머리', price: 60, style: 'bun' },
  // 머리색
  { id: 'hc_brown', slot: 'hairColor', name: '초콜릿', price: 0, c: '#5a3420', c2: '#3f2414' },
  { id: 'hc_black', slot: 'hairColor', name: '흑발', price: 0, c: '#2b2230', c2: '#1a141e' },
  { id: 'hc_blonde', slot: 'hairColor', name: '금발', price: 0, c: '#e8c06a', c2: '#c99a40' },
  { id: 'hc_berry', slot: 'hairColor', name: '딸기', price: 80, c: '#d4605a', c2: '#a8443f' },
  { id: 'hc_lavender', slot: 'hairColor', name: '라벤더', price: 120, c: '#a58ad6', c2: '#7c63ad' },
  { id: 'hc_mint', slot: 'hairColor', name: '민트', price: 120, c: '#7fd1b9', c2: '#56a892' },
  // 상의 (kerchief: 목 스카프, rolled: 걷어 올린 소매)
  { id: 'top_overall', slot: 'top', name: '데님 멜빵 작업복', price: 0, style: 'overall', c: '#f3ead8', c2: '#4a6fa5', kerchief: true, rolled: true },
  { id: 'top_suspender', slot: 'top', name: '셔츠 & 멜빵', price: 0, style: 'suspender', c: '#f3ead8', c2: '#6b4226', kerchief: true, rolled: true },
  { id: 'top_tee', slot: 'top', name: '흰 티셔츠', price: 0, style: 'tee', c: '#f7f3ea', c2: '#d8cfbd' },
  { id: 'top_apron', slot: 'top', name: '와이너리 앞치마', price: 160, style: 'apron', c: '#f3ead8', c2: '#7b2440', rolled: true },
  { id: 'top_mariniere', slot: 'top', name: '마리니에르', price: 180, style: 'stripe', c: '#f7f3ea', c2: '#2c3e72' },
  { id: 'top_tee_lav', slot: 'top', name: '라벤더 티', price: 50, style: 'tee', c: '#b9a3e3', c2: '#9781c4' },
  { id: 'top_hoodie', slot: 'top', name: '포도 후디', price: 250, style: 'hoodie', c: '#6b3fa0', c2: '#4a2672', mark: '#9fd36b' },
  // 하의
  { id: 'bot_jeans', slot: 'bottom', name: '청바지', price: 0, style: 'pants', c: '#4a6fa5', c2: '#3a5a8a' },
  { id: 'bot_brown', slot: 'bottom', name: '갈색 작업 바지', price: 0, style: 'pants', c: '#7a5230', c2: '#5e3d22' },
  { id: 'bot_shorts', slot: 'bottom', name: '베이지 반바지', price: 60, style: 'shorts', c: '#d9b27c', c2: '#b8925c' },
  { id: 'bot_skirt', slot: 'bottom', name: '빨간 치마', price: 100, style: 'skirt', c: '#c0392b', c2: '#952c21' },
  { id: 'bot_skirt_lav', slot: 'bottom', name: '라벤더 치마', price: 120, style: 'skirt', c: '#a58ad6', c2: '#7c63ad' },
  // 신발
  { id: 'shoe_boots_brown', slot: 'shoes', name: '가죽 장화', price: 0, style: 'boots', c: '#6b4226', c2: '#3f2614' },
  { id: 'shoe_brown', slot: 'shoes', name: '가죽 구두', price: 0, style: 'shoe', c: '#5e3a20', c2: '#3f2614' },
  { id: 'shoe_boots', slot: 'shoes', name: '초록 장화', price: 80, style: 'boots', c: '#4f8a3a', c2: '#2f5a22' },
  { id: 'shoe_white', slot: 'shoes', name: '흰 운동화', price: 70, style: 'shoe', c: '#f2f2f2', c2: '#b8b8c4' },
  { id: 'shoe_red', slot: 'shoes', name: '빨간 구두', price: 100, style: 'shoe', c: '#c0392b', c2: '#7a2018' },
  // 피부
  { id: 'skin_1', slot: 'skin', name: '피부 1', price: 0, c: '#ffe0c4', c2: '#f2c4a0' },
  { id: 'skin_2', slot: 'skin', name: '피부 2', price: 0, c: '#f5c9a0', c2: '#e2ad80' },
  { id: 'skin_3', slot: 'skin', name: '피부 3', price: 0, c: '#d9a273', c2: '#bf8657' },
  { id: 'skin_4', slot: 'skin', name: '피부 4', price: 0, c: '#9c6a45', c2: '#7e5233' },
];
const ITEM_MAP = Object.fromEntries(ITEMS.map(i => [i.id, i]));
const FREE_ITEMS = ITEMS.filter(i => !i.price).map(i => i.id);
const SLOTS = [['hat', '모자'], ['hair', '헤어'], ['hairColor', '머리색'], ['top', '상의'], ['bottom', '하의'], ['shoes', '신발'], ['skin', '피부']];
// 기본 복장 = 포도농장 일꾼
const DEFAULT_LOOKS = {
  f: { skin: 'skin_1', hair: 'hair_braids', hairColor: 'hc_brown', hat: 'hat_straw', top: 'top_overall', bottom: 'bot_jeans', shoes: 'shoe_boots_brown' },
  m: { skin: 'skin_2', hair: 'hair_short', hairColor: 'hc_black', hat: 'hat_cap', top: 'top_suspender', bottom: 'bot_brown', shoes: 'shoe_boots_brown' },
};
const DEFAULT_LOOK = DEFAULT_LOOKS.f;

// ───────── 습관 규칙 ─────────
const Logic = (() => {
  const pad = n => String(n).padStart(2, '0');
  const dateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayStr = () => dateStr(new Date());
  const toDate = ds => { const [y, m, d] = ds.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (ds, n) => { const d = toDate(ds); d.setDate(d.getDate() + n); return dateStr(d); };
  const fmtDate = ds => { const d = toDate(ds); return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} (${'일월화수목금토'[d.getDay()]})`; };
  const hasDate = (h, ds) => h.grapes.some(g => g.date === ds);
  const checkedToday = h => hasDate(h, todayStr());

  function bunchInfo(h) {
    const size = VARIETIES[h.variety].size, total = h.grapes.length;
    const complete = Math.floor(total / size);
    return { size, total, complete, partial: total % size, current: complete, harvestable: complete - (h.harvested || 0) };
  }
  function streak(h) {
    const set = new Set(h.grapes.map(g => g.date));
    let d = todayStr();
    if (!set.has(d)) d = addDays(d, -1);
    let n = 0;
    while (set.has(d)) { n++; d = addDays(d, -1); }
    return n;
  }
  function bestStreak(h) {
    const ds = [...new Set(h.grapes.map(g => g.date))].sort();
    let best = 0, run = 0, prev = null;
    for (const d of ds) { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }
    return best;
  }
  function totals(state) {
    let grapes = 0, bunches = 0;
    for (const h of state.habits) { grapes += h.grapes.length; bunches += h.harvested || 0; }
    return { grapes, bunches, habits: state.habits.length };
  }
  function levelInfo(total) {
    let lv = 1, acc = 0, need = 5;
    while (total >= acc + need) { acc += need; lv++; need = lv * 5; }
    return { lv, cur: total - acc, need };
  }
  function addGrape(state, h, { date, note, mood }) {
    h.grapes.push({ date, note: note || '', mood: mood || '', at: Date.now() });
    state.coins += CHECKIN_COINS;
    return { index: h.grapes.length - 1, completed: h.grapes.length % VARIETIES[h.variety].size === 0 };
  }
  function harvest(state, h) {
    if (bunchInfo(h).harvestable <= 0) return 0;
    h.harvested = (h.harvested || 0) + 1;
    (h.harvestLog = h.harvestLog || []).push(todayStr());
    const reward = VARIETIES[h.variety].reward;
    state.coins += reward;
    return reward;
  }
  return { dateStr, todayStr, toDate, addDays, fmtDate, hasDate, checkedToday, bunchInfo, streak, bestStreak, totals, levelInfo, addGrape, harvest };
})();
