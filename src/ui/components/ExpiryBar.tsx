import { StyleSheet, View } from 'react-native';
import { daysLeft, expiryFraction, isExpiringSoon } from '../../domain/expiry';
import { useTheme } from '../useTheme';
import { Text } from './Text';

/** Shows how much of the 30-day retention window is left, or "Đã giữ lại" for kept photos. */
export function ExpiryBar({ expiresAt, now }: { expiresAt: number | null; now: number }) {
  const { colors } = useTheme();

  if (expiresAt === null) {
    return (
      <Text variant="caption" muted>
        Đã giữ lại
      </Text>
    );
  }

  const days = daysLeft(expiresAt, now);
  const label = `còn ${days} ngày`;
  const fill = isExpiringSoon(expiresAt, now) ? colors.danger : colors.primary;
  const percent = Math.round(expiryFraction(expiresAt, now) * 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Hạn xoá"
      accessibilityValue={{ text: label }}
      style={styles.row}
    >
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { backgroundColor: fill, width: `${percent}%` }]} />
      </View>
      <Text variant="caption" muted>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
