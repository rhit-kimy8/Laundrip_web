import * as Location from 'expo-location';
import { Platform } from 'react-native';

// Seoul City Hall — used when location is unavailable.
export const DEFAULT_LOCATION = { latitude: 37.5665, longitude: 126.9983 };

// Average walking speed: 67 meters per minute (about 4 km/h).
export const WALK_METERS_PER_MIN = 67;

/** Haversine formula: straight-line distance in meters between two lat/lng points on Earth. */
export const haversine = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** 850 → "850m", 1234 → "1.2km" */
export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`;

/** 670 → "도보 10분" */
export const formatWalkTime = (meters: number): string =>
  `도보 ${Math.round(meters / WALK_METERS_PER_MIN)}분`;

const isInKorea = (lat: number, lng: number) => lat > 33 && lat < 39 && lng > 124 && lng < 132;

/**
 * Current GPS position, or Seoul if permission is denied or it fails.
 * Web only: the data (TourAPI, Kakao) only covers Korea, so a browser outside Korea
 * (e.g. a demo in the US) also falls back to Seoul.
 */
export const getUserLocation = async (): Promise<{ latitude: number; longitude: number }> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return DEFAULT_LOCATION;
    const { coords } = await Location.getCurrentPositionAsync({});
    if (Platform.OS === 'web' && !isInKorea(coords.latitude, coords.longitude)) return DEFAULT_LOCATION;
    return { latitude: coords.latitude, longitude: coords.longitude };
  } catch (error) {
    console.log('위치 가져오기 실패:', error);
    return DEFAULT_LOCATION;
  }
};
