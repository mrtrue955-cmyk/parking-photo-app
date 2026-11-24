import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { historyStatus } from '../../domain/history';
import type { ParkingRecord } from '../../domain/types';
import { useI18n } from '../../i18n';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { ExpiryBar } from './ExpiryBar';
import { Text } from './Text';

type Props = { record: ParkingRecord; photoUri: string; now: number; onPress: () => void };

export function HistoryCard({ record, photoUri, now, onPress }: Props) {
  const { colors } = useTheme();
  const { t, formatTimeAgo } = useI18n();
  const title = record.note || t('spot.noNote');
  const status = historyStatus(record.expiresAt, now);
  const ago = formatTimeAgo(record.createdAt, now);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${t(status.labelKey, { count: status.count ?? 0 })}, ${ago}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Image
        source={{ uri: photoUri }}
        style={styles.thumb}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={record.id}
      />
      <View style={styles.body}>
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" muted>
          {ago}
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
