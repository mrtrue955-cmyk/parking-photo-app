import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerPurgeTask } from '../background/purgeTask';
import { useParkedNotificationResponses } from '../hooks/useParkedNotificationResponses';
import '../native/geofence';
import '../native/notificationSetup';
import { registerParkedCategories } from '../native/parkedNotification';
import { ScreenHeader } from '../ui/components/ScreenHeader';
import { fontAssets } from '../ui/fonts';
import { useTheme } from '../ui/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  const { colors } = useTheme();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  useParkedNotificationResponses();

  useEffect(() => {
    registerParkedCategories();
  }, []);

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
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="capture"
          options={{ headerShown: true, header: () => <ScreenHeader title="Chụp vị trí xe" /> }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: true, header: () => <ScreenHeader title="Cài đặt" /> }}
        />
        <Stack.Screen
          name="record/[id]"
          options={{ headerShown: true, header: () => <ScreenHeader title="Chi tiết" /> }}
        />
      </Stack>
    </>
  );
}
