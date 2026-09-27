import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// API keys — all in one place.
// Put the real values in a `.env` file (copy `.env.example`).
// `.env` is in .gitignore, so keys never go to GitHub.
// ─────────────────────────────────────────────────────────────
export const KAKAO_MAP_KEY = process.env.EXPO_PUBLIC_KAKAO_MAP_KEY ?? ''; // Kakao JavaScript key (map)
export const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY ?? '';       // Google Gemini (AI recommendation)
const KAKAO_REST_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_KEY ?? '';     // Kakao REST key (place search)
const TOUR_API_KEY = process.env.EXPO_PUBLIC_TOUR_API_KEY ?? '';         // data.go.kr key (TourAPI, culture facilities)

// On the web, browsers block direct calls to Kakao / data.go.kr (CORS).
// So the web version calls our own tiny server (the `api/` folder, deployed on Vercel),
// which adds the key and forwards the request. The Android app calls the APIs directly, as before.
const IS_WEB = Platform.OS === 'web';

/** Kakao Local API (e.g. path = '/v2/local/search/keyword.json'). Returns parsed JSON. */
export const kakaoGet = async (path: string, query: string): Promise<any> => {
  const response = IS_WEB
    ? await fetch(`/api/kakao?path=${encodeURIComponent(path)}&${query}`)
    : await fetch(`https://dapi.kakao.com${path}?${query}`, {
        headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` },
      });
  return response.json();
};

/** Korean public data API (e.g. path = '/B551011/KorService2/locationBasedList2'). Returns raw text. */
export const dataGoKrGet = async (path: string, query: string): Promise<string> => {
  const response = IS_WEB
    ? await fetch(`/api/datagokr?path=${encodeURIComponent(path)}&${query}`)
    : await fetch(`https://apis.data.go.kr${path}?serviceKey=${TOUR_API_KEY}&${query}`);
  return response.text();
};
