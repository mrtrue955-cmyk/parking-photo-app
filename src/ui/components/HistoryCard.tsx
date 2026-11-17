import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { historyStatus } from '../../domain/history';
import type { ParkingRecord } from '../../domain/types';
import { formatTimeAgo } from '../format';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { Chip } from './Chip';
import { ExpiryBar } from './ExpiryBar';
import { Text } from './Text';

type Props = { record: ParkingRecord; photoUri: string; now: number; onPress: () => void };

export function HistoryCard({ record, photoUri, now, onPress }: Props) {
  const { colors } = useTheme();
  const title = record.note || 'Không có ghi chú';
  const status = historyStatus(record.expiresAt, now);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${status.label}, đậu ${formatTimeAgo(record.createdAt, now)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Image source={{ uri: photoUri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.body}>
        <Chip label={status.label} tone={status.tone} />
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" muted>
          Đậu {formatTimeAgo(record.createdAt, now)}
        </Text>
        {record.expiresAt !== null ? <ExpiryBar expiresAt={record.expiresAt} now={now} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 88, height: 88, borderRadius: 16 },
  body: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
});
