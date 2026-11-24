import { Redirect, Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSettings } from '../../hooks/useSettings';
import { useI18n } from '../../i18n';
import { TabBar } from '../../ui/components/TabBar';
import { useTheme } from '../../ui/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { settings } = useSettings();

  // Hold the tabs until settings are known so a first launch never flashes the
  // home screen before the intro.
  if (!settings) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!settings.onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="history" options={{ title: t('tabs.history') }} />
    </Tabs>
  );
}
