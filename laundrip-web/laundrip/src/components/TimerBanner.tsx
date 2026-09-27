import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../LanguageContext';

interface TimerBannerProps {
  minutes: number;
  seconds: number;
  shopName?: string;
  onCancel?: () => void;
}

export default function TimerBanner({ minutes, seconds, shopName, onCancel }: TimerBannerProps) {
  const { T } = useLanguage();

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>🧺</Text>
      <View style={styles.textContainer}>
        {shopName && <Text style={styles.shopName}>{shopName}</Text>}
        <Text style={styles.text}>
          {T.timerBanner}{' '}
          <Text style={styles.time}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
        </Text>
      </View>
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#4FC3F7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: { fontSize: 18 },
  textContainer: { flex: 1 },
  shopName: {
    color: '#1a1a2e',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
  text: { color: '#1a1a2e', fontWeight: '600', fontSize: 14 },
  time: { fontWeight: 'bold', fontSize: 16 },
  cancelButton: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelText: {
    color: '#1a1a2e',
    fontSize: 14,
    fontWeight: 'bold',
  },
});