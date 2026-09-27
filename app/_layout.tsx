import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LanguageProvider } from '../src/LanguageContext';
import OnboardingScreen from '../src/screens/OnboardingScreen';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
  const timer = setTimeout(async () => {
    setShowSplash(false);
    setShowOnboarding(true); 
  }, 3000);
  return () => clearTimeout(timer);
}, []);

  if (showSplash) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (showOnboarding) {
  return (
    <LanguageProvider>
      <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
    </LanguageProvider>
  );
}

return (
  <LanguageProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
    </Stack>
  </LanguageProvider>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 280,
    height: 280,
  },
});