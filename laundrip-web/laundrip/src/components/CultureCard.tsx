import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CulturePlace {
  id: string | number;
  name: string;
  category: string;
  distance: string;
  walkTime: string;
  description: string;
}

interface CultureCardProps {
  place: CulturePlace;
  onPress: () => void;
}

export default function CultureCard({ place, onPress }: CultureCardProps) {
  const categoryIcon: { [key: string]: string } = {
  '전통시장': '🏪',
  '관광지': '🗺️', 
  '음식점': '🍜',
  '문화시설': '🏛️',
  '축제/행사': '🎉',
  '숙박': '🏨',
  '쇼핑': '🛍️',
  '기타': '📍',
};

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.icon}>{categoryIcon[place.category] || '📍'}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.category}>{place.category}</Text>
        <Text style={styles.description} numberOfLines={2}>{place.description}</Text>
        <View style={styles.row}>
          <Text style={styles.distance}>📍 {place.distance}</Text>
          <Text style={styles.walkTime}>🚶 {place.walkTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    fontSize: 36,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  category: {
    color: '#4FC3F7',
    fontSize: 12,
    marginBottom: 6,
  },
  description: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  distance: {
    color: '#888',
    fontSize: 12,
  },
  walkTime: {
    color: '#888',
    fontSize: 12,
  },
});