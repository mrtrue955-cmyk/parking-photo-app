import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ParkingRecord } from '../../domain/types';
import { formatTimeAgo } from '../format';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { PrimaryButton, SecondaryButton } from './Button';
import { Chip } from './Chip';
import { Text } from './Text';

type Props = {
  record: ParkingRecord;
  photoUri: string;
  now: number;
  onOpen: () => void;
  onNavigate: () => void;
  onCollect: () => void;
};

export function SpotCard({ record, photoUri, now, onOpen, onNavigate, onCollect }: Props) {
  const { colors } = useTheme();
  const hasGps = record.lat !== null && record.lng !== null;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Mở chi tiết vị trí xe"
        onPress={onOpen}
      >
        <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
      </Pressable>
      <Chip label="Đang đậu" tone="primary" />
      {record.note ? (
        <Text variant="display" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <Text variant="caption" muted>
        Đậu {formatTimeAgo(record.createdAt, now)}
      </Text>
      <View style={styles.actions}>
        {hasGps ? (
          <>
            <SecondaryButton title="Đã lấy xe" onPress={onCollect} style={styles.secondary} />
            <PrimaryButton title="Dẫn đường về xe" onPress={onNavigate} style={styles.primary} />
          </>
        ) : (
          <PrimaryButton title="Đã lấy xe" onPress={onCollect} style={styles.primary} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    gap: spacing.sm,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  photo: { width: '100%', height: 200, borderRadius: radius.photo },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  secondary: { flex: 1 },
  primary: { flex: 1.5 },
});
