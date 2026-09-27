import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useLanguage } from '../../src/LanguageContext';

export default function TabLayout() {
  const { T } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#333',
        },
        tabBarActiveTintColor: '#4FC3F7',
        tabBarInactiveTintColor: '#888',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: T.filterAll === '전체' ? '지도' : 
                 T.filterAll === 'All' ? 'Map' :
                 T.filterAll === '全て' ? '地図' : '地图',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: T.filterAll === '전체' ? '문화콘텐츠' :
                 T.filterAll === 'All' ? 'Culture' :
                 T.filterAll === '全て' ? '文化' : '文化',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}