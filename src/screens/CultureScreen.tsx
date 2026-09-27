import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CultureCard from '../components/CultureCard';
import { getUserLocation } from '../services/geo';
import { getMarketsNearby, Market } from '../services/MarketService';
import PlaceDetailModal from '../components/PlaceDetailModal';
import { fetchCultureFacilities, fetchFestivals, fetchNearbyPlaces, TourPlace } from '../services/TourAPI';
import { useLanguage } from '../LanguageContext';

export default function CultureScreen() {
  const { T } = useLanguage();
  const [attractions, setAttractions] = useState<TourPlace[]>([]);
  const [restaurants, setRestaurants] = useState<TourPlace[]>([]);
  const [culture, setCulture] = useState<TourPlace[]>([]);
  const [festivals, setFestivals] = useState<TourPlace[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);

  useEffect(() => {
    setActiveFilter(T.filterAll);
  }, [T.filterAll]);

  useEffect(() => {
    getUserLocation().then(setUserLocation);
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    const loadData = async () => {
      const lat = userLocation.latitude;
      const lng = userLocation.longitude;
      setLoading(true);
      try {
        // 빠른 데이터 먼저 로드
        const [attractionData, restaurantData, cultureData, festivalData, marketData] = await Promise.all([
          fetchNearbyPlaces(lat, lng, 2000, '12'),
          fetchNearbyPlaces(lat, lng, 2000, '39'),
          fetchNearbyPlaces(lat, lng, 2000, '14'),
          fetchFestivals(lat, lng),
          getMarketsNearby(lat, lng, 2000),
        ]);
        setAttractions(attractionData);
        setRestaurants(restaurantData);
        setCulture(cultureData);
        setFestivals(festivalData);
        setMarkets(marketData);
        setLoading(false); // 먼저 화면 보여주기

        // 박물관/미술관 나중에 추가
        const cultureFacilityData = await fetchCultureFacilities(lat, lng, 2000);
        setCulture((prev) => [...prev, ...cultureFacilityData]);
      } catch (error) {
        console.log('데이터 로드 오류:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [userLocation]);

  const FILTERS = [
    T.filterAll, T.filterTourist, T.filterFood,
    T.filterCulture, T.filterMarket, T.filterFestival
  ];

  const renderSection = (title: string, data: (TourPlace | Market)[]) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map((place) => (
          <CultureCard
            key={place.id}
            place={place}
            onPress={() => {
              setSelectedPlace(place);
              setShowDetail(true);
            }}
          />
        ))}
      </View>
    );
  };

  const showAttractions = activeFilter === T.filterAll || activeFilter === T.filterTourist;
  const showRestaurants = activeFilter === T.filterAll || activeFilter === T.filterFood;
  const showCultureSection = activeFilter === T.filterAll || activeFilter === T.filterCulture;
  const showMarkets = activeFilter === T.filterAll || activeFilter === T.filterMarket;
  const showFestivals = activeFilter === T.filterAll || activeFilter === T.filterFestival;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{T.cultureTitle}</Text>
        <Text style={styles.subtitle}>{T.cultureSubtitle}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.filterButtonActive,
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter && styles.filterTextActive,
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4FC3F7" />
          <Text style={styles.loadingText}>{T.noResult}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {showAttractions && renderSection('🗺️ ' + T.filterTourist, attractions)}
          {showRestaurants && renderSection('🍜 ' + T.filterFood, restaurants)}
          {showCultureSection && renderSection('🏛️ ' + T.filterCulture, culture)}
          {showMarkets && renderSection('🏪 ' + T.filterMarket, markets)}
          {showFestivals && renderSection('🎉 ' + T.filterFestival, festivals)}
        </ScrollView>
      )}

      <PlaceDetailModal
        place={selectedPlace}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 14 },
  filterScroll: { maxHeight: 60, minHeight: 60 },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#444',
  },
  filterButtonActive: { backgroundColor: '#4FC3F7', borderColor: '#4FC3F7' },
  filterText: { color: '#888', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#1a1a2e' },
  scroll: { paddingHorizontal: 16, marginTop: 8 },
  section: { marginBottom: 8 },
  sectionTitle: { color: '#4FC3F7', fontWeight: 'bold', fontSize: 16, marginBottom: 12, marginTop: 8 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#888', fontSize: 14 },
});