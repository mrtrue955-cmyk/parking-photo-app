import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService } from '../container';
import { getCoords } from '../native/location';
import { ensureNotificationPermission } from '../native/reminders';
import { PrimaryButton, SecondaryButton } from '../ui/components/Button';
import { useScreenHeaderHeight } from '../ui/components/ScreenHeader';
import { Text } from '../ui/components/Text';
import { fontFamilies, radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

type Coords = { lat: number; lng: number } | null;

export default function CaptureScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const headerHeight = useScreenHeaderHeight();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.message}>App cần quyền camera để chụp vị trí xe.</Text>
        <PrimaryButton title="Cho phép camera" onPress={requestPermission} />
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
        [
          {
            text: 'Tiếp tục',
            onPress: () => {
              ensureNotificationPermission()
                .catch(() => undefined)
                .finally(() => resolve());
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve() },
      );
    });
  }

  async function save() {
    if (!photoUri) return;
    setBusy(true);
    let saved = false;
    try {
      try {
        const service = await getParkingService();
        await service.capture({
          tempUri: photoUri,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          note,
        });
        saved = true;
      } catch {
        Alert.alert('Không lưu được ảnh', 'Vui lòng thử lại.');
      }
      if (saved) {
        await askNotificationOnce().catch(() => undefined);
        router.back();
      }
    } finally {
      setBusy(false);
    }
  }

  if (photoUri) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingBottom: spacing.screen + insets.bottom },
        ]}
      >
        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
          contentFit="cover"
          accessible
          accessibilityLabel="Ảnh vừa chụp"
        />
        <Text variant="caption" muted>
          {coords ? 'Đã lấy vị trí GPS' : 'Không lấy được GPS, sẽ không có dẫn đường'}
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Ghi chú (ví dụ: B2, cột 14)"
          placeholderTextColor={colors.textMuted}
          cursorColor={colors.accent}
          selectionColor={colors.primary}
          accessibilityLabel="Ghi chú vị trí xe"
          value={note}
          onChangeText={setNote}
          maxLength={80}
        />
        <PrimaryButton title={busy ? 'Đang lưu...' : 'Lưu'} onPress={save} disabled={busy} />
        <SecondaryButton title="Chụp lại" onPress={() => setPhotoUri(null)} disabled={busy} />
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.camera}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      </View>
      <View style={[styles.shutterRow, { paddingBottom: spacing.sm + insets.bottom }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chụp"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={takePhoto}
          style={[styles.shutterOuter, { borderColor: colors.text, opacity: busy ? 0.5 : 1 }]}
        >
          <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.screen, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  message: { textAlign: 'center' },
  camera: { flex: 1, borderRadius: radius.card, overflow: 'hidden' },
  preview: { flex: 1, borderRadius: radius.card },
  input: {
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
  },
  shutterRow: { alignItems: 'center' },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28 },
});
