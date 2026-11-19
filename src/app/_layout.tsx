import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerPurgeTask } from '../background/purgeTask';
import { useParkedNotificationResponses } from '../hooks/useParkedNotificationResponses';
import { I18nProvider, useI18n } from '../i18n';
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
    registerPurgeTask().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // On a font error the app still starts and falls back to system fonts.
  if (!fontsLoaded && !fontError) return null;

  return (
    <I18nProvider>
      <StatusBar style="auto" />
      <RootStack backgroundColor={colors.background} />
    </I18nProvider>
  );
}

function RootStack({ backgroundColor }: { backgroundColor: string }) {
  const { t, locale } = useI18n();

  // Notification action titles are baked into the OS category, so they follow the locale.
  useEffect(() => {
    registerParkedCategories(locale);
  }, [locale]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="capture"
        options={{ headerShown: true, header: () => <ScreenHeader title={t('capture.title')} /> }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: true, header: () => <ScreenHeader title={t('settings.title')} /> }}
      />
      <Stack.Screen
        name="record/[id]"
        options={{ headerShown: true, header: () => <ScreenHeader title={t('detail.title')} /> }}
      />
    </Stack>
  );
}
