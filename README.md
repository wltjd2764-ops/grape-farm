# 🍇 포도알 농장 (Château Raisin)

어릴 적 포도알 칭찬 스티커판을 타이쿤 농장 게임으로 만든 해빗 트래커.

## 실행
`index.html`을 더블클릭 (Chrome/Edge 권장). 설치 필요 없음.
- 주소 끝에 `#demo`를 붙이면 체험 계정으로 바로 입장 (발표용)
- 체험 계정: `demo` / `demo1234`

## 핵심 규칙
- 습관 하나 = 포도나무 하나. 하루 한 번 실천하면 포도알 1개 (생성일 · 기분 · 소감 기록)
- 품종별 송이 크기: 머루포도 30알(매일 루틴) · 캠벨 24알 · 샤인머스켓 20알 · 거봉 15알(이벤트성)
- 송이가 다 차면 수확 → 코인 지급. 수확한 송이는 나무에 계속 남음
- 코인으로 옷 구매, 미니게임, 부지 확장 (수확한 송이 수 + 코인 필요)

## 조작
클릭/탭으로 이동 · 밭/건물 클릭으로 열기 · WASD/방향키 이동 · E/스페이스 상호작용

## 파일 구성
| 파일 | 역할 |
|---|---|
| `js/data.js` | 품종, 아이템, 규칙(연속일·레벨·수확) |
| `js/storage.js` | 회원가입/로그인(SHA-256 해시), 계정별 저장, 체험 계정 |
| `js/pix.js` | 픽셀 엔진: 자동 외곽선, 도트 다각형, 픽셀 아이콘 |
| `js/sprites.js` | 캐릭터(남/여 · 옷 레이어), 아이소메트릭 건물, 포도 덩굴, 소품 |
| `js/world.js` | 아이소메트릭 농장 맵, 이동/충돌/깊이 정렬, 낮·노을·밤 조명 |
| `js/scene.js` | 로그인 화면 픽셀 노을 포도밭 |
| `js/ui.js` | HUD, 스티커판, 기록, 수확, 기록장, 옷장 |
| `js/minigame.js` | 미니게임 "포도 받기" |
| `js/fx.js`, `js/audio.js` | 꽃가루·코인 이펙트, 효과음 |

## 저장 방식
- **로컬 모드** (기본): `js/firebase-config.js`가 `null`이거나 파일을 더블클릭으로 열었을 때. 계정은 그 브라우저에만 저장.
- **클라우드 모드**: Firebase 설정을 넣고 `http(s)://` 주소로 열었을 때. 어느 기기에서든 같은 계정으로 로그인.
- 체험 계정(`demo`)은 항상 로컬 모드.

## Firebase 연결하기 (클라우드 모드)
1. https://console.firebase.google.com → **프로젝트 추가** (Google 애널리틱스는 꺼도 됨)
2. 프로젝트 홈에서 **웹 앱 추가(`</>`)** → 이름 입력 → 나오는 `firebaseConfig` 값을 복사
3. `js/firebase-config.js`의 `const FIREBASE_CONFIG = null;`을 복사한 값으로 교체
4. **Authentication** → 시작하기 → 로그인 방법 → **이메일/비밀번호** 사용 설정
5. **Firestore Database** → 데이터베이스 만들기 → 위치 `asia-northeast3 (서울)` → 프로덕션 모드
6. Firestore → **규칙** 탭에 아래를 붙여넣고 게시:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
7. 배포한 주소(예: `○○○.github.io`)를 Authentication → 설정 → **승인된 도메인**에 추가

로컬에서 클라우드 모드를 확인하려면 폴더에서 `npx serve`를 실행하고 `http://localhost:3000`으로 엽니다.

내부 구조: 아이디 `abc`는 Firebase Auth에 `abc@grape-farm.app` 이메일 계정으로 만들어지고, 농장 데이터 전체는 Firestore `users/{uid}` 문서 하나에 저장됩니다. 저장은 0.8초 모아서 한 번에 하고, 탭을 닫거나 숨길 때 즉시 저장합니다.
