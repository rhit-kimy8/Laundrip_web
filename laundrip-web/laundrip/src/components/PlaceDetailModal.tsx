import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchPlaceDetail } from '../services/TourAPI';

interface PlaceDetailModalProps {
  place: {
    id: string;
    name: string;
    category: string;
    distance: string;
    walkTime: string;
    description: string;
    mapx: string;
    mapy: string;
    image: string;
  } | null;
  visible: boolean;
  onClose: () => void;
}

export default function PlaceDetailModal({ place, visible, onClose }: PlaceDetailModalProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  if (!place || !visible) return;
  setDetail(null);

  // TourAPI contentId는 숫자로만 이루어진 문자열
  const isTourAPIPlace = /^\d+$/.test(place.id);
  if (!isTourAPIPlace) return;

  const load = async () => {
    setLoading(true);
    const data = await fetchPlaceDetail(place.id);
    setDetail(data);
    setLoading(false);
  };
  load();
}, [place, visible]);

  if (!place) return null;

  const openKakaoMap = () => {
    const url = `kakaomap://look?p=${place.mapy},${place.mapx}`;
    const fallback = `https://map.kakao.com/link/map/${place.name},${place.mapy},${place.mapx}`;
    // 웹 브라우저에는 카카오맵 앱이 없으니 바로 웹 지도로 연결
    if (Platform.OS === 'web') {
      Linking.openURL(fallback);
      return;
    }
    Linking.openURL(url).catch(() => Linking.openURL(fallback));
  };

  const imageUrl = detail?.firstimage || place.image || null;
  const overview = detail?.overview || place.description || '';

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.category}>{place.category}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 이미지 */}
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {place.category === '관광지' ? '🗺️' :
                   place.category === '음식점' ? '🍜' :
                   place.category === '문화시설' ? '🏛️' :
                   place.category === '전통시장' ? '🏪' : '📍'}
                </Text>
              </View>
            )}

            {/* 장소 정보 */}
            <View style={styles.content}>
              <Text style={styles.name}>{place.name}</Text>

              <View style={styles.infoRow}>
                {place.distance ? (
                  <Text style={styles.infoTag}>📍 {place.distance}</Text>
                ) : null}
                {place.walkTime ? (
                  <Text style={styles.infoTag}>🚶 {place.walkTime}</Text>
                ) : null}
              </View>

              {detail?.addr1 ? (
                <Text style={styles.address}>🏠 {detail.addr1}</Text>
              ) : null}

              {detail?.tel ? (
                <Text style={styles.tel}>📞 {detail.tel}</Text>
              ) : null}

              {loading ? (
                <ActivityIndicator color="#4FC3F7" style={{ marginTop: 16 }} />
              ) : overview ? (
                <Text style={styles.overview} numberOfLines={8}>{overview}</Text>
              ) : null}
            </View>
          </ScrollView>

          {/* 카카오맵 길찾기 버튼 */}
          {place.mapx && place.mapy && (
            <TouchableOpacity style={styles.mapButton} onPress={openKakaoMap}>
              <Text style={styles.mapButtonText}>🗺️ 카카오맵으로 길찾기</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  popup: {
    backgroundColor: '#1e1e2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  category: {
    color: '#4FC3F7',
    fontWeight: 'bold',
    fontSize: 13,
  },
  closeX: {
    color: '#888',
    fontSize: 18,
  },
  image: {
    width: '100%',
    height: 200,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  infoTag: {
    color: '#4FC3F7',
    fontSize: 13,
  },
  address: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 6,
  },
  tel: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 12,
  },
  overview: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  mapButton: {
    backgroundColor: '#4FC3F7',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 16,
  },
});