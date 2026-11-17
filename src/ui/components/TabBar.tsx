import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';

export const TAB_BAR_HEIGHT = 72;
const TAB_BAR_BOTTOM_GAP = 12;
const TAB_BAR_CONTENT_GAP = 24;

/** Bottom space screens must reserve so content is not hidden behind the floating bar. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + TAB_BAR_CONTENT_GAP + insets.bottom;
}

type TabBarRenderer = NonNullable<ComponentProps<typeof Tabs>['tabBar']>;
type BottomTabBarProps = Parameters<TabBarRenderer>[0];

const TAB_ITEMS = {
  index: { label: 'Xe của tôi', icon: 'home', iconOff: 'home-outline' },
  history: { label: 'Lịch sử', icon: 'time', iconOff: 'time-outline' },
} as const;

type TabName = keyof typeof TAB_ITEMS;

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  function renderTab(name: TabName) {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const item = TAB_ITEMS[name];
    const focused = focusedName === name;

    function onPress() {
      const event = emitter.emit({
        type: 'tabPress',
        target: route!.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) navigateToTab(route!.key);
    }

    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={styles.tab}
      >
        <View style={[styles.tabCircle, focused ? { backgroundColor: colors.chip } : null]}>
          <Ionicons
            name={focused ? item.icon : item.iconOff}
            size={24}
            color={focused ? colors.onChip : colors.textMuted}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP }]}
    >
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {renderTab('index')}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chụp vị trí xe"
          onPress={() => router.push('/capture')}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="camera" size={28} color={colors.onPrimary} />
        </Pressable>
        {renderTab('history')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.screen, right: spacing.screen, alignItems: 'center' },
  bar: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.tabBar,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tab: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  tabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
