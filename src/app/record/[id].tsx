import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Button, Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { getParkingService, getPhotoFiles } from '../../container';
import { daysLeft } from '../../domain/expiry';
import { useParking } from '../../hooks/useParking';
import { directionsUrl } from '../../native/directions';
import { GalleryPermissionDeniedError } from '../../services/ports';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { records, refresh } = useParking();
  const [busy, setBusy] = useState(false);
  const record = records.find((r) => r.id === id);

  if (!record) return <Text style={styles.message}>Ảnh không còn tồn tại.</Text>;

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
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri }} style={styles.photo} contentFit="contain" />
      {record.note ? <Text style={styles.note}>{record.note}</Text> : null}
      <Text style={styles.meta}>Chụp lúc {new Date(record.createdAt).toLocaleString('vi-VN')}</Text>
      <Text style={styles.meta}>
        {record.expiresAt === null
          ? 'Đã giữ lại, không tự xoá'
          : `Tự xoá sau ${daysLeft(record.expiresAt, Date.now())} ngày (${new Date(record.expiresAt).toLocaleDateString('vi-VN')})`}
      </Text>
      {record.lat !== null && record.lng !== null ? (
        <>
          <Text style={styles.meta}>
            Toạ độ: {record.lat.toFixed(5)}, {record.lng.toFixed(5)}
          </Text>
          <Button
            title="Mở bản đồ"
            onPress={() =>
              Linking.openURL(directionsUrl(record.lat!, record.lng!)).catch(() =>
                Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
              )
            }
          />
        </>
      ) : null}
      {record.expiresAt !== null ? <Button title="Giữ lại" onPress={keep} disabled={busy} /> : null}
      <Button title="Xoá ngay" color="#c00" onPress={confirmDelete} disabled={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  photo: { width: '100%', height: 360, borderRadius: 8 },
  note: { fontSize: 18, fontWeight: '600' },
  meta: { color: '#666' },
  message: { padding: 24, textAlign: 'center' },
});
