import { kakaoGet } from './api';

export interface LaundryShop {
  id: number;
  name: string;
  lat: number;
  lng: number;
  washer: number;
  dryer: number;
  distance: string;
  address: string;
}

export const fetchNearbyLaundry = async (
  lat: number,
  lng: number
): Promise<LaundryShop[]> => {
  try {
    const keywords = ['코인세탁', '빨래방', 'laundry', '세탁방'];

    const results = await Promise.all(
      keywords.map((keyword) =>
        kakaoGet(
          '/v2/local/search/keyword.json',
          `query=${encodeURIComponent(keyword)}&x=${lng}&y=${lat}&radius=3000&sort=distance`
        )
      )
    );

    // 중복 제거
    const seen = new Set<string>();
    const shops: LaundryShop[] = [];

    results.forEach((data) => {
      const items = data?.documents || [];
      items.forEach((item: any, idx: number) => {
        if (seen.has(item.id)) return;
        seen.add(item.id);
        shops.push({
          id: parseInt(item.id) || idx,
          name: item.place_name,
          lat: parseFloat(item.y),
          lng: parseFloat(item.x),
          washer: Math.floor(Math.random() * 4) + 1, // 실제 IoT 없으므로 모의 데이터
          dryer: Math.floor(Math.random() * 3) + 1,
          distance: item.distance ? `${item.distance}m` : '',
          address: item.road_address_name || item.address_name,
        });
      });
    });

    // 거리순 정렬
    return shops.slice(0, 10);
  } catch (error) {
    console.log('세탁방 검색 오류:', error);
    // 기본 2곳 fallback
    return [
      { id: 1, name: '에코런드렛', lat: 37.5681, lng: 126.9944, washer: 3, dryer: 2, distance: '도보 10분', address: '서울 중구 을지로15길 32' },
      { id: 2, name: '더런드리', lat: 37.5650, lng: 127.0021, washer: 2, dryer: 3, distance: '도보 9분', address: '서울 중구 동호로 343' },
    ];
  }
};