import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';


export type Language = '한국어' | 'English' | '日本語' | '中文';
export const LANG_FLAG: Record<Language, string> = {
  '한국어': '🇰🇷',
  'English': '🇺🇸',
  '日本語': '🇯🇵',
  '中文': '🇨🇳',
};

export const LANG_SHORT: Record<Language, string> = {
  '한국어': '한국어',
  'English': 'ENG',
  '日本語': '日本語',
  '中文': '中文',
};

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  '한국어': {
    header: 'LaundriP',
    search: '장소 검색...',
    aiTitle: '취향 맞춤 추천',
    aiSubTitle: 'AI 추천',
    aiLoading: 'AI가 분석 중...',
    noResult: '주변 장소를 찾는 중...',
    aiEmpty: 'AI 추천 결과 없음',
    close: '닫기',
    open: '열기',
    washDone: '🧺 세탁이 완료되었습니다! 세탁물을 찾으러 가세요.',
    langTitle: '언어 선택',
    cultureTitle: '🎭 문화 콘텐츠',
    cultureSubtitle: '현재위치 주변 추천 장소',
    filterAll: '전체',
    filterLaundry: '세탁소',
    filterTourist: '관광지',
    filterFood: '음식점',
    filterCulture: '문화시설',
    filterMarket: '전통시장',
    filterFestival: '축제/행사',
    startWash: '이곳에서 세탁/건조 시작하기',
    noMachine: '❌ 사용 가능한 기기 없음',
    washer: '세탁기',
    dryer: '건조기',
    selectTime: '세탁 정보를 선택하세요',
    selectTimeDesc: '기기 종류와 남은 시간을 입력해주세요',
    timeLabel: '⏱️ 사용 시간 선택',
    confirm: '시작하기',
    cancel: '취소',
    directions: '🗺️ 카카오맵으로 길찾기',
    timerBanner: '세탁 완료까지',
    onboardingTitle: 'LaundriP에 오신 것을\n환영합니다!',
    onboardingSubtitle: '세탁 대기 시간 동안\n어떤 걸 즐기고 싶으신가요?',
    onboardingHint: '복수 선택 가능',
    onboardingStart: '시작하기 →',
    onboardingSkip: '건너뛰기',
    onboardingSelect: '관심사를 선택해주세요',
  },
  'English': {
    header: 'LaundriP',
    search: 'Search places...',
    aiTitle: 'For You',
    aiSubTitle: 'AI Picks',
    aiLoading: 'AI is analyzing...',
    noResult: 'Looking for nearby places...',
    aiEmpty: 'No AI recommendations',
    close: 'Close',
    open: 'Open',
    washDone: '🧺 Laundry done! Please collect your laundry.',
    langTitle: 'Select Language',
    cultureTitle: '🎭 Culture',
    cultureSubtitle: 'Recommended places near your location',
    filterAll: 'All',
    filterLaundry: 'Laundry',
    filterTourist: 'Tourist',
    filterFood: 'Food',
    filterCulture: 'Culture',
    filterMarket: 'Market',
    filterFestival: 'Festival',
    startWash: 'Start Laundry/Dry Here',
    noMachine: '❌ No machines available',
    washer: 'Washer',
    dryer: 'Dryer',
    selectTime: 'Select Laundry Info',
    selectTimeDesc: 'Choose machine type and time',
    timeLabel: '⏱️ Select Time',
    confirm: 'Start',
    cancel: 'Cancel',
    directions: '🗺️ Get Directions (KakaoMap)',
    timerBanner: 'Laundry done in',
    onboardingTitle: 'Welcome to\nLaundriP!',
    onboardingSubtitle: 'What would you like to do\nduring laundry wait time?',
    onboardingHint: 'Multiple selection allowed',
    onboardingStart: 'Get Started →',
    onboardingSkip: 'Skip',
    onboardingSelect: 'Please select your interests',
  },
  '日本語': {
    header: 'LaundriP',
    search: '場所を検索...',
    aiTitle: 'おすすめ',
    aiSubTitle: 'AI おすすめ',
    aiLoading: 'AIが分析中...',
    noResult: '近くの場所を探しています...',
    aiEmpty: 'AIのおすすめはありません',
    close: '閉じる',
    open: '開く',
    washDone: '🧺 洗濯が完了しました！お取りください。',
    langTitle: '言語選択',
    cultureTitle: '🎭 文化コンテンツ',
    cultureSubtitle: '現在地周辺おすすめスポット',
    filterAll: '全て',
    filterLaundry: 'コインランドリー',
    filterTourist: '観光地',
    filterFood: 'グルメ',
    filterCulture: '文化施設',
    filterMarket: '伝統市場',
    filterFestival: 'イベント',
    startWash: 'ここで洗濯/乾燥を開始',
    noMachine: '❌ 利用可能な機器なし',
    washer: '洗濯機',
    dryer: '乾燥機',
    selectTime: '洗濯情報を選択',
    selectTimeDesc: '機器の種類と時間を入力してください',
    timeLabel: '⏱️ 使用時間を選択',
    confirm: '開始',
    cancel: 'キャンセル',
    directions: '🗺️ カカオマップで経路',
    timerBanner: '洗濯完了まで',
    onboardingTitle: 'LaundriPへ\nようこそ！',
    onboardingSubtitle: '洗濯待ち時間に\n何を楽しみたいですか？',
    onboardingHint: '複数選択可能',
    onboardingStart: '始める →',
    onboardingSkip: 'スキップ',
    onboardingSelect: '興味を選んでください',
  },
  '中文': {
    header: 'LaundriP',
    search: '搜索地点...',
    aiTitle: '为你推荐',
    aiSubTitle: 'AI 推荐',
    aiLoading: 'AI分析中...',
    noResult: '正在寻找附近的地方...',
    aiEmpty: '没有AI推荐',
    close: '关闭',
    open: '打开',
    washDone: '🧺 洗衣完成！请取回您的衣物。',
    langTitle: '选择语言',
    cultureTitle: '🎭 文化内容',
    cultureSubtitle: '当前位置 周边推荐场所',
    filterAll: '全部',
    filterLaundry: '洗衣店',
    filterTourist: '景点',
    filterFood: '餐厅',
    filterCulture: '文化设施',
    filterMarket: '传统市场',
    filterFestival: '节日活动',
    startWash: '在此开始洗衣/烘干',
    noMachine: '❌ 没有可用设备',
    washer: '洗衣机',
    dryer: '烘干机',
    selectTime: '选择洗衣信息',
    selectTimeDesc: '请选择设备类型和时间',
    timeLabel: '⏱️ 选择使用时间',
    confirm: '开始',
    cancel: '取消',
    directions: '🗺️ KakaoMap导航',
    timerBanner: '洗衣完成倒计时',
    onboardingTitle: '欢迎来到\nLaundriP！',
    onboardingSubtitle: '洗衣等待时间里\n您想做什么？',
    onboardingHint: '可多选',
    onboardingStart: '开始 →',
    onboardingSkip: '跳过',
    onboardingSelect: '请选择您的兴趣',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  T: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: '한국어',
  setLanguage: () => {},
  T: TRANSLATIONS['한국어'],
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('한국어');

  useEffect(() => {
    AsyncStorage.getItem('app_language').then((saved) => {
      if (saved) setLanguageState(saved as Language);
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem('app_language', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, T: TRANSLATIONS[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageProvider;