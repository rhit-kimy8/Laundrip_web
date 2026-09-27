import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLanguage } from '../LanguageContext';


interface TimePickerModalProps {
  visible: boolean;
  onConfirm: (minutes: number, type: string) => void;
  onClose: () => void;
}

export default function TimePickerModal({ visible, onConfirm, onClose }: TimePickerModalProps) {
  const { T } = useLanguage();
  const [selectedMinutes, setSelectedMinutes] = useState(40);
  const [selectedType, setSelectedType] = useState<string>('');
  const [customInput, setCustomInput] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const washerLabel = T.washer;
  const dryerLabel = T.dryer;
  const minuteOptions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90];

  const getFinalMinutes = () => {
    if (useCustom && customInput) {
      const parsed = parseInt(customInput);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 180) return parsed;
    }
    return selectedMinutes;
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
  <KeyboardAvoidingView 
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  >
    <View style={styles.overlay}>
      <View style={styles.popup}>

          {/* 세탁기 / 건조기 선택 */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, selectedType === washerLabel && styles.typeButtonSelected]}
              onPress={() => setSelectedType(washerLabel)}
            >
              <Text style={styles.typeIcon}>👕</Text>
              <Text style={[styles.typeText, selectedType === washerLabel && styles.typeTextSelected]}>
                {washerLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, selectedType === dryerLabel && styles.typeButtonSelected]}
              onPress={() => setSelectedType(dryerLabel)}
            >
              <Text style={styles.typeIcon}>💨</Text>
              <Text style={[styles.typeText, selectedType === dryerLabel && styles.typeTextSelected]}>
                {dryerLabel}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.timeLabel}>{T.timeLabel}</Text>

          {/* 직접 입력 토글 */}
          <View style={styles.customRow}>
            <TouchableOpacity
              style={[styles.customToggle, useCustom && styles.customToggleActive]}
              onPress={() => {
                setUseCustom(!useCustom);
                setCustomInput('');
              }}
            >
              <Text style={[styles.customToggleText, useCustom && styles.customToggleTextActive]}>
                ✏️ {T.washer === '세탁기' ? '직접 입력' : 'Custom'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 직접 입력 칸 */}
          {useCustom ? (
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder={T.washer === '세탁기' ? '분 단위로 입력 (1~180)' : 'Enter minutes (1~180)'}
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={customInput}
                onChangeText={(text) => {
                  const num = parseInt(text);
                  if (text === '' || (!isNaN(num) && num <= 180)) {
                    setCustomInput(text);
                  }
                }}
                maxLength={3}
              />
              <Text style={styles.customUnit}>
                {T.washer === '세탁기' ? '분' : 'min'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {minuteOptions.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.option, selectedMinutes === min && styles.selectedOption]}
                  onPress={() => setSelectedMinutes(min)}
                >
                  <Text style={[styles.optionText, selectedMinutes === min && styles.selectedOptionText]}>
                    {min}{T.washer === '세탁기' ? '분' : ' min'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[
              styles.confirmButton,
              useCustom && (!customInput || parseInt(customInput) <= 0) && styles.confirmButtonDisabled
            ]}
            onPress={() => {
              const finalMinutes = getFinalMinutes();
              if (finalMinutes > 0) {
                onConfirm(finalMinutes, selectedType || washerLabel);
              }
            }}
            disabled={useCustom && (!customInput || parseInt(customInput) <= 0)}
          >
            <Text style={styles.confirmButtonText}>
              {selectedType || washerLabel} {getFinalMinutes()}{T.washer === '세탁기' ? '분 ' : ' min '}{T.confirm}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{T.cancel}</Text>
          </TouchableOpacity>
        </View>
    </View>
  </KeyboardAvoidingView>
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
    maxHeight: '85%',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { color: '#888', fontSize: 13, marginBottom: 20 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeButton: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: { borderColor: '#4FC3F7', backgroundColor: '#1a2a3a' },
  typeIcon: { fontSize: 28, marginBottom: 6 },
  typeText: { color: '#888', fontWeight: 'bold', fontSize: 15 },
  typeTextSelected: { color: '#4FC3F7' },
  timeLabel: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  customRow: { marginBottom: 12 },
  customToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#444',
    alignSelf: 'flex-start',
  },
  customToggleActive: { backgroundColor: '#4FC3F7', borderColor: '#4FC3F7' },
  customToggleText: { color: '#888', fontSize: 12, fontWeight: '600' },
  customToggleTextActive: { color: '#1a1a2e' },
  customInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
    borderWidth: 2,
    borderColor: '#4FC3F7',
  },
  customInput: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  customUnit: {
    color: '#4FC3F7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scroll: { maxHeight: 200, marginBottom: 16 },
  option: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#2a2a3e',
    alignItems: 'center',
  },
  selectedOption: { backgroundColor: '#4FC3F7' },
  optionText: { color: '#888', fontSize: 16 },
  selectedOptionText: { color: '#1a1a2e', fontWeight: 'bold' },
  confirmButton: {
    backgroundColor: '#4FC3F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonDisabled: { backgroundColor: '#333' },
  confirmButtonText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  closeButton: { alignItems: 'center', padding: 8 },
  closeButtonText: { color: '#888', fontSize: 14 },
});