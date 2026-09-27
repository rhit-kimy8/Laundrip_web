# LaundriP Code Guide (English)

> A guide for answering "How does this app work?" at a career fair.
> About a 15-minute read.

---

## 1. 30-second pitch

**LaundriP** turns laundromat wait time into a mini trip. Its main users are foreign tourists in Korea.

1. The map shows nearby coin laundromats and how many washers and dryers are free.
2. When you start a wash, a countdown timer begins.
3. The app recommends tourist spots, restaurants, traditional markets, and museums **that match your interests** and that you can walk to and back before your laundry is done.

**Tech in one line**: React Native (Expo) + TypeScript, built as **both an Android app and a website from the same code**. Data comes from the Kakao Local API and the Korea Tourism Organization's TourAPI. Recommendations use **cosine similarity + Haversine distance**.

---

## 2. User flow

```
Splash (3s) → Onboarding (language + interests) → Map tab ⇄ Culture tab
                                                   │
                     tap laundromat → laundromat popup → pick time → timer + recommendations
                     tap place marker/card → place detail (photo, overview, open in Kakao Map)
```

| Screen | File | What it does |
|---|---|---|
| Splash | `app/_layout.tsx` | Shows the logo for 3 seconds, then onboarding |
| Onboarding | `src/screens/OnboardingScreen.tsx` | Pick 1 of 4 languages (KO/EN/JA/ZH) and any of 6 interests → saved |
| Map | `src/screens/MapScreen.tsx` | The core screen: map, search, filters, timer, recommendations |
| Culture | `src/screens/CultureScreen.tsx` | Nearby places as lists grouped by category |

---

## 3. Folder structure

```
app/                      ← Routes only. Expo Router turns this folder into screen URLs.
  _layout.tsx             Order: splash → onboarding → tabs
  (tabs)/_layout.tsx      Bottom tab bar (Map / Culture)
  (tabs)/index.tsx        Map tab → shows MapScreen
  (tabs)/explore.tsx      Culture tab → shows CultureScreen

src/
  LanguageContext.tsx     UI text in 4 languages + the current language, shared app-wide

  screens/                The 3 screens
    OnboardingScreen.tsx
    MapScreen.tsx
    CultureScreen.tsx

  components/             Building blocks used by the screens
    KakaoMap.tsx          Map (phone: Kakao map inside a WebView)
    KakaoMap.web.tsx      Map (web: Kakao map inside an iframe)
    KakaoMapShared.ts     Map HTML + marker-tap handling shared by both
    LaundryPopup.tsx      Laundromat popup (washer/dryer counts, start button)
    TimePickerModal.tsx   Pick washer/dryer and minutes
    TimerBanner.tsx       Countdown banner at the top
    CultureCard.tsx       One place card
    PlaceDetailModal.tsx  Place detail window

  services/               Data and calculations (no UI)
    api.ts                All API keys + network calls (phone vs web)
    geo.ts                Haversine distance, distance/walk-time text, current location
    LaundryService.ts     Find nearby laundromats (Kakao)
    TourAPI.ts            Attractions, restaurants, culture, festivals, details (data.go.kr)
    MarketService.ts      Traditional markets (JSON bundled with the app)
    RecommendationEngine.ts  Interest-based recommendation algorithm

  data/
    markets.json          Traditional market list (converted from markets.csv)

api/                      ← Tiny server for the web version only (Vercel)
  kakao.js                browser → our server → Kakao
  datagokr.js             browser → our server → Korean public data portal
```

**Easy rule**: `screens` = screens, `components` = parts, `services` = data and math.

---

## 4. Three core pieces of logic

### 4-1. Finding nearby laundromats (`LaundryService.ts`)

1. Get the current location (`getUserLocation` in `geo.ts`). If permission is denied, use Seoul City Hall.
2. Search Kakao for 4 keywords **at the same time** (`Promise.all`): `코인세탁`, `빨래방`, `laundry`, `세탁방`.
3. Merge the results and keep each shop once (dedupe by id with a `Set`).
4. Return up to 10 shops.

> **Be upfront about this**: washer/dryer counts are **random mock data**. There's no real IoT feed from the machines, so the counts exist to test the UI flow. When you start a wash, the shop's count drops by one, but only inside the app.

### 4-2. Interest-based recommendation (`RecommendationEngine.ts`)

**Idea**: give a high score to places that are **similar to your interests** and **close by**.

**① Turn interests into a vector**
Using 6 categories `[Attraction, Restaurant, Culture, Market, Shopping, Festival]`, each slot is 1 if it applies, else 0.

- User picks "Food" in onboarding → related categories `Restaurant, Market` → **`[0, 1, 0, 1, 0, 0]`**
- A restaurant → **`[0, 1, 0, 0, 0, 0]`**

**② Cosine similarity** (how much two vectors point the same way, 0 to 1)

```
cos = (A·B) / (|A| × |B|) = 1 / (√2 × 1) ≈ 0.71
```

An attraction would share no slots, so it scores 0.

**③ Distance score**: the Haversine formula gives the real distance between two points on Earth (`geo.ts`).
`distance score = 1 − (distance ÷ max distance)`, so closer places score closer to 1.

**④ Final score**

```
final score = interest similarity × 0.7 + distance score × 0.3
```

Only places within the max distance are kept, and the **top 5** by score are shown.

**Max distance**: use 80% of the remaining time (20% buffer), halve it for a round trip, and multiply by a walking speed of 67 m per minute.

> ⚠️ **Known bug** (see section 7): the current code multiplies by an extra `× 60`, so the max distance comes out 60 times too large.

**Gemini AI recommendation**: `getAIRecommendations` sends the nearby list to Gemini and gets back the top 3. It was **turned off temporarily** in `MapScreen.tsx` during the competition because of API quota limits, so the "AI" section currently shows the same interest-based results.

### 4-3. Laundry timer (`MapScreen.tsx`)

1. The chosen time is stored in `remainSeconds` and decreases by 1 every second (`setInterval`).
2. The end time is saved to `AsyncStorage` (phone storage; `localStorage` on the web).
3. At 0, the app shows a "laundry done" alert and closes the recommendations.
4. Tapping ✕ on the banner clears the saved values and stops the timer.

---

## 5. Where does the data come from?

| Data | Source | File |
|---|---|---|
| Laundromats, place search, address → coordinates | Kakao Local API | `LaundryService.ts`, `TourAPI.ts`, `MapScreen.tsx` |
| Attractions, restaurants, culture, festivals, details | Korea Tourism Organization TourAPI (data.go.kr) | `TourAPI.ts` |
| Museums, galleries | Regional culture facility API (data.go.kr) | `TourAPI.ts` |
| Traditional markets | JSON bundled in the app | `MarketService.ts`, `data/markets.json` |
| Map display | Kakao Maps JavaScript SDK | `KakaoMapShared.ts` |
| AI recommendation (off) | Google Gemini | `RecommendationEngine.ts` |

---

## 6. How is the web version different from the phone app?

**Almost all the code is the same.** TypeScript compiles to JavaScript automatically, and Expo builds the same code for Android and for the web. There are exactly three differences.

**① The map (`KakaoMap.tsx` vs `KakaoMap.web.tsx`)**
On the phone, the Kakao map HTML runs inside a `WebView`, a small browser inside the app. The web has no `WebView`, so the same HTML runs inside an `<iframe>`. When a file ends in `.web.tsx`, Expo **automatically** picks it for the web build. Both use `KakaoMapShared.ts` for the map HTML and marker taps.

**② API calls (`api.ts` + the `api/` folder)**
A browser's security rule (CORS) blocks calls to other sites' APIs. So the web version goes through our own server (`/api/kakao`, `/api/datagokr`).

```
Phone: app ───────────────────────────→ Kakao / data.go.kr
Web:   browser → our server (Vercel) → Kakao / data.go.kr
                 (adds the API key here)
```

Bonus: **the REST API keys never reach the browser.** They live only on the server.

**③ Location (web only)**
The data only covers Korea, so if the browser is outside Korea (e.g. a US career fair), the app uses Seoul City Hall instead.

---

## 7. Known limitations and bugs (good to mention first in an interview)

| Issue | Where | Details |
|---|---|---|
| Max-distance unit bug | `getMaxDistance` in `RecommendationEngine.ts` | `(minutes ÷ 2) × 60 × 67`: the `× 60` turns minutes into seconds, but 67 is meters **per minute**, so the result is 60× too big. A 40-minute wash should allow about 1 km but gets about 64 km, so the distance filter barely applies and the distance score is nearly 1. Fix: `(minutes ÷ 2) × 67`. |
| Laundromat markers hidden at first in non-Korean languages | Line 42 of `MapScreen.tsx` | The initial filter is hardcoded to Korean `'전체'`, which doesn't match `'All'`, so laundromats are hidden until you tap "All". |
| Washer counts are mock data | `LaundryService.ts` | No real IoT integration |
| Search is centered on Seoul | `handleSearch` in `MapScreen.tsx` | Searches around Seoul City Hall, not the user's location |
| Onboarding on every launch | `app/_layout.tsx` | Interests are saved, but the onboarding screen still appears each time |
| Gemini recommendation off | `MapScreen.tsx` | Temporarily disabled because of quota limits |

> During the web conversion these were **left as-is on purpose**, following the rule "don't change existing features." Whether to fix them is Eden's call.

---

## 8. TypeScript ↔ Java cheat sheet

| TypeScript (this code) | Think of it in Java as |
|---|---|
| `interface LaundryShop { name: string; washer: number }` | `class LaundryShop { String name; int washer; }` |
| `const x = 5` / `let y = 5` | `final int x = 5` / `int y = 5` |
| `(a, b) => a + b` | Lambda `(a, b) -> a + b` |
| `list.map(...)`, `.filter(...)`, `.sort(...)` | Stream `map`, `filter`, `sorted` |
| `async` / `await fetch(url)` | An async call with `CompletableFuture`, then waiting for the result |
| `Promise.all([...])` | Waiting on several futures at once with `allOf` |
| `useState(0)` | A field wired to the screen; changing it redraws the screen |
| `useEffect(() => {...}, [])` | Runs once when the screen opens (like a constructor/init) |
| `export default function MapScreen()` | One screen = one class (like a Swing `JPanel`) |
| `props` | Constructor arguments a parent passes to a child component |
| `a?.b` | `a != null ? a.b : null` |
| `a ?? b` | `a != null ? a : b` |

---

## 9. Running and deploying

**API keys**: copy `.env.example` to `.env` and fill in the keys. `.env` is in `.gitignore`, so it never goes to GitHub.

**Phone (same as before)**
```bash
npm install
npx expo start          # Expo Go / dev build
eas build -p android    # APK
```

**Deploy the web version (Vercel, free)**
1. Connect the GitHub repo to Vercel (build settings are in `vercel.json`).
2. In Vercel → Settings → Environment Variables, add `EXPO_PUBLIC_KAKAO_MAP_KEY`, `KAKAO_REST_KEY`, and `TOUR_API_KEY`.
3. In Kakao Developers → My App → Platform → **Web site domain**, add the deployed URL (e.g. `https://laundrip.vercel.app`). Without this the map won't load.
4. Turn the URL into a QR code for the career fair.

**Trying the web version locally**: run `npx vercel dev` so the `/api` server runs too. (`npx expo start --web` alone shows the screens, but data calls will fail.)

---

## 10. Likely interview questions

**Q. Why did you build this?**
Foreign tourists often waste 40–60 minutes sitting in a laundromat. I wanted to turn that time into a short cultural experience, and submitted it to a Ministry of Culture, Sports and Tourism competition.

**Q. How does the recommendation work?**
Interests and places become category vectors compared with cosine similarity. That's blended 70/30 with a distance score from the Haversine formula, and the top 5 are shown.

**Q. Why cosine similarity instead of a machine-learning model?**
There was no user data yet (cold start), so there was nothing to train on. I chose a method that's explainable and works immediately, and set up Gemini as a second layer on top.

**Q. How did you build the web version?**
Expo supports react-native-web, so the same TypeScript code builds for the web. Only the map used a WebView, so I added a `.web.tsx` iframe version. Browsers block cross-site API calls (CORS), so I added a small proxy with Vercel serverless functions, which also keeps the REST API keys on the server.

**Q. What was the hardest problem?**
Issues that only showed up in the APK build: crashes from a conflict between react-native-reanimated and the New Architecture, the Kakao map not rendering in production (fixed with the WebView `baseUrl` and registering the domain in the Kakao console), and Android blocking http images (fixed by switching to https). I debugged them on my own.

**Q. Is the washer availability real-time?**
No, it's mock data right now. A real service would need IoT devices in the laundromat or an input screen for shop owners.

**Q. What would you improve next?**
Fix the max-distance unit bug, add a push notification when laundry is done, connect real machine data, and update the interest vector from user feedback (likes/dislikes).
