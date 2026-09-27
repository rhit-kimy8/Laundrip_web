import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../LanguageContext';

interface LaundryShop {
  id: number;
  name: string;
  washer: number;
  dryer: number;
  distance: string;
}

interface LaundryPopupProps {
  shop: LaundryShop | null;
  visible: boolean;
  onClose: () => void;
  onStartWash: () => void;
}

export default function LaundryPopup({ shop, visible, onClose, onStartWash }: LaundryPopupProps) {
  const { T } = useLanguage();
  if (!shop) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <Text style={styles.name}>{shop.name}</Text>
          <Text style={styles.distance}>📍 {shop.distance}</Text>

          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>👕</Text>
              <Text style={styles.cardLabel}>{T.washer}</Text>
              <Text style={styles.cardCount}>{shop.washer}{T.washer === '세탁기' ? '대 가능' : ' available'}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>💨</Text>
              <Text style={styles.cardLabel}>{T.dryer}</Text>
              <Text style={styles.cardCount}>{shop.dryer}{T.washer === '세탁기' ? '대 가능' : ' available'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.startButton,
              (shop.washer === 0 && shop.dryer === 0) && styles.disabledButton
            ]}
            onPress={(shop.washer === 0 && shop.dryer === 0) ? undefined : onStartWash}
          >
            <Text style={styles.startButtonText}>
              {(shop.washer === 0 && shop.dryer === 0) ? T.noMachine : T.startWash}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{T.close}</Text>
          </TouchableOpacity>
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
    padding: 24,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  distance: { color: '#888', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cardIcon: { fontSize: 28, marginBottom: 8 },
  cardLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  cardCount: { color: '#4FC3F7', fontWeight: 'bold', fontSize: 16 },
  startButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  closeButton: { alignItems: 'center', padding: 8 },
  closeButtonText: { color: '#888', fontSize: 14 },
  disabledButton: { backgroundColor: '#444' },
});