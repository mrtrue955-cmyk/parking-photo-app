import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../i18n';
import type { TranslationKey } from '../../i18n/translations';
import { fontFamilies, radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

export const TAB_BAR_HEIGHT = 76;
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
  index: { labelKey: 'tabs.home', icon: 'home', iconOff: 'home-outline' },
  history: { labelKey: 'tabs.history', icon: 'time', iconOff: 'time-outline' },
} as const satisfies Record<string, { labelKey: TranslationKey; icon: string; iconOff: string }>;

type TabName = keyof typeof TAB_ITEMS;

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  function renderTab(name: TabName) {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const item = TAB_ITEMS[name];
    const label = t(item.labelKey);
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
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={styles.tab}
      >
        <Ionicons
          name={focused ? item.icon : item.iconOff}
          size={22}
          color={focused ? colors.text : colors.textMuted}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: focused ? colors.text : colors.textMuted,
              fontFamily: focused ? fontFamilies.semibold : fontFamilies.medium,
            },
          ]}
        >
          {label}
        </Text>
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
          accessibilityLabel={t('tabs.capture')}
          onPress={() => router.push('/capture')}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.primary,
              borderColor: colors.surface,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="camera" size={26} color={colors.onPrimary} />
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
    paddingHorizontal: spacing.md,
    borderRadius: radius.tabBar,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tab: { width: 84, height: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 10.5, lineHeight: 14, letterSpacing: 0.1 },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: '#B45309',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});
