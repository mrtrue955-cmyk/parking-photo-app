import { Tabs } from 'expo-router';
import { useI18n } from '../../i18n';
import { TabBar } from '../../ui/components/TabBar';
import { useTheme } from '../../ui/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useI18n();
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
