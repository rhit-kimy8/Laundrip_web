import AsyncStorage from '@react-native-async-storage/async-storage';
import { GEMINI_KEY } from './api';
import { formatDistance, formatWalkTime, haversine, WALK_METERS_PER_MIN } from './geo';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// 온보딩에서 고른 취향 → 관련 장소 카테고리
const PREFERENCE_CATEGORY_MAP: { [key: string]: string[] } = {
  history: ['관광지', '문화시설', '전통시장'],
  food: ['음식점', '전통시장'],
  shopping: ['전통시장', '쇼핑'],
  nature: ['관광지'],
  festival: ['축제/행사', '관광지'],
  art: ['문화시설', '관광지'],
};

const CATEGORIES = ['관광지', '음식점', '문화시설', '전통시장', '쇼핑', '축제/행사'];

// ['음식점', '전통시장'] → [0, 1, 0, 1, 0, 0]
const toVector = (categories: string[]): number[] => {
  return CATEGORIES.map((cat) => (categories.includes(cat) ? 1 : 0));
};

// 두 벡터가 얼마나 같은 방향인지 (0 = 전혀 다름, 1 = 완전히 같음)
const cosineSimilarity = (a: number[], b: number[]): number => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

// 남은 세탁 시간 안에 걸어서 갔다 올 수 있는 최대 거리 (m)
// 시간의 80%만 쓰고(여유 20%), 왕복이라 절반
const getMaxDistance = (remainMinutes: number): number => {
  const availableMinutes = remainMinutes * 0.8;
  return (availableMinutes / 2) * 60 * WALK_METERS_PER_MIN;
};

const distanceTo = (userLat: number, userLng: number, place: any): number =>
  haversine(userLat, userLng, parseFloat(place.mapy), parseFloat(place.mapx));

export interface RecommendedPlace {
  id: string;
  name: string;
  category: string;
  distance: string;
  walkTime: string;
  description: string;
  mapx: string;
  mapy: string;
  image: string;
  score: number;
}

/**
 * 취향 맞춤 추천 (현재 앱에서 사용 중)
 * 점수 = 취향 유사도 × 0.7 + 가까운 정도 × 0.3  →  상위 5개
 */
export const getPreferenceBasedRecommendations = async (
  places: any[],
  userLat: number,
  userLng: number,
  remainMinutes: number
): Promise<RecommendedPlace[]> => {
  let preferences: string[] = [];
  try {
    const saved = await AsyncStorage.getItem('user_preferences');
    if (saved) preferences = JSON.parse(saved);
  } catch {
    preferences = [];
  }

  const preferredCategories = preferences.flatMap((pref) => PREFERENCE_CATEGORY_MAP[pref] || []);
  const userVector = toVector([...new Set(preferredCategories)]);
  const maxDistanceM = getMaxDistance(remainMinutes);

  return places
    .filter((place) => {
      if (!place.mapx || !place.mapy) return false;
      return distanceTo(userLat, userLng, place) <= maxDistanceM;
    })
    .map((place) => {
      const dist = distanceTo(userLat, userLng, place);
      const placeVector = toVector([place.category]);
      const similarityScore = cosineSimilarity(userVector, placeVector);
      const distanceScore = 1 - dist / maxDistanceM;
      const finalScore = similarityScore * 0.7 + distanceScore * 0.3;
      return {
        ...place,
        distance: formatDistance(dist),
        walkTime: formatWalkTime(dist),
        score: finalScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

/**
 * Gemini AI 추천 (코드는 있지만 MapScreen에서 임시 비활성화 상태)
 * 가까운 장소 목록을 Gemini에게 보내고 TOP 3 번호를 받아옴. 실패하면 취향 추천으로 대체.
 */
export const getAIRecommendations = async (
  places: any[],
  userLat: number,
  userLng: number,
  remainMinutes: number,
  preferences: string[]
): Promise<RecommendedPlace[]> => {
  try {
    const maxDistanceM = getMaxDistance(remainMinutes);

    const nearby = places
      .filter((place) => {
        if (!place.mapx || !place.mapy) return false;
        return distanceTo(userLat, userLng, place) <= maxDistanceM;
      })
      .slice(0, 20);

    if (nearby.length === 0) return getPreferenceBasedRecommendations(places, userLat, userLng, remainMinutes);

    const prefLabels = preferences.map((p) => ({
      history: '역사/문화',
      food: '미식',
      shopping: '쇼핑',
      nature: '자연/산책',
      festival: '축제/행사',
      art: '예술',
    }[p] || p));

    const placeList = nearby.map((p, i) =>
      `${i + 1}. ${p.name} (${p.category}) - ${p.distance || '근처'}`
    ).join('\n');

    const prompt = `You are a travel assistant for foreign tourists in Seoul.
User preferences: ${prefLabels.join(', ')}
Available time: ${remainMinutes} minutes (can walk ${Math.round(maxDistanceM)}m one way)
Nearby places:
${placeList}
Pick the TOP 3 best places for this user based on their preferences and available time.
Respond ONLY with a JSON array of place numbers like: [2, 5, 1]
No explanation, just the JSON array.`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_KEY}`,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 50, temperature: 0.3 },
      }),
    });

    const data = await response.json();

    // 429 한도 초과 감지 → MapScreen으로 전달
    if (data?.error?.code === 429) {
      console.log('Gemini 한도 초과');
      throw { code: 429, message: 'quota exceeded' };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const indices: number[] = JSON.parse(clean);

    return indices
      .map((i) => nearby[i - 1])
      .filter(Boolean)
      .map((place) => {
        const dist = distanceTo(userLat, userLng, place);
        return {
          ...place,
          distance: formatDistance(dist),
          walkTime: formatWalkTime(dist),
          score: 1,
        };
      });
  } catch (error: any) {
    if (error?.code === 429) {
      throw error; // MapScreen으로 전달해서 aiUnavailable 표시
    }
    console.log('Gemini 추천 오류:', error);
    return getPreferenceBasedRecommendations(places, userLat, userLng, remainMinutes);
  }
};
