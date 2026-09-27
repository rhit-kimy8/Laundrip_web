import { dataGoKrGet, kakaoGet } from './api';
import { formatDistance, formatWalkTime, haversine } from './geo';

// Korea Tourism Organization TourAPI + regional culture facility API (both on data.go.kr)
const TOUR_PATH = '/B551011/KorService2';
const CULTURE_PATH = '/B553457/rgnCltrFcltExmnv1';
const TOUR_COMMON = 'MobileOS=ETC&MobileApp=LaundriP&_type=json';

export interface TourPlace {
  id: string;
  name: string;
  category: string;
  distance: string;
  walkTime: string;
  description: string;
  mapx: string; // longitude
  mapy: string; // latitude
  image: string;
}

const getCategoryName = (contentTypeId: string): string => {
  const map: { [key: string]: string } = {
    '12': '관광지',
    '14': '문화시설',
    '15': '축제/행사',
    '32': '숙박',
    '38': '쇼핑',
    '39': '음식점',
  };
  return map[contentTypeId] || '기타';
};

// 주소 → 좌표 변환 (Kakao)
const getCoordFromAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const data = await kakaoGet('/v2/local/search/address.json', `query=${encodeURIComponent(address)}`);
    const doc = data?.documents?.[0];
    if (!doc) return null;
    return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
  } catch {
    return null;
  }
};

// TourAPI 위치 기반 관광정보 (contentTypeId: 12 관광지, 14 문화시설, 39 음식점 ...)
export const fetchNearbyPlaces = async (
  lat: number,
  lng: number,
  radius: number = 1000,
  contentTypeId?: string
): Promise<TourPlace[]> => {
  try {
    let query = `numOfRows=10&pageNo=1&${TOUR_COMMON}&mapX=${lng}&mapY=${lat}&radius=${radius}&arrange=E`;
    if (contentTypeId) query += `&contentTypeId=${contentTypeId}`;

    const text = await dataGoKrGet(`${TOUR_PATH}/locationBasedList2`, query);
    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item || [];

    return items.map((item: any) => ({
      id: item.contentid,
      name: item.title,
      category: getCategoryName(item.contenttypeid),
      distance: formatDistance(Math.round(item.dist)),
      walkTime: formatWalkTime(Math.round(item.dist)),
      description: item.addr1 || '상세 정보 없음',
      mapx: item.mapx,
      mapy: item.mapy,
      image: (item.firstimage || '').replace('http://', 'https://'),
    }));
  } catch (error) {
    console.log('TourAPI 오류:', error);
    return [];
  }
};

// TourAPI 축제 정보 (오늘 이후 시작하는 축제)
export const fetchFestivals = async (
  lat: number,
  lng: number
): Promise<TourPlace[]> => {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const query = `numOfRows=10&pageNo=1&${TOUR_COMMON}&eventStartDate=${today}&arrange=E`;

    const text = await dataGoKrGet(`${TOUR_PATH}/searchFestival2`, query);
    if (!text.startsWith('{')) return [];
    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item || [];

    return items.map((item: any) => ({
      id: item.contentid,
      name: item.title,
      category: '축제/행사',
      distance: '',
      walkTime: '',
      description: item.addr1 || '상세 정보 없음',
      mapx: item.mapx,
      mapy: item.mapy,
      image: (item.firstimage || '').replace('http://', 'https://'),
    }));
  } catch (error) {
    console.log('축제 API 오류:', error);
    return [];
  }
};

// 문화기반시설 (박물관/미술관) - 주소→좌표 변환 방식
export const fetchCultureFacilities = async (
  lat: number,
  lng: number,
  radiusM: number = 2000
): Promise<TourPlace[]> => {
  try {
    const query = `pageNo=1&numOfRows=30&resultType=json&pblshYr=2023`;
    const [museumText, galleryText] = await Promise.all([
      dataGoKrGet(`${CULTURE_PATH}/clifMsmv1`, query),
      dataGoKrGet(`${CULTURE_PATH}/clifArglv1`, query),
    ]);

    const parseAndFilter = async (
      text: string,
      categoryLabel: string,
      nameField: string
    ): Promise<TourPlace[]> => {
      if (!text.startsWith('{')) return [];
      const data = JSON.parse(text);

      // body.data가 배열
      const raw = data?.response?.body?.data;
      if (!raw) return [];
      const items = Array.isArray(raw) ? raw : [raw];

      const results: TourPlace[] = [];
      for (const item of items) {
        const address = item.instAddr;
        if (!address) continue;
        const coord = await getCoordFromAddress(address);
        if (!coord) continue;
        const distM = haversine(lat, lng, coord.lat, coord.lng);
        if (distM > radiusM) continue;

        results.push({
          id: `cf_${item[nameField] || address}`,
          name: item[nameField] || '문화시설',
          category: '문화시설',
          distance: formatDistance(distM),
          walkTime: formatWalkTime(distM),
          description: `${categoryLabel} | ${address}`,
          mapx: String(coord.lng),
          mapy: String(coord.lat),
          image: '',
        });
      }

      return results.sort((a, b) =>
        haversine(lat, lng, parseFloat(a.mapy), parseFloat(a.mapx)) -
        haversine(lat, lng, parseFloat(b.mapy), parseFloat(b.mapx))
      );
    };

    const [museums, galleries] = await Promise.all([
      parseAndFilter(museumText, '박물관', 'msmNm'),
      parseAndFilter(galleryText, '미술관', 'arglNm'),
    ]);
    return [...museums, ...galleries];
  } catch (error) {
    console.log('문화기반시설 오류:', error);
    return [];
  }
};

// 장소 상세 정보 (사진, 소개글)
export const fetchPlaceDetail = async (contentId: string): Promise<any> => {
  try {
    const query = `${TOUR_COMMON}&contentId=${contentId}&defaultYN=Y&firstImageYN=Y&addrinfoYN=Y&overviewYN=Y`;
    const text = await dataGoKrGet(`${TOUR_PATH}/detailCommon2`, query);
    const data = JSON.parse(text);
    const item = data?.response?.body?.items?.item?.[0];
    return item || null;
  } catch (error) {
    console.log('상세정보 오류:', error);
    return null;
  }
};
