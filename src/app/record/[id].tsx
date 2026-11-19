import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService, getPhotoFiles } from '../../container';
import { pickCurrent } from '../../domain/current';
import { daysLeft } from '../../domain/expiry';
import { historyStatus } from '../../domain/history';
import { useParking } from '../../hooks/useParking';
import { directionsUrl } from '../../native/directions';
import { dismissParkedNotification } from '../../native/parkedNotification';
import { GalleryPermissionDeniedError } from '../../services/ports';
import { IconButton, PrimaryButton, SecondaryButton, TextButton } from '../../ui/components/Button';
import { ExpiryBar } from '../../ui/components/ExpiryBar';
import { Text } from '../../ui/components/Text';
import { successFeedback, warningFeedback } from '../../ui/haptics';
import { fontFamilies, radius, spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { records, loaded, now, refresh } = useParking();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
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
  const isCurrent = pickCurrent(records)?.id === recordId;
  const status = historyStatus(record.expiresAt, now);
  const hasGps = record.lat !== null && record.lng !== null;
  const remaining = record.expiresAt !== null ? daysLeft(record.expiresAt, now) : null;

  async function keep() {
    if (busy) return;
    setBusy(true);
    try {
      await (await getParkingService()).keep(recordId);
      successFeedback();
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

  async function saveNote() {
    setSaving(true);
    try {
      await (await getParkingService()).updateNote(recordId, draft);
      await refresh();
      successFeedback();
      setEditing(false);
    } catch {
      Alert.alert('Không lưu được', 'Vui lòng thử lại.');
    } finally {
      setSaving(false);
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
          warningFeedback();
          if (wasCurrent) await dismissParkedNotification();
          setBusy(false);
          router.back();
        },
      },
    ]);
  }

  const badge = isCurrent
    ? { label: 'Đang đậu', backgroundColor: colors.primary, color: colors.onPrimary }
    : status.tone === 'danger'
      ? { label: status.label, backgroundColor: colors.dangerChip, color: colors.danger }
      : status.tone === 'primary'
        ? { label: status.label, backgroundColor: colors.chip, color: colors.onChip }
        : { label: status.label, backgroundColor: colors.surfaceAlt, color: colors.text };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.container, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      <View style={styles.photoWrap}>
        <Image
          source={{ uri }}
          style={styles.photo}
          contentFit="cover"
          accessible
          accessibilityLabel="Ảnh vị trí xe"
        />
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
            <Text
              variant="caption"
              style={{ color: badge.color, fontFamily: fontFamilies.semibold }}
            >
              {badge.label}
            </Text>
          </View>
          {remaining !== null && !isCurrent ? (
            <View style={styles.countdown}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text variant="caption" style={styles.countdownText}>
                còn {remaining} ngày
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.headBlock}>
        {editing ? (
          <View style={styles.editBlock}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus
              maxLength={80}
              accessibilityLabel="Sửa ghi chú vị trí xe"
              placeholder="Ví dụ: B2, cột 14"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
            />
            <View style={styles.editActions}>
              <TextButton title="Huỷ" onPress={() => setEditing(false)} disabled={saving} />
              <PrimaryButton
                title={saving ? 'Đang lưu…' : 'Lưu ghi chú'}
                onPress={saveNote}
                disabled={saving}
                style={styles.saveButton}
              />
            </View>
          </View>
        ) : (
          <View style={styles.noteRow}>
            <Text
              variant="display"
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={styles.noteText}
            >
              {record.note || 'Không có ghi chú'}
            </Text>
            <IconButton
              icon="pencil"
              size={38}
              accessibilityLabel="Sửa ghi chú"
              onPress={() => {
                setDraft(record.note);
                setEditing(true);
              }}
            />
          </View>
        )}
        <View style={styles.metaRow}>
          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
          <Text variant="caption" muted>
            Chụp lúc{' '}
            {new Date(record.createdAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="caption" muted>
          {record.expiresAt === null ? 'Đã giữ lại trong thư viện ảnh' : 'Hạn tự xoá'}
        </Text>
        <ExpiryBar expiresAt={record.expiresAt} now={now} />
        {hasGps ? (
          <View style={styles.metaRow}>
            <Ionicons name="location" size={13} color={colors.accent} />
            <Text variant="caption" muted>
              {record.lat!.toFixed(5)}, {record.lng!.toFixed(5)}
            </Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text variant="caption" muted>
              Không có toạ độ cho vị trí này
            </Text>
          </View>
        )}
      </View>

      {hasGps ? (
        <PrimaryButton
          title="Dẫn đường về xe"
          onPress={() =>
            Linking.openURL(directionsUrl(record.lat!, record.lng!)).catch(() =>
              Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
            )
          }
        />
      ) : null}
      {record.expiresAt !== null ? (
        <SecondaryButton title="Giữ lại" onPress={keep} disabled={busy} />
      ) : null}

      <View style={styles.dangerZone}>
        <TextButton title="Xoá ngay" tone="danger" onPress={confirmDelete} disabled={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.screen, gap: spacing.md },
  photoWrap: { borderRadius: radius.card, overflow: 'hidden' },
  photo: { width: '100%', height: 300 },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(20, 16, 14, 0.55)',
  },
  countdownText: { color: '#FFFFFF' },
  headBlock: { gap: 4 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noteText: { flex: 1 },
  editBlock: { gap: spacing.sm },
  editActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  saveButton: { paddingHorizontal: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 16,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dangerZone: { marginTop: spacing.lg, alignItems: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
