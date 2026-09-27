import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LANG_SHORT, Language, useLanguage } from '../LanguageContext';

const PREFERENCES_DATA = {
  '한국어': [
    { id: 'history', label: '역사/문화', icon: '🏛️', description: '박물관, 유적지, 전통문화' },
    { id: 'food', label: '미식', icon: '🍜', description: '전통음식, 로컬 맛집, 시장음식' },
    { id: 'shopping', label: '쇼핑', icon: '🛍️', description: '전통시장, 쇼핑거리' },
    { id: 'nature', label: '자연/산책', icon: '🌿', description: '공원, 하천, 산책로' },
    { id: 'festival', label: '축제/행사', icon: '🎉', description: '지역 축제, 문화행사' },
    { id: 'art', label: '예술', icon: '🎨', description: '미술관, 갤러리, 공연' },
  ],
  'English': [
    { id: 'history', label: 'History/Culture', icon: '🏛️', description: 'Museums, heritage sites, traditions' },
    { id: 'food', label: 'Food', icon: '🍜', description: 'Traditional food, local restaurants' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️', description: 'Traditional markets, shopping streets' },
    { id: 'nature', label: 'Nature/Walk', icon: '🌿', description: 'Parks, rivers, walking trails' },
    { id: 'festival', label: 'Festival', icon: '🎉', description: 'Local festivals, cultural events' },
    { id: 'art', label: 'Art', icon: '🎨', description: 'Museums, galleries, performances' },
  ],
  '日本語': [
    { id: 'history', label: '歴史/文化', icon: '🏛️', description: '博物館、遺跡、伝統文化' },
    { id: 'food', label: 'グルメ', icon: '🍜', description: '伝統料理、ローカルグルメ' },
    { id: 'shopping', label: 'ショッピング', icon: '🛍️', description: '伝統市場、ショッピング街' },
    { id: 'nature', label: '自然/散歩', icon: '🌿', description: '公園、川、散歩道' },
    { id: 'festival', label: 'イベント', icon: '🎉', description: '地域祭り、文化イベント' },
    { id: 'art', label: '芸術', icon: '🎨', description: '美術館、ギャラリー、公演' },
  ],
  '中文': [
    { id: 'history', label: '历史/文化', icon: '🏛️', description: '博物馆、遗址、传统文化' },
    { id: 'food', label: '美食', icon: '🍜', description: '传统美食、当地餐厅' },
    { id: 'shopping', label: '购物', icon: '🛍️', description: '传统市场、购物街' },
    { id: 'nature', label: '自然/散步', icon: '🌿', description: '公园、河流、步行道' },
    { id: 'festival', label: '节日活动', icon: '🎉', description: '地方节日、文化活动' },
    { id: 'art', label: '艺术', icon: '🎨', description: '美术馆、画廊、演出' },
  ],
};

const ONBOARDING_TEXT = {
  '한국어': {
    title: 'LaundriP에 오신 것을\n환영합니다!',
    subtitle: '세탁 대기 시간 동안\n어떤 걸 즐기고 싶으신가요?',
    hint: '복수 선택 가능',
    start: '시작하기 →',
    skip: '건너뛰기',
    select: '관심사를 선택해주세요',
  },
  'English': {
    title: 'Welcome to\nLaundriP!',
    subtitle: 'What would you like to do\nduring laundry wait time?',
    hint: 'Multiple selection allowed',
    start: 'Get Started →',
    skip: 'Skip',
    select: 'Please select your interests',
  },
  '日本語': {
    title: 'LaundriPへ\nようこそ！',
    subtitle: '洗濯待ち時間に\n何を楽しみたいですか？',
    hint: '複数選択可能',
    start: '始める →',
    skip: 'スキップ',
    select: '興味を選んでください',
  },
  '中文': {
    title: '欢迎来到\nLaundriP！',
    subtitle: '洗衣等待时间里\n您想做什么？',
    hint: '可多选',
    start: '开始 →',
    skip: '跳过',
    select: '请选择您的兴趣',
  },
};

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { language, setLanguage } = useLanguage();
  const [selected, setSelected] = useState<string[]>([]);

  const LANGUAGES = ['한국어', 'English', '日本語', '中文'] as Language[];
  const preferences = PREFERENCES_DATA[language];
  const OT = ONBOARDING_TEXT[language];

  const togglePreference = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('user_preferences', JSON.stringify(selected));
      onComplete();
    } catch {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 언어 선택 */}
      <View style={styles.langRow}>
        {LANGUAGES.map((lang) => (
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

      <View style={styles.header}>
        <Text style={styles.logo}>🧺</Text>
        <Text style={styles.title}>{OT.title}</Text>
        <Text style={styles.subtitle}>{OT.subtitle}</Text>
        <Text style={styles.hint}>{OT.hint}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {preferences.map((pref) => (
          <TouchableOpacity
            key={pref.id}
            style={[
              styles.card,
              selected.includes(pref.id) && styles.cardSelected,
            ]}
            onPress={() => togglePreference(pref.id)}
          >
            <Text style={styles.cardIcon}>{pref.icon}</Text>
            <View style={styles.cardText}>
              <Text style={[
                styles.cardLabel,
                selected.includes(pref.id) && styles.cardLabelSelected,
              ]}>
                {pref.label}
              </Text>
              <Text style={styles.cardDesc}>{pref.description}</Text>
            </View>
            {selected.includes(pref.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            selected.length === 0 && styles.buttonDisabled,
          ]}
          onPress={handleComplete}
          disabled={selected.length === 0}
        >
          <Text style={styles.buttonText}>
            {selected.length === 0 ? OT.select : OT.start}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
          <Text style={styles.skipText}>{OT.skip}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 6,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#444',
  },
  langChipActive: { backgroundColor: '#4FC3F7', borderColor: '#4FC3F7' },
  langChipText: { color: '#888', fontSize: 11, fontWeight: '600' },
  langChipTextActive: { color: '#1a1a2e' },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  logo: { fontSize: 48, marginBottom: 12 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: '#4FC3F7' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  cardSelected: { borderColor: '#4FC3F7', backgroundColor: '#1a2a3a' },
  cardIcon: { fontSize: 32 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  cardLabelSelected: { color: '#4FC3F7' },
  cardDesc: { fontSize: 12, color: '#888' },
  checkmark: { fontSize: 20, color: '#4FC3F7', fontWeight: 'bold' },
  footer: { padding: 20, gap: 8 },
  button: {
    backgroundColor: '#4FC3F7',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#333' },
  buttonText: { color: '#1a1a2e', fontWeight: 'bold', fontSize: 16 },
  skipButton: { alignItems: 'center', padding: 8 },
  skipText: { color: '#666', fontSize: 14 },
});