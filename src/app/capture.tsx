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
import type { ParkingRecord } from '../domain/types';
import { getCoords } from '../native/location';
import { showParkedNotification } from '../native/parkedNotification';
import { suggestNoteFromPhoto } from '../native/photoSuggestion';
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
  const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'reading' | 'suggested'>(
    'idle',
  );
  const suggestionRequest = useRef(0);
  const noteEdited = useRef(false);

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

  function suggestForPhoto(uri: string) {
    // The user already typed a note: skip the read entirely.
    if (noteEdited.current) return;
    const requestId = ++suggestionRequest.current;
    setSuggestionStatus('reading');
    suggestNoteFromPhoto(uri).then((suggestion) => {
      // Ignore results for an older photo or after a retake/save.
      if (requestId !== suggestionRequest.current) return;
      if (suggestion && !noteEdited.current) {
        setNote(suggestion);
        setSuggestionStatus('suggested');
      } else {
        setSuggestionStatus('idle');
      }
    });
  }

  function retake() {
    suggestionRequest.current += 1;
    if (suggestionStatus === 'suggested') {
      // The note is only an auto-filled suggestion: clear it.
      setNote('');
      noteEdited.current = false;
    } else {
      // Keep the user's own text and keep treating it as edited; an empty
      // field starts the next photo fresh so it can be auto-filled.
      noteEdited.current = note.length > 0;
    }
    setSuggestionStatus('idle');
    setPhotoUri(null);
  }

  async function takePhoto() {
    setBusy(true);
    try {
      const coordsPromise = getCoords();
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo) return;
      setPhotoUri(photo.uri);
      suggestForPhoto(photo.uri);
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
    // A late suggestion must not fill the field while the save alert is open.
    suggestionRequest.current += 1;
    setBusy(true);
    let saved = false;
    let savedRecord: ParkingRecord | null = null;
    try {
      try {
        const service = await getParkingService();
        savedRecord = await service.capture({
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
        if (savedRecord) await showParkedNotification(savedRecord);
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
        keyboardVerticalOffset={headerHeight - insets.bottom}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View style={[styles.container, { paddingBottom: spacing.screen + insets.bottom }]}>
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
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Ghi chú (ví dụ: B2, cột 14)"
            placeholderTextColor={colors.textMuted}
            cursorColor={colors.accent}
            selectionColor={colors.primary}
            accessibilityLabel="Ghi chú vị trí xe"
            value={note}
            onChangeText={(text) => {
              noteEdited.current = true;
              setNote(text);
              setSuggestionStatus('idle');
            }}
            maxLength={80}
          />
          {suggestionStatus !== 'idle' ? (
            <Text variant="caption" muted accessibilityLiveRegion="polite">
              {suggestionStatus === 'reading' ? 'Đang đọc ảnh...' : 'Gợi ý từ ảnh, bạn có thể sửa'}
            </Text>
          ) : null}
          <PrimaryButton title={busy ? 'Đang lưu...' : 'Lưu'} onPress={save} disabled={busy} />
          <SecondaryButton title="Chụp lại" onPress={retake} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="caption" muted style={styles.hint}>
        Chụp gần số cột để app tự đọc
      </Text>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  message: { textAlign: 'center' },
  hint: { textAlign: 'center' },
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
