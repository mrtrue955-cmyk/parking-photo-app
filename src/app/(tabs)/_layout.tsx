import { Tabs } from 'expo-router';
import { TabBar } from '../../ui/components/TabBar';
import { useTheme } from '../../ui/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Xe của tôi' }} />
      <Tabs.Screen name="history" options={{ title: 'Lịch sử' }} />
    </Tabs>
  );
}
