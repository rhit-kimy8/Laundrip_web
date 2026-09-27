import { formatDistance, formatWalkTime, haversine } from './geo';

// 전통시장 데이터는 API가 아니라 앱에 포함된 JSON 파일 (src/data/markets.json)
const marketsData = require('../data/markets.json');

export interface Market {
  id: string;
  name: string;
  category: '전통시장';
  lat: number;
  lng: number;
  address: string;
  items: string;
  distance: string;
  walkTime: string;
  description: string;
  mapx: string;
  mapy: string;
  image: string;
}

const ALL_MARKETS: Market[] = marketsData as Market[];

// 거리 기반 필터링: radiusM 안에 있는 시장만, 가까운 순서로
export const getMarketsNearby = async (
  lat: number,
  lng: number,
  radiusM: number = 2000
): Promise<Market[]> => {
  return ALL_MARKETS
    .map((market) => {
      const dist = haversine(lat, lng, market.lat, market.lng);
      return {
        ...market,
        distance: formatDistance(dist),
        walkTime: formatWalkTime(dist),
        _dist: dist,
      };
    })
    .filter((m) => m._dist <= radiusM)
    .sort((a, b) => a._dist - b._dist)
    .map(({ _dist, ...m }) => m);
};
