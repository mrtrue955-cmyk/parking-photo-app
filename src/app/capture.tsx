import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { getParkingService } from '../container';
import { getCoords } from '../native/location';
import { ensureNotificationPermission } from '../native/reminders';

type Coords = { lat: number; lng: number } | null;

export default function CaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!permission) return <ActivityIndicator style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>App cần quyền camera để chụp vị trí xe.</Text>
        <Button title="Cho phép camera" onPress={requestPermission} />
      </View>
    );
  }

  async function takePhoto() {
    setBusy(true);
    try {
      const coordsPromise = getCoords();
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo) return;
      setPhotoUri(photo.uri);
      setCoords(await coordsPromise);
    } catch {
      Alert.alert('Không chụp được ảnh', 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  async function askNotificationOnce() {
    const status = (await Notifications.getPermissionsAsync()).status;
    if (status !== 'undetermined') return;
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Nhắc trước khi xoá',
        'Cho phép thông báo để app nhắc bạn trước khi ảnh bị xoá.',
        [{ text: 'Tiếp tục', onPress: () => ensureNotificationPermission().then(() => resolve()) }],
      );
    });
  }

  async function save() {
    if (!photoUri) return;
    setBusy(true);
    try {
      const service = await getParkingService();
      await service.capture({
        tempUri: photoUri,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        note,
      });
      await askNotificationOnce();
      router.back();
    } catch {
      Alert.alert('Không lưu được ảnh', 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
        <Text style={styles.gps}>
          {coords ? 'Đã lấy vị trí GPS' : 'Không lấy được GPS, sẽ không có dẫn đường'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ghi chú (ví dụ: B2, cột 14)"
          value={note}
          onChangeText={setNote}
          maxLength={80}
        />
        <Button title={busy ? 'Đang lưu...' : 'Lưu'} onPress={save} disabled={busy} />
        <Button title="Chụp lại" onPress={() => setPhotoUri(null)} disabled={busy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <Button title={busy ? 'Đang chụp...' : 'Chụp'} onPress={takePhoto} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  message: { textAlign: 'center' },
  camera: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  preview: { flex: 1, borderRadius: 12 },
  gps: { color: '#666' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
});
