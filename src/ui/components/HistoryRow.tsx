import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ParkingRecord } from '../../domain/types';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { ExpiryBar } from './ExpiryBar';
import { Text } from './Text';

type Props = { record: ParkingRecord; photoUri: string; now: number; onPress: () => void };

export function HistoryRow({ record, photoUri, now, onPress }: Props) {
  const { colors } = useTheme();
  const title = record.note || 'Không có ghi chú';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
    >
      <Image source={{ uri: photoUri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.text}>
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        <ExpiryBar expiresAt={record.expiresAt} now={now} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.card },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  text: { flex: 1, gap: 6 },
});
