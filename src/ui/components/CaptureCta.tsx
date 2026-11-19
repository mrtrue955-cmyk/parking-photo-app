import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

type Props = { onPress: () => void };

/** The single call to action on the empty home screen. The tab bar FAB stays secondary-free. */
export function CaptureCta({ onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Chụp vị trí xe"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: colors.chip }]}>
        <Ionicons name="camera" size={22} color={colors.onChip} />
      </View>
      <View style={styles.body}>
        <Text variant="button">Chụp vị trí xe</Text>
        <Text variant="caption" muted style={styles.subtitle}>
          AI đọc tầng và số cột từ ảnh
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  subtitle: { lineHeight: 16 },
});
