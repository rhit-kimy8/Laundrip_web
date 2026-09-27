import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CultureCard from '../components/CultureCard';
import KakaoMap from '../components/KakaoMap';
import LaundryPopup from '../components/LaundryPopup';
import { fetchNearbyLaundry, LaundryShop } from '../services/LaundryService';
import { getMarketsNearby } from '../services/MarketService';
import PlaceDetailModal from '../components/PlaceDetailModal';
import { getPreferenceBasedRecommendations, RecommendedPlace } from '../services/RecommendationEngine';
import TimePickerModal from '../components/TimePickerModal';
import TimerBanner from '../components/TimerBanner';
import { kakaoGet } from '../services/api';
import { DEFAULT_LOCATION, getUserLocation } from '../services/geo';
import { fetchCultureFacilities, fetchFestivals, fetchNearbyPlaces, TourPlace } from '../services/TourAPI';
import { LANG_SHORT, Language, useLanguage } from '../LanguageContext';

export default function MapScreen() {
  const { language, setLanguage, T } = useLanguage();

  const [shops, setShops] = useState<LaundryShop[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [activeShopId, setActiveShopId] = useState<number | undefined>(undefined);
  const [activeShopName, setActiveShopName] = useState<string>('');
  const [showPopup, setShowPopup] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCulture, setShowCulture] = useState(false);
  const [cultureExpanded, setCultureExpanded] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [remainSeconds, setRemainSeconds] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
  const [tourPlaces, setTourPlaces] = useState<TourPlace[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<TourPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showPlaceDetail, setShowPlaceDetail] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<RecommendedPlace[]>([]);
  const [preferenceRecommendations, setPreferenceRecommendations] = useState<RecommendedPlace[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('전체');
  const [mapFullscreen, setMapFullscreen] = useState(false);

  const FILTERS = [
    T.filterAll, T.filterLaundry, T.filterTourist,
    T.filterFood, T.filterCulture, T.filterMarket, T.filterFestival
  ];

  const handleCancelWash = async () => {
    setTimerRunning(false);
    setShowCulture(false);
    setActiveShopId(undefined);
    setActiveShopName('');
    setRemainSeconds(0);
    setPreferenceRecommendations([]);
    setAiRecommendations([]);
    await AsyncStorage.removeItem('timer_end_time');
    await AsyncStorage.removeItem('timer_shop_name');
  };

  useEffect(() => {
    if (!timerRunning) return;
    if (remainSeconds <= 0) {
      setTimerRunning(false);
      setShowCulture(false);
      setActiveShopId(undefined);
      alert(T.washDone);
      return;
    }
    const interval = setInterval(() => {
      setRemainSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, remainSeconds]);

  useEffect(() => {
    if (!timerRunning) return;
    const checkCancel = setInterval(async () => {
      const saved = await AsyncStorage.getItem('timer_end_time');
      if (!saved) {
        setTimerRunning(false);
        setShowCulture(false);
        setActiveShopId(undefined);
        setActiveShopName('');
        setRemainSeconds(0);
        setPreferenceRecommendations([]);
        setAiRecommendations([]);
      }
    }, 2000);
    return () => clearInterval(checkCancel);
  }, [timerRunning]);

  useEffect(() => {
    (async () => {
      const { latitude: lat, longitude: lng } = await getUserLocation();
      setCurrentLocation({ latitude: lat, longitude: lng });

      try {
        const nearbyShops = await fetchNearbyLaundry(lat, lng);
        setShops(nearbyShops);

        const [attractions, restaurants, culture, facilities, markets, festivals] = await Promise.all([
          fetchNearbyPlaces(lat, lng, 2000, '12'),
          fetchNearbyPlaces(lat, lng, 2000, '39'),
          fetchNearbyPlaces(lat, lng, 2000, '14'),
          fetchCultureFacilities(lat, lng, 2000),
          getMarketsNearby(lat, lng, 2000),
          fetchFestivals(lat, lng),
        ]);
        const all = [...attractions, ...restaurants, ...culture, ...facilities, ...markets, ...festivals];
        setTourPlaces(all);
        setFilteredPlaces(all);
      } catch (error) {
        console.log('주변 데이터 로드 실패:', error);
      }
    })();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredPlaces(tourPlaces);
      setActiveFilter(T.filterAll);
      return;
    }
    try {
      const data = await kakaoGet(
        '/v2/local/search/keyword.json',
        `query=${encodeURIComponent(searchQuery)}&x=126.9983&y=37.5665&radius=3000&sort=distance`
      );
      const results = (data?.documents || []).map((item: any) => ({
        id: item.id,
        name: item.place_name,
        category: item.category_group_name || '기타',
        distance: item.distance ? `${item.distance}m` : '',
        walkTime: item.distance ? `도보 ${Math.round(parseInt(item.distance) / 67)}분` : '',
        description: item.road_address_name || item.address_name,
        mapx: item.x,
        mapy: item.y,
        image: '',
      }));
      setFilteredPlaces(results);
      setActiveFilter('검색결과');
    } catch (error) {
      console.log('검색 오류:', error);
    }
  };

  const handleFilter = (filter: string) => {
    setActiveFilter(filter);
    setSearchQuery('');
    if (filter === T.filterAll) {
      setFilteredPlaces(tourPlaces);
    } else if (filter === T.filterLaundry) {
      setFilteredPlaces([]);
    } else {
      const categoryMap: Record<string, string> = {
        [T.filterTourist]: '관광지',
        [T.filterFood]: '음식점',
        [T.filterCulture]: '문화시설',
        [T.filterMarket]: '전통시장',
        [T.filterFestival]: '축제/행사',
      };
      setFilteredPlaces(tourPlaces.filter((p) => p.category === (categoryMap[filter] || filter)));
    }
  };

  const handleShopSelect = (shop: any) => {
    const latestShop = shops.find((s) => s.id === shop.id);
    setSelectedShop(latestShop || shop);
    setShowPopup(true);
  };

  const handleStartWash = () => {
    setShowPopup(false);
    setShowTimePicker(true);
  };

  const handleTimeConfirm = async (minutes: number, type: string) => {
    const shopName = selectedShop?.name || '';
    const shopId = selectedShop?.id;
    setActiveShopName(shopName);
    setActiveShopId(shopId);
    await AsyncStorage.setItem('timer_shop_name', shopName);

    let updatedShop: any = null;
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.id === shopId) {
          const updated = {
            ...shop,
            washer: type === '세탁기' ? Math.max(0, shop.washer - 1) : shop.washer,
            dryer: type === '건조기' ? Math.max(0, shop.dryer - 1) : shop.dryer,
          };
          updatedShop = updated;
          return updated;
        }
        return shop;
      })
    );
    if (updatedShop) setSelectedShop(updatedShop);
    setRemainSeconds(minutes * 60);
    setTimerRunning(true);
    setShowTimePicker(false);
    setShowCulture(true);
    setCultureExpanded(true);

    const endTime = Date.now() + minutes * 60 * 1000;
    await AsyncStorage.setItem('timer_end_time', String(endTime));

    setAiLoading(true);
    setAiUnavailable(false);
    try {
      const userLat = currentLocation?.latitude ?? DEFAULT_LOCATION.latitude;
      const userLng = currentLocation?.longitude ?? DEFAULT_LOCATION.longitude;
      const prefRecs = await getPreferenceBasedRecommendations(tourPlaces, userLat, userLng, minutes);
      setPreferenceRecommendations(prefRecs);
      // TODO: Gemini AI 추천 임시 비활성화 (안정화 후 재활성화)
      // const saved = await AsyncStorage.getItem('user_preferences');
      // const preferences = saved ? JSON.parse(saved) : [];
      // const aiRecs = await getAIRecommendations(tourPlaces, userLat, userLng, minutes, preferences);
      // setAiRecommendations(aiRecs);
      setAiRecommendations(prefRecs);
    } catch (error: any) {
      console.log('추천 오류:', error);
      setAiUnavailable(true);
    } finally {
      setAiLoading(false);
    }
  };

  const minutes = Math.floor(remainSeconds / 60);
  const seconds = remainSeconds % 60;

  const displayFilters = activeFilter === '검색결과'
    ? [`🔍 ${searchQuery}`, ...FILTERS]
    : FILTERS;

  const showShops = activeFilter === T.filterAll || activeFilter === T.filterLaundry || activeFilter === '검색결과';

  return (
    <SafeAreaView style={styles.container}>
      {timerRunning && (
        <TimerBanner
          minutes={minutes}
          seconds={seconds}
          shopName={activeShopName}
          onCancel={handleCancelWash}
        />
      )}

      {!mapFullscreen && (
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>{T.header}</Text>
          </View>
          <View style={styles.langSwitcher}>
            {(['한국어', 'English', '日本語', '中文'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, language === lang && styles.langChipActive]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={[styles.langChipText, language === lang && styles.langChipTextActive]}>
                  {LANG_SHORT[lang]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {!mapFullscreen && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder={T.search}
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Text style={styles.searchIcon}>⌕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {displayFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  (activeFilter === filter || (filter.startsWith('🔍') && activeFilter === '검색결과')) && styles.filterButtonActive,
                ]}
                onPress={() => {
                  if (filter.startsWith('🔍')) {
                    setActiveFilter('검색결과');
                  } else {
                    handleFilter(filter);
                  }
                }}
              >
                <Text style={[
                  styles.filterText,
                  (activeFilter === filter || (filter.startsWith('🔍') && activeFilter === '검색결과')) && styles.filterTextActive,
                ]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.mapContainer, mapFullscreen && styles.mapContainerFullscreen]}>
        <KakaoMap
          key={JSON.stringify(shops) + activeFilter + searchQuery + activeShopId}
          onShopSelect={handleShopSelect}
          onPlaceSelect={(place) => {
            setSelectedPlace(place);
            setShowPlaceDetail(true);
          }}
          onToggleFullscreen={() => setMapFullscreen((prev) => !prev)}
          currentLocation={currentLocation}
          shops={shops}
          tourPlaces={filteredPlaces}
          showShops={showShops}
          activeShopId={activeShopId}
        />
      </View>

      {!mapFullscreen && showCulture && (
        <View style={styles.cultureSection}>
          <TouchableOpacity
            style={styles.cultureSectionHeader}
            onPress={() => setCultureExpanded(!cultureExpanded)}
          >
            <Text style={styles.cultureTitle}>
              {cultureExpanded ? '🔽' : '🔼'} {T.aiTitle}
            </Text>
            <Text style={styles.cultureToggle}>
              {cultureExpanded ? T.close : T.open}
            </Text>
          </TouchableOpacity>

          {cultureExpanded && (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.cultureScroll}>
              <Text style={styles.cultureSectionTitle}>{T.aiTitle}</Text>
              {preferenceRecommendations.length > 0 ? (
                preferenceRecommendations.map((place) => (
                  <CultureCard
                    key={place.id}
                    place={place}
                    onPress={() => {
                      setSelectedPlace(place);
                      setShowPlaceDetail(true);
                    }}
                  />
                ))
              ) : (
                <Text style={styles.emptyText}>{T.noResult}</Text>
              )}

              <Text style={[styles.cultureSectionTitle, { marginTop: 12 }]}>{T.aiSubTitle}</Text>
              {aiLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <ActivityIndicator color="#4FC3F7" />
                  <Text style={styles.emptyText}>{T.aiLoading}</Text>
                </View>
              ) : aiRecommendations.length > 0 ? (
                aiRecommendations.map((place) => (
                  <CultureCard
                    key={place.id}
                    place={place}
                    onPress={() => {
                      setSelectedPlace(place);
                      setShowPlaceDetail(true);
                    }}
                  />
                ))
              ) : (
                <View style={styles.aiUnavailableBox}>
                  <Text style={styles.aiUnavailableIcon}>🤖</Text>
                  <Text style={styles.aiUnavailableText}>
                    {aiUnavailable
                      ? 'AI 추천이 일시적으로\n이용 불가합니다 ✨'
                      : T.aiEmpty}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      <LaundryPopup
        shop={selectedShop}
        visible={showPopup}
        onClose={() => setShowPopup(false)}
        onStartWash={handleStartWash}
      />
      <TimePickerModal
        visible={showTimePicker}
        onConfirm={handleTimeConfirm}
        onClose={() => setShowTimePicker(false)}
      />
      <PlaceDetailModal
        place={selectedPlace}
        visible={showPlaceDetail}
        onClose={() => setShowPlaceDetail(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 24, height: 24, borderRadius: 6 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  langSwitcher: { flexDirection: 'row', gap: 4 },
  langChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#444',
  },
  langChipActive: { backgroundColor: '#4FC3F7', borderColor: '#4FC3F7' },
  langChipText: { color: '#888', fontSize: 10, fontWeight: '600' },
  langChipTextActive: { color: '#1a1a2e' },
  searchContainer: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  searchButton: { padding: 4 },
  searchIcon: { fontSize: 18, color: '#fff' },
  filterScroll: { maxHeight: 40 },
  filterContainer: { gap: 8, alignItems: 'center' },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#444',
  },
  filterButtonActive: { backgroundColor: '#4FC3F7', borderColor: '#4FC3F7' },
  filterText: { color: '#888', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#1a1a2e' },
  mapContainer: { flex: 1, margin: 16, borderRadius: 16, overflow: 'hidden' },
  mapContainerFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    borderRadius: 0,
    zIndex: 100,
  },
  cultureSection: {
    backgroundColor: '#1e1e2e',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    maxHeight: 320,
  },
  cultureSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  cultureTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cultureToggle: { color: '#4FC3F7', fontSize: 12 },
  cultureSectionTitle: { color: '#aaa', fontWeight: 'bold', fontSize: 13, marginBottom: 10 },
  cultureScroll: { maxHeight: 260 },
  emptyText: { color: '#888', textAlign: 'center', paddingVertical: 8, fontSize: 12 },
  aiUnavailableBox: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    marginBottom: 8,
  },
  aiUnavailableIcon: { fontSize: 32, marginBottom: 8 },
  aiUnavailableText: { color: '#aaa', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});