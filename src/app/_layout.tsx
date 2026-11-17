import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerPurgeTask } from '../background/purgeTask';
import { fontAssets } from '../ui/fonts';
import { fontFamilies } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colors } = useTheme();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    registerPurgeTask().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // On a font error the app still starts and falls back to system fonts.
  if (!fontsLoaded && !fontError) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text, fontFamily: fontFamilies.condensed, fontSize: 24 },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Xe của tôi' }} />
        <Stack.Screen name="capture" options={{ title: 'Chụp vị trí xe' }} />
        <Stack.Screen name="record/[id]" options={{ title: 'Chi tiết' }} />
      </Stack>
    </>
  );
}
