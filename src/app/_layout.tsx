import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerPurgeTask } from '../background/purgeTask';
import { I18nProvider, useI18n } from '../i18n';
import '../native/geofence';
import '../native/notificationSetup';
import { ToastProvider } from '../ui/toast';
import { AppErrorBoundary } from '../ui/components/AppErrorBoundary';
import { ScreenHeader } from '../ui/components/ScreenHeader';
import { fontAssets } from '../ui/fonts';
import { useTheme } from '../ui/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: '(tabs)' };

// Any render error below the root renders this instead of a white screen.
export const ErrorBoundary = AppErrorBoundary;

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
    <I18nProvider>
      <ToastProvider>
        <StatusBar style="auto" />
        <RootStack backgroundColor={colors.background} />
      </ToastProvider>
    </I18nProvider>
  );
}

function RootStack({ backgroundColor }: { backgroundColor: string }) {
  const { t } = useI18n();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="capture"
        options={{ headerShown: true, header: () => <ScreenHeader title={t('capture.title')} /> }}
      />
      <Stack.Screen
        name="stats"
        options={{ headerShown: true, header: () => <ScreenHeader title={t('stats.title')} /> }}
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
