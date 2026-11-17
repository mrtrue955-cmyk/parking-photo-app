import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService, getPhotoFiles } from '../../container';
import { useParking } from '../../hooks/useParking';
import { directionsUrl } from '../../native/directions';
import { GalleryPermissionDeniedError } from '../../services/ports';
import { PrimaryButton, TextButton } from '../../ui/components/Button';
import { ExpiryBar } from '../../ui/components/ExpiryBar';
import { Text } from '../../ui/components/Text';
import { radius, spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { records, loaded, refresh } = useParking();
  const [busy, setBusy] = useState(false);
  const record = records.find((r) => r.id === id);

  if (!loaded) {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
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
  const now = Date.now();

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
          try {
            await (await getParkingService()).deleteNow(recordId);
          } catch {
            Alert.alert('Không xoá được', 'Vui lòng thử lại.');
            setBusy(false);
            return;
          }
          setBusy(false);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      <Image source={{ uri }} style={styles.photo} contentFit="cover" accessible accessibilityLabel="Ảnh vị trí xe" />
      {record.note ? (
        <Text variant="sign" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <Text variant="caption" muted>
        Chụp lúc {new Date(record.createdAt).toLocaleString('vi-VN')}
      </Text>
      <ExpiryBar expiresAt={record.expiresAt} now={now} />
      {record.lat !== null && record.lng !== null ? (
        <View style={styles.block}>
          <Text variant="caption" muted>
            Toạ độ: {record.lat.toFixed(5)}, {record.lng.toFixed(5)}
          </Text>
          <TextButton
            title="Mở bản đồ"
            onPress={() =>
              Linking.openURL(directionsUrl(record.lat!, record.lng!)).catch(() =>
                Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
              )
            }
          />
        </View>
      ) : null}
      {record.expiresAt !== null ? <PrimaryButton title="Giữ lại" onPress={keep} disabled={busy} /> : null}
      <View style={styles.dangerZone}>
        <TextButton title="Xoá ngay" tone="danger" onPress={confirmDelete} disabled={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.screen, gap: spacing.md, paddingBottom: spacing.xl },
  photo: { width: '100%', height: 320, borderRadius: radius.card },
  block: { gap: spacing.xs },
  dangerZone: { marginTop: spacing.xl, alignItems: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
