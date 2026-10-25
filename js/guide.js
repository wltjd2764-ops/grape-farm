'use strict';
// ───────── 농장 운영 안내서 (한 장씩 넘기는 설명서) ─────────
const Guide = (() => {
  const ic = Pix.img;
  const sprite = (cv, w) => `<img class="gd-sprite" src="${cv.toDataURL()}" style="width:${w}px" alt="">`;

  const pages = () => [
    {
      title: '포도알 농장에 오신 걸 환영해요!',
      art: sprite(Sprites.bigBunch('meoru'), 104),
      body: `<p>어릴 적 <b>칭찬 포도 스티커판</b> 기억나시나요?<br>좋은 일을 할 때마다 포도알 스티커를 한 칸씩 붙였죠.</p>
        <p>포도알 농장은 그 스티커판을 <b>나만의 포도 농장</b>으로 키우는 습관 기록 앱이에요.<br>
        습관을 지킨 날마다 포도알이 하나씩 열리고, 포도가 주렁주렁 열린 농장이 곧 <b>내가 쌓아온 노력</b>이에요.</p>`,
    },
    {
      title: '1. 포도나무 심기',
      art: `<div class="gd-row">${['meoru', 'campbell', 'shine', 'kyoho'].map(v => `<div class="gd-var">${UI.bunchImg(v, VARIETIES[v].size)}<b>${VARIETIES[v].name}</b><small>${VARIETIES[v].size}알</small></div>`).join('')}</div>`,
      body: `<p><b>습관 하나 = 포도나무 한 그루</b>예요. 농장의 빈 밭을 눌러 "운동", "독서"처럼 키우고 싶은 습관을 심어요.</p>
        <ul><li><b>머루포도(30알)</b>: 매일 하는 루틴</li><li><b>캠벨(24알)</b>: 주 5회 이상 꾸준한 습관</li>
        <li><b>샤인머스켓(20알)</b>: 새로 도전하는 습관</li><li><b>거봉(15알)</b>: 가끔 하는 특별한 일</li></ul>`,
    },
    {
      title: '2. 하루 한 알, 포도알 붙이기',
      art: `<div class="gd-row">${ic('grape', 'xl')}${ic('cal', 'lg')}${ic('smile', 'lg')}${ic('pencil', 'lg')}</div>`,
      body: `<p>습관을 지킨 날, 포도나무를 눌러 <b>오늘의 포도알 붙이기</b>를 눌러요.</p>
        <ul><li>포도알마다 <b>날짜 · 기분 · 소감</b>을 남길 수 있어요.</li>
        <li>깜빡했다면 <b>지난 날</b> 버튼으로 하루 늦게 붙여도 돼요. (같은 날은 한 알만!)</li>
        <li>붙인 포도알을 누르면 그날의 기록을 다시 볼 수 있어요.</li>
        <li>물방울 ${ic('drop')} 이 떠 있는 나무는 오늘 아직 돌보지 않은 나무예요.</li></ul>`,
    },
    {
      title: '3. 송이 완성 → 수확!',
      art: `<div class="gd-row">${UI.bunchImg('campbell', 24)}<span class="gd-arrow">▶</span>${ic('basket', 'xl')}<span class="gd-arrow">▶</span>${ic('coin', 'xl')}</div>`,
      body: `<p>포도알이 한 송이만큼 모이면 나무 위에 <b>수확!</b> 표시가 떠요. 수확하면 <b>코인</b>을 받아요.</p>
        <p>수확한 송이는 사라지지 않고 <b>나무에 계속 매달려</b> 있어요. 농장이 무성해질수록 그만큼 노력한 거예요!<br>
        지금까지 모은 송이는 <b>샤토(기록장)</b>의 송이 컬렉션에서 볼 수 있어요.</p>`,
    },
    {
      title: '4. 코인으로 농장 꾸미기',
      art: `<div class="gd-row">${sprite(Sprites.charSprite(DEFAULT_LOOKS.f, 'f', 'down', 0), 60)}${sprite(Sprites.charSprite(DEFAULT_LOOKS.m, 'm', 'down', 0), 60)}${ic('sign', 'xl')}${ic('game', 'xl')}</div>`,
      body: `<ul><li>${ic('hat')} <b>부티크</b>: 모자, 헤어, 옷, 신발을 입어보고 코인으로 사요.</li>
        <li>${ic('sign')} <b>부지 확장</b>: 송이를 수확하고 코인을 모으면 새 밭을 열어 습관을 더 심을 수 있어요.</li>
        <li>${ic('game')} <b>와인 저장고</b>: 미니게임 "포도 받기"로 코인을 더 벌 수 있어요.</li>
        <li>${ic('book')} <b>샤토</b>: 포도알 일기, 송이 컬렉션, 달력, 통계를 볼 수 있어요.</li></ul>`,
    },
    {
      title: '5. 조작법',
      art: `<div class="gd-keys"><kbd>W</kbd><div><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div></div>`,
      body: `<ul><li><b>클릭/탭</b>: 그곳으로 걸어가요. 밭이나 건물을 누르면 걸어가서 바로 열려요.</li>
        <li><b>WASD · 방향키</b>: 캐릭터 이동</li><li><b>E · 스페이스</b>: 가까이 있는 밭/건물 열기</li>
        <li>아래 버튼으로 <b>오늘의 포도</b> 목록을 열면 오늘 할 습관을 한 번에 체크할 수 있어요.</li>
        <li>설정 ${ic('gear')} 에서 하늘(낮·노을·밤)과 효과음을 바꿀 수 있어요.</li></ul>
        <p class="gd-end">${ic('star')} 매일 한 알씩, 나만의 포도 농장을 가꿔보세요! ${ic('star')}</p>`,
    },
  ];

  function open() {
    const list = pages();
    let i = 0;
    const m = UI.modal({ title: '농장 운영 안내서', icon: 'book', cls: 'guide-modal' });
    function render() {
      const p = list[i];
      m.body.innerHTML = `
        <div class="gd-page">
          <div class="gd-art">${p.art}</div>
          <h3>${p.title}</h3>
          <div class="gd-body">${p.body}</div>
        </div>
        <div class="gd-nav">
          <button class="btn ghost small" data-act="prev" ${i === 0 ? 'disabled' : ''}>◀ 이전</button>
          <div class="gd-dots">${list.map((_, k) => `<i class="${k === i ? 'on' : ''}" data-k="${k}"></i>`).join('')}</div>
          ${i < list.length - 1
            ? '<button class="btn grape small" data-act="next">다음 ▶</button>'
            : '<button class="btn small" data-act="done">시작하기!</button>'}
        </div>`;
      const on = (a, fn) => { const b = m.body.querySelector(`[data-act=${a}]`); if (b) b.onclick = fn; };
      on('prev', () => { i--; Sfx.click(); render(); });
      on('next', () => { i++; Sfx.click(); render(); });
      on('done', () => { Sfx.click(); m.close(); });
      m.body.querySelectorAll('.gd-dots i').forEach(d => { d.onclick = () => { i = +d.dataset.k; render(); }; });
    }
    const key = e => {
      if (m.closed) return removeEventListener('keydown', key);
      if (e.key === 'ArrowRight' && i < list.length - 1) { i++; render(); }
      if (e.key === 'ArrowLeft' && i > 0) { i--; render(); }
    };
    addEventListener('keydown', key);
    render();
  }
  return { open };
})();
