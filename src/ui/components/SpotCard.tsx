import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ParkingRecord } from '../../domain/types';
import { formatTimeAgo } from '../format';
import { BayFrame } from './BayFrame';
import { PrimaryButton, TextButton } from './Button';
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
  const hasGps = record.lat !== null && record.lng !== null;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel="Mở chi tiết vị trí xe" onPress={onOpen}>
        <BayFrame style={styles.frame}>
          <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" accessible accessibilityLabel="Ảnh vị trí xe" />
        </BayFrame>
      </Pressable>
      {record.note ? (
        <Text variant="sign" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <Text variant="caption" muted>
        Đậu {formatTimeAgo(record.createdAt, now)}
      </Text>
      {hasGps ? <PrimaryButton title="Dẫn đường về xe" onPress={onNavigate} /> : null}
      <TextButton title="Đã lấy xe" onPress={onCollect} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  frame: { borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: 240 },
});
