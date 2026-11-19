import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService } from '../container';
import { canQuickEdit, parseNote, setLevel, setPillar } from '../domain/noteEditor';
import type { ParkingRecord } from '../domain/types';
import { getCoords } from '../native/location';
import { showParkedNotification } from '../native/parkedNotification';
import { suggestNoteFromPhoto } from '../native/photoSuggestion';
import { ensureNotificationPermission } from '../native/reminders';
import { PrimaryButton, SecondaryButton } from '../ui/components/Button';
import { impactFeedback, successFeedback, tapFeedback } from '../ui/haptics';
import { useScreenHeaderHeight } from '../ui/components/ScreenHeader';
import { Text } from '../ui/components/Text';
import { fontFamilies, radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

type Coords = { lat: number; lng: number } | null;
type SuggestionStatus = 'idle' | 'reading' | 'suggested';

const LEVELS = ['B1', 'B2', 'B3'] as const;

const STATUS_LABEL: Record<SuggestionStatus, string | null> = {
  idle: null,
  reading: 'Đang đọc ảnh…',
  suggested: 'Gợi ý từ ảnh',
};

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
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>('idle');
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
      <View style={[styles.priming, { backgroundColor: colors.background }]}>
        <View style={[styles.primingIcon, { backgroundColor: colors.chip }]}>
          <Ionicons name="camera" size={30} color={colors.onChip} />
        </View>
        <Text variant="heading" style={styles.message}>
          Cần quyền camera
        </Text>
        <Text muted style={styles.message}>
          App dùng camera để chụp cột xe và đọc số cột. Ảnh chỉ nằm trên máy này, không tải lên
          mạng.
        </Text>
        {permission.canAskAgain ? (
          <PrimaryButton title="Tiếp tục" onPress={requestPermission} />
        ) : (
          <>
            <Text variant="caption" muted style={styles.message}>
              Quyền camera đang bị tắt trong Cài đặt của máy.
            </Text>
            <PrimaryButton title="Mở Cài đặt" onPress={() => Linking.openSettings()} />
          </>
        )}
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
    impactFeedback();
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
        successFeedback();
        await askNotificationOnce().catch(() => undefined);
        if (savedRecord) await showParkedNotification(savedRecord);
        router.back();
      }
    } finally {
      setBusy(false);
    }
  }

  function editNote(next: string) {
    noteEdited.current = true;
    setNote(next);
  }

  function chooseLevel(level: string) {
    tapFeedback();
    setSuggestionStatus('idle');
    editNote(setLevel(note, level));
  }

  function stepPillar(delta: number) {
    tapFeedback();
    const current = parseNote(note).pillar;
    const next = current === null ? (delta > 0 ? 1 : 1) : current + delta;
    setSuggestionStatus('idle');
    editNote(setPillar(note, next));
  }

  if (photoUri) {
    const parts = parseNote(note);
    const statusLabel = STATUS_LABEL[suggestionStatus];
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight - insets.bottom}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.resultContent,
            { paddingBottom: spacing.screen + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: photoUri }}
              style={styles.preview}
              contentFit="cover"
              accessible
              accessibilityLabel="Ảnh vừa chụp"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Chụp lại ảnh khác"
              onPress={retake}
              style={styles.retakeChip}
            >
              <Ionicons name="refresh" size={13} color="#FFFFFF" />
              <Text variant="caption" style={styles.retakeText}>
                Chụp lại
              </Text>
            </Pressable>
          </View>

          <View
            style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.panelHead}>
              <Text variant="heading">Kiểm tra vị trí</Text>
              {statusLabel ? (
                <View style={[styles.statusPill, { backgroundColor: colors.surfaceAlt }]}>
                  {suggestionStatus === 'reading' ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons name="sparkles" size={12} color={colors.accent} />
                  )}
                  <Text variant="caption" style={{ color: colors.accent }}>
                    {statusLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.gpsRow}>
              <Ionicons
                name={coords ? 'location' : 'location-outline'}
                size={13}
                color={coords ? colors.accent : colors.textMuted}
              />
              <Text variant="caption" muted>
                {coords ? 'Đã lấy vị trí GPS' : 'Không lấy được GPS, sẽ không có dẫn đường'}
              </Text>
            </View>

            {canQuickEdit(note) ? (
              <>
                <View style={styles.levelRow}>
                  {LEVELS.map((level) => {
                    const active = parts.level === level;
                    return (
                      <Pressable
                        key={level}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Tầng ${level}`}
                        onPress={() => chooseLevel(level)}
                        style={[
                          styles.levelChip,
                          {
                            backgroundColor: active ? colors.primary : colors.surfaceAlt,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={{ color: active ? colors.onPrimary : colors.text }}
                        >
                          {level}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <View style={styles.stepper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Giảm số cột"
                      onPress={() => stepPillar(-1)}
                      style={[styles.stepBtn, { borderColor: colors.border }]}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </Pressable>
                    <Text variant="button" style={styles.stepValue}>
                      {parts.pillar === null ? 'Số cột' : `Cột ${parts.pillar}`}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Tăng số cột"
                      onPress={() => stepPillar(1)}
                      style={[styles.stepBtn, { borderColor: colors.border }]}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
              </>
            ) : null}

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
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
                setSuggestionStatus('idle');
                editNote(text);
              }}
              maxLength={80}
            />
          </View>

          <PrimaryButton
            title={busy ? 'Đang lưu...' : 'Lưu vị trí'}
            onPress={save}
            disabled={busy}
          />
          <SecondaryButton title="Chụp ảnh khác" onPress={retake} disabled={busy} />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.camera}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <View style={styles.brackets} pointerEvents="none">
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <View style={styles.cameraHint} pointerEvents="none">
          <Text variant="caption" style={styles.cameraHintText}>
            Đưa số cột vào khung
          </Text>
        </View>
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
          <View style={[styles.shutterInner, { backgroundColor: colors.primary }]}>
            {busy ? <ActivityIndicator color={colors.onPrimary} /> : null}
          </View>
        </Pressable>
        <Text variant="caption" muted>
          Chạm để chụp
        </Text>
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
  priming: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  primingIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: { flex: 1, borderRadius: radius.card, overflow: 'hidden', backgroundColor: '#2B2724' },
  brackets: { position: 'absolute', top: 18, right: 18, bottom: 18, left: 18 },
  corner: { position: 'absolute', width: 26, height: 26, borderColor: 'rgba(255,255,255,0.9)' },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 10 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 10 },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  cameraHint: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 14, 0.5)',
  },
  cameraHintText: { color: '#FFFFFF' },
  shutterRow: { alignItems: 'center', gap: 6 },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: { padding: spacing.screen, gap: spacing.md },
  previewWrap: { borderRadius: radius.card, overflow: 'hidden' },
  preview: { width: '100%', height: 220 },
  retakeChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 14, 0.55)',
  },
  retakeText: { color: '#FFFFFF' },
  panel: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: spacing.sm,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -4 },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.xs },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto' },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { minWidth: 66, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    marginTop: spacing.xs,
  },
});
