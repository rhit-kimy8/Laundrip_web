# LaundriP 코드 설명서 (한국어)

> 커리어 페어에서 "이 앱이 어떻게 동작하나요?"라는 질문에 답할 수 있도록 만든 설명서예요.
> 처음부터 끝까지 읽는 데 15분 정도 걸려요.

---

## 1. 30초 소개

**LaundriP**는 코인세탁방에서 기다리는 시간 동안 **주변에서 갈 만한 곳을 추천**해 주는 앱이에요. 주 사용자는 한국에 온 외국인 관광객이에요.

1. 지도에서 근처 코인세탁방과 세탁기/건조기 현황을 보여줘요.
2. 세탁을 시작하면 타이머가 돌아가요.
3. 남은 시간 안에 걸어서 다녀올 수 있는 관광지, 맛집, 전통시장, 문화시설을 **내 취향에 맞춰** 추천해요.

**기술 한 줄 요약**: React Native(Expo) + TypeScript로 만든 앱이고, **같은 코드로 Android 앱과 웹을 둘 다 빌드**해요. 데이터는 Kakao Local API와 한국관광공사 TourAPI를 쓰고, 추천은 **코사인 유사도 + Haversine 거리**로 계산해요.

---

## 2. 사용자 흐름 (화면 순서)

```
스플래시(3초) → 온보딩(언어 + 취향 선택) → 지도 탭 ⇄ 문화콘텐츠 탭
                                              │
                         세탁방 마커 탭 → 세탁방 팝업 → 시간 선택 → 타이머 + 추천 목록
                         장소 마커/카드 탭 → 장소 상세(사진, 소개, 카카오맵 열기)
```

| 화면 | 파일 | 하는 일 |
|---|---|---|
| 스플래시 | `app/_layout.tsx` | 로고를 3초 보여준 뒤 온보딩으로 이동 |
| 온보딩 | `src/screens/OnboardingScreen.tsx` | 언어 4개(한/영/일/중), 취향 6개 중 선택 → 저장 |
| 지도 | `src/screens/MapScreen.tsx` | 앱의 중심. 지도, 검색, 필터, 타이머, 추천 |
| 문화콘텐츠 | `src/screens/CultureScreen.tsx` | 주변 장소를 카테고리별 목록으로 보여줌 |

---

## 3. 폴더 구조

```
app/                      ← "주소(라우트)"만 있는 곳. Expo Router가 이 폴더를 보고 화면 경로를 만들어요.
  _layout.tsx             스플래시 → 온보딩 → 탭 화면 순서를 정함
  (tabs)/_layout.tsx      아래쪽 탭 바 (지도 / 문화콘텐츠)
  (tabs)/index.tsx        지도 탭 → MapScreen 보여주기
  (tabs)/explore.tsx      문화콘텐츠 탭 → CultureScreen 보여주기

src/
  LanguageContext.tsx     4개 언어 번역 문구 + 현재 언어를 앱 전체에 공유

  screens/                화면 3개
    OnboardingScreen.tsx
    MapScreen.tsx
    CultureScreen.tsx

  components/             화면을 구성하는 부품
    KakaoMap.tsx          지도 (폰: WebView 안에서 카카오 지도)
    KakaoMap.web.tsx      지도 (웹: iframe 안에서 카카오 지도)
    KakaoMapShared.ts     위 두 파일이 같이 쓰는 지도 HTML과 마커 클릭 처리
    LaundryPopup.tsx      세탁방 팝업 (세탁기/건조기 수, 시작 버튼)
    TimePickerModal.tsx   세탁/건조 시간 선택
    TimerBanner.tsx       위쪽에 뜨는 남은 시간 배너
    CultureCard.tsx       장소 카드 한 장
    PlaceDetailModal.tsx  장소 상세 정보 창

  services/               데이터와 계산 (화면 없음)
    api.ts                API 키 모음 + 네트워크 호출 (폰/웹 분기)
    geo.ts                거리 계산(Haversine), 거리/도보시간 표시, 현재 위치
    LaundryService.ts     주변 코인세탁방 검색 (Kakao)
    TourAPI.ts            관광지·음식점·문화시설·축제·상세정보 (data.go.kr)
    MarketService.ts      전통시장 (앱에 들어있는 JSON 데이터)
    RecommendationEngine.ts  취향 맞춤 추천 알고리즘

  data/
    markets.json          전통시장 목록 (markets.csv를 변환한 것)

api/                      ← 웹 버전 전용 작은 서버 (Vercel)
  kakao.js                브라우저 → 우리 서버 → Kakao
  datagokr.js             브라우저 → 우리 서버 → 공공데이터포털
```

**기억하기 쉬운 규칙**: `screens`는 화면, `components`는 부품, `services`는 데이터와 계산이에요.

---

## 4. 핵심 로직 3가지

### 4-1. 주변 코인세탁방 찾기 (`LaundryService.ts`)

1. 현재 위치를 가져와요 (`geo.ts`의 `getUserLocation`). 권한이 없으면 서울시청 좌표를 써요.
2. Kakao 키워드 검색 API에 `코인세탁`, `빨래방`, `laundry`, `세탁방` 4개를 **동시에** 검색해요 (`Promise.all`).
3. 결과를 합치고 같은 가게(같은 id)는 한 번만 남겨요 (`Set`으로 중복 제거).
4. 최대 10개를 돌려줘요.

> **솔직하게 말할 부분**: 세탁기/건조기 대수는 **랜덤 모의 데이터**예요. 실제 세탁기와 연결된 IoT 데이터가 없어서 UI 흐름을 검증하는 용도로 만들었어요. 세탁을 시작하면 그 가게의 대수가 1 줄어드는 것도 앱 안에서만 바뀌어요.

### 4-2. 취향 맞춤 추천 (`RecommendationEngine.ts`)

**아이디어**: "내 취향과 비슷하고, 가까운 곳"에 높은 점수를 줘요.

**① 취향을 숫자 벡터로 바꾸기**
카테고리 6개 `[관광지, 음식점, 문화시설, 전통시장, 쇼핑, 축제/행사]`를 기준으로, 해당하면 1, 아니면 0이에요.

- 사용자가 온보딩에서 "미식(food)"을 고르면 → 관련 카테고리 `음식점, 전통시장` → **`[0, 1, 0, 1, 0, 0]`**
- 음식점 한 곳 → **`[0, 1, 0, 0, 0, 0]`**

**② 코사인 유사도** (두 벡터가 얼마나 같은 방향인지, 0~1)

```
cos = (A·B) / (|A| × |B|) = 1 / (√2 × 1) ≈ 0.71
```

관광지였다면 겹치는 칸이 없어서 0이에요.

**③ 거리 점수** — Haversine 공식으로 지구 위 두 점 사이의 실제 거리를 계산해요 (`geo.ts`).
`거리 점수 = 1 − (거리 ÷ 최대 거리)` → 가까울수록 1에 가까워요.

**④ 최종 점수**

```
최종 점수 = 취향 유사도 × 0.7 + 거리 점수 × 0.3
```

최대 거리 안에 있는 장소만 남기고, 점수 순으로 **상위 5개**를 보여줘요.

**최대 거리 계산**: 남은 시간의 80%만 쓰고(여유 20%), 왕복이라 절반으로 나누고, 도보 속도 분당 67m를 곱해요.

> ⚠️ **알고 있어야 할 버그** (7번 참고): 지금 코드는 여기서 `× 60`이 한 번 더 들어가 있어서 최대 거리가 60배 크게 계산돼요.

**Gemini AI 추천**: `getAIRecommendations`는 주변 장소 목록을 Gemini에게 보내서 TOP 3 번호를 받아오는 코드예요. 대회 중 API 한도 문제로 `MapScreen.tsx`에서 **임시로 꺼 두었고**, 지금 "AI 추천" 칸에는 취향 추천 결과가 똑같이 표시돼요.

### 4-3. 세탁 타이머 (`MapScreen.tsx`)

1. 시간을 고르면 `remainSeconds`에 초 단위로 저장하고 1초마다 1씩 줄여요 (`setInterval`).
2. 끝나는 시각을 `AsyncStorage`(폰 저장소, 웹에서는 localStorage)에 저장해요.
3. 0초가 되면 "세탁이 완료되었습니다" 알림을 띄우고 추천 목록을 닫아요.
4. 배너의 ✕를 누르면 저장된 값을 지우고 타이머를 멈춰요.

---

## 5. 데이터는 어디서 오나요?

| 데이터 | 출처 | 파일 |
|---|---|---|
| 코인세탁방, 장소 검색, 주소→좌표 | Kakao Local API | `LaundryService.ts`, `TourAPI.ts`, `MapScreen.tsx` |
| 관광지, 음식점, 문화시설, 축제, 상세정보 | 한국관광공사 TourAPI (공공데이터포털) | `TourAPI.ts` |
| 박물관, 미술관 | 문화기반시설 API (공공데이터포털) | `TourAPI.ts` |
| 전통시장 | 앱에 포함된 JSON | `MarketService.ts`, `data/markets.json` |
| 지도 화면 | Kakao Maps JavaScript SDK | `KakaoMapShared.ts` |
| AI 추천 (꺼져 있음) | Google Gemini | `RecommendationEngine.ts` |

---

## 6. 폰 버전과 웹 버전은 무엇이 다른가요?

**코드는 거의 전부 같아요.** TypeScript는 빌드할 때 자동으로 JavaScript로 바뀌고, Expo가 같은 코드를 Android용과 웹용으로 각각 만들어 줘요. 다른 곳은 딱 세 군데예요.

**① 지도 (`KakaoMap.tsx` vs `KakaoMap.web.tsx`)**
폰에서는 `WebView`라는 "앱 안의 작은 브라우저"에 카카오 지도 HTML을 띄워요. 웹에는 `WebView`가 없어서 같은 HTML을 `<iframe>`에 띄워요. 파일 이름이 `.web.tsx`로 끝나면 Expo가 웹 빌드 때 **자동으로** 그 파일을 골라요. 지도 HTML과 마커 클릭 처리는 `KakaoMapShared.ts` 하나를 둘 다 써요.

**② API 호출 (`api.ts` + `api/` 폴더)**
브라우저는 보안 규칙(CORS) 때문에 다른 사이트의 API를 마음대로 부를 수 없어요. 그래서 웹 버전은 우리 서버(`/api/kakao`, `/api/datagokr`)를 거쳐서 호출해요.

```
폰:  앱 ─────────────────────────→ Kakao / 공공데이터포털
웹:  브라우저 → 우리 서버(Vercel) → Kakao / 공공데이터포털
                (여기서 API 키를 붙임)
```

덤으로 **REST API 키가 브라우저에 노출되지 않아요.** 키는 서버에만 있어요.

**③ 위치 (웹만)**
데이터가 한국만 있기 때문에, 브라우저 위치가 한국 밖이면(예: 미국 커리어 페어) 서울시청 좌표로 보여줘요.

---

## 7. 알고 있는 한계와 버그 (면접에서 먼저 말하면 좋아요)

| 내용 | 위치 | 설명 |
|---|---|---|
| 추천 최대 거리 단위 오류 | `RecommendationEngine.ts`의 `getMaxDistance` | `(분 ÷ 2) × 60 × 67` → `× 60`이 분을 초로 바꾸는데 속도는 "분당" 67m라서 60배 커져요. 40분 세탁이면 원래 약 1km여야 하는데 약 64km가 돼요. 그래서 사실상 거리 제한이 없고 거리 점수도 거의 1이에요. 고치면 `(분 ÷ 2) × 67`. |
| 영어 등으로 시작하면 세탁방 마커가 처음에 안 보임 | `MapScreen.tsx` 42번째 줄 | 필터 초기값이 한국어 `'전체'`로 고정되어 있어서, 영어면 `'All'`과 달라 세탁방이 숨겨져요. "All"을 한 번 누르면 보여요. |
| 세탁기 대수가 모의 데이터 | `LaundryService.ts` | 실제 IoT 연동 없음 |
| 검색 기준 위치가 서울 고정 | `MapScreen.tsx`의 `handleSearch` | 현재 위치가 아니라 서울시청 기준으로 검색해요 |
| 앱을 열 때마다 온보딩 | `app/_layout.tsx` | 취향은 저장되지만 온보딩 화면은 매번 나와요 |
| Gemini 추천 꺼져 있음 | `MapScreen.tsx` | 한도 문제로 임시 비활성화 |

> 이번 웹 전환 작업에서는 "기존 기능은 건드리지 않는다"는 원칙 때문에 위 항목들을 **일부러 고치지 않았어요.** 고칠지는 Eden이 결정하면 돼요.

---

## 8. TypeScript ↔ Java 치트시트

| TypeScript (이 코드) | Java로 생각하면 |
|---|---|
| `interface LaundryShop { name: string; washer: number }` | `class LaundryShop { String name; int washer; }` |
| `const x = 5` / `let y = 5` | `final int x = 5` / `int y = 5` |
| `(a, b) => a + b` | 람다 `(a, b) -> a + b` |
| `list.map(...)`, `.filter(...)`, `.sort(...)` | Stream의 `map`, `filter`, `sorted` |
| `async` / `await fetch(url)` | `CompletableFuture`로 비동기 호출 후 결과 기다리기 |
| `Promise.all([...])` | 여러 `CompletableFuture`를 `allOf`로 동시에 기다리기 |
| `useState(0)` | 화면과 연결된 필드. 값이 바뀌면 화면이 다시 그려짐 |
| `useEffect(() => {...}, [])` | 화면이 처음 열릴 때 한 번 실행 (생성자/초기화 느낌) |
| `export default function MapScreen()` | 화면 하나 = 클래스 하나 (Swing의 `JPanel` 느낌) |
| `props` | 부모가 자식 컴포넌트에 넘겨주는 생성자 인자 |
| `a?.b` | `a != null ? a.b : null` |
| `a ?? b` | `a != null ? a : b` |

---

## 9. 실행하고 배포하는 방법

**API 키 준비**: `.env.example`을 복사해서 `.env`를 만들고 키를 채워요. `.env`는 `.gitignore`에 있어서 GitHub에 올라가지 않아요.

**폰 (지금까지처럼)**
```bash
npm install
npx expo start          # Expo Go / 개발 빌드
eas build -p android    # APK
```

**웹 배포 (Vercel, 무료)**
1. GitHub 레포를 Vercel에 연결해요 (`vercel.json`에 빌드 설정이 들어 있어요).
2. Vercel → Settings → Environment Variables에 `EXPO_PUBLIC_KAKAO_MAP_KEY`, `KAKAO_REST_KEY`, `TOUR_API_KEY`를 넣어요.
3. Kakao Developers → 내 앱 → 플랫폼 → **Web 사이트 도메인**에 배포 주소(예: `https://laundrip.vercel.app`)를 추가해요. 안 하면 지도가 안 떠요.
4. 배포 주소를 QR 코드로 만들어서 커리어 페어에서 보여주면 돼요.

**웹을 내 컴퓨터에서 확인**: `/api` 서버까지 같이 돌리려면 `npx vercel dev`를 써요. (`npx expo start --web`만 쓰면 화면은 뜨지만 데이터 호출이 실패해요.)

---

## 10. 예상 질문과 답변

**Q. 이 앱을 왜 만들었나요?**
외국인 관광객이 코인세탁방에서 40~60분을 그냥 기다리는 게 아깝다고 생각했어요. 그 시간을 주변 문화 체험으로 바꾸자는 아이디어로 문화체육관광부 공모전에 냈어요.

**Q. 추천은 어떻게 동작하나요?**
취향과 장소를 카테고리 벡터로 만들고 코사인 유사도로 비교해요. 거기에 Haversine 공식으로 구한 거리 점수를 7:3으로 섞어서 상위 5개를 보여줘요.

**Q. 왜 머신러닝 모델이 아니라 코사인 유사도인가요?**
사용자 데이터가 없는 상태(콜드 스타트)라서 학습할 데이터가 없었어요. 설명 가능하고 바로 동작하는 방법을 골랐고, 그 위에 Gemini로 한 번 더 고르는 구조를 준비했어요.

**Q. 웹 버전은 어떻게 만들었나요?**
Expo가 react-native-web을 지원해서 같은 TypeScript 코드로 웹을 빌드했어요. WebView를 쓰는 지도만 `.web.tsx` 파일로 iframe 버전을 따로 만들었고, 브라우저 CORS 제한 때문에 Vercel 서버리스 함수로 작은 프록시를 두었어요. 덕분에 REST API 키도 서버에만 있어요.

**Q. 가장 어려웠던 문제는?**
APK 빌드에서만 생긴 문제들이에요. react-native-reanimated와 New Architecture 충돌로 앱이 꺼지는 문제, 배포 빌드에서 카카오 지도가 안 뜨는 문제(WebView `baseUrl`과 카카오 콘솔 도메인 등록으로 해결), Android가 http 이미지를 막는 문제(https로 바꿔서 해결)를 혼자 디버깅했어요.

**Q. 세탁기 현황은 실시간인가요?**
아니요, 지금은 모의 데이터예요. 실제 서비스라면 세탁방 IoT 기기나 점주용 입력 화면이 필요해요.

**Q. 더 개선한다면?**
추천 최대 거리 단위 버그 수정, 세탁 완료 푸시 알림, 실제 세탁기 데이터 연동, 사용자 피드백(좋아요/싫어요)으로 취향 벡터를 업데이트하는 것이요.
