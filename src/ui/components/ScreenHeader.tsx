import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';
import { useTheme } from '../useTheme';
import { IconButton } from './Button';
import { Text } from './Text';

export const HEADER_CONTENT_HEIGHT = 64;

/** Full header height (top safe inset plus content), for keyboard offsets. */
export function useScreenHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_CONTENT_HEIGHT;
}

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
      <View style={styles.row}>
        <IconButton icon="arrow-back" accessibilityLabel="Quay lại" onPress={goBack} />
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
  },
  title: { flex: 1, textAlign: 'center' },
  spacer: { width: 44 },
});
