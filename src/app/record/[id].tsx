import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService, getPhotoFiles } from '../../container';
import { pickCurrent } from '../../domain/current';
import { useParking } from '../../hooks/useParking';
import { historyStatus } from '../../domain/history';
import { directionsUrl } from '../../native/directions';
import { dismissParkedNotification } from '../../native/parkedNotification';
import { GalleryPermissionDeniedError } from '../../services/ports';
import { PrimaryButton, SecondaryButton, TextButton } from '../../ui/components/Button';
import { Chip } from '../../ui/components/Chip';
import { ExpiryBar } from '../../ui/components/ExpiryBar';
import { Text } from '../../ui/components/Text';
import { radius, spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { records, loaded, now, refresh } = useParking();
  const [busy, setBusy] = useState(false);
  const record = records.find((r) => r.id === id);

  if (!loaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!record) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text muted>Ảnh không còn tồn tại.</Text>
      </View>
    );
  }

  const recordId = record.id;
  const uri = getPhotoFiles().uriFor(record.photoPath);

  async function keep() {
    if (busy) return;
    setBusy(true);
    try {
      await (await getParkingService()).keep(recordId);
      await refresh();
      Alert.alert('Đã giữ lại', 'Ảnh đã được lưu vào thư viện và sẽ không bị tự xoá.');
    } catch (error) {
      if (error instanceof GalleryPermissionDeniedError) {
        Alert.alert('Không giữ lại được', 'Hãy cho phép app lưu ảnh vào thư viện trong Cài đặt.');
      } else {
        Alert.alert('Không giữ lại được', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (busy) return;
    Alert.alert('Xoá ảnh này?', 'Ảnh sẽ bị xoá ngay.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          if (busy) return;
          setBusy(true);
          const wasCurrent = pickCurrent(records)?.id === recordId;
          try {
            await (await getParkingService()).deleteNow(recordId);
          } catch {
            Alert.alert('Không xoá được', 'Vui lòng thử lại.');
            setBusy(false);
            return;
          }
          if (wasCurrent) await dismissParkedNotification();
          setBusy(false);
          router.back();
        },
      },
    ]);
  }

  const status = historyStatus(record.expiresAt, now);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      <Image source={{ uri }} style={styles.photo} contentFit="cover" accessible accessibilityLabel="Ảnh vị trí xe" />
      <Chip label={status.label} tone={status.tone} />
      {record.note ? (
        <Text variant="display" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <View style={[styles.info, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="caption" muted>
          Chụp lúc {new Date(record.createdAt).toLocaleString('vi-VN')}
        </Text>
        <ExpiryBar expiresAt={record.expiresAt} now={now} />
        {record.lat !== null && record.lng !== null ? (
          <Text variant="caption" muted>
            Toạ độ: {record.lat.toFixed(5)}, {record.lng.toFixed(5)}
          </Text>
        ) : null}
      </View>
      {record.expiresAt !== null ? <PrimaryButton title="Giữ lại" onPress={keep} disabled={busy} /> : null}
      {record.lat !== null && record.lng !== null ? (
        <SecondaryButton
          title="Mở bản đồ"
          onPress={() =>
            Linking.openURL(directionsUrl(record.lat!, record.lng!)).catch(() =>
              Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
            )
          }
        />
      ) : null}
      <View style={styles.dangerZone}>
        <TextButton title="Xoá ngay" tone="danger" onPress={confirmDelete} disabled={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.screen, gap: spacing.md },
  photo: { width: '100%', height: 300, borderRadius: radius.card },
  info: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dangerZone: { marginTop: spacing.xl, alignItems: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
