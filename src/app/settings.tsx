import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService } from '../container';
import { pickCurrent } from '../domain/current';
import { RETENTION_OPTIONS, type RetentionDays } from '../domain/settings';
import { useParking } from '../hooks/useParking';
import { useSettings } from '../hooks/useSettings';
import { requestBackgroundLocation, syncGeofence } from '../native/geofence';
import { ensureNotificationPermission, syncReminders } from '../native/reminders';
import { TextButton } from '../ui/components/Button';
import { SegmentedTabs } from '../ui/components/SegmentedTabs';
import { Text } from '../ui/components/Text';
import { radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

const RETENTION_CHOICES: { value: string; label: string }[] = RETENTION_OPTIONS.map((days) => ({
  value: String(days),
  label: days === 30 ? '1 tháng' : days === 60 ? '2 tháng' : `${days} ngày`,
}));

function retentionLabel(days: RetentionDays): string {
  return `Ảnh được giữ ${days} ngày kể từ lúc chụp, sau đó tự xoá khỏi máy.`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const { records, refresh } = useParking();
  const [busy, setBusy] = useState(false);

  if (!settings) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  async function changeRetention(value: string) {
    const days = Number(value) as RetentionDays;
    if (days === settings!.retentionDays) return;
    await update({ retentionDays: days });
    await refresh();
  }

  async function toggleReminders(next: boolean) {
    if (next) {
      const granted = await ensureNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Chưa bật thông báo',
          'Hãy cho phép thông báo trong Cài đặt của máy để app nhắc bạn trước khi ảnh bị xoá.',
        );
        return;
      }
    }
    const updated = await update({ remindersEnabled: next });
    const service = await getParkingService();
    const list = await service.list();
    if (updated.remindersEnabled) await syncReminders(list, Date.now());
    else await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async function toggleGeofence(next: boolean) {
    if (next) {
      const granted = await requestBackgroundLocation();
      if (!granted) {
        Alert.alert(
          'Cần quyền vị trí',
          'Để nhắc khi rời bãi đỗ, app cần quyền vị trí "Luôn cho phép". Bạn có thể bật lại trong Cài đặt của máy.',
        );
        return;
      }
    }
    await update({ geofenceEnabled: next });
    await syncGeofence(pickCurrent(records), next);
  }

  function confirmDeleteAll() {
    Alert.alert(
      'Xoá toàn bộ dữ liệu?',
      'Tất cả ảnh và vị trí đã lưu trên máy này sẽ bị xoá. Không thể hoàn tác.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá tất cả',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const service = await getParkingService();
              const removed = await service.deleteAll();
              await Notifications.cancelAllScheduledNotificationsAsync();
              await syncGeofence(null, false);
              await refresh();
              Alert.alert('Đã xoá', `${removed} vị trí đã được xoá khỏi máy.`);
              router.back();
            } catch {
              Alert.alert('Không xoá được', 'Vui lòng thử lại.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">Thời hạn giữ ảnh</Text>
        <Text variant="caption" muted>
          {retentionLabel(settings.retentionDays)}
        </Text>
        <SegmentedTabs
          options={RETENTION_CHOICES}
          value={String(settings.retentionDays)}
          onChange={changeRetention}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">Nhắc nhở</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text>Nhắc trước khi ảnh bị xoá</Text>
            <Text variant="caption" muted>
              Thông báo vào ngày trước hạn tự xoá.
            </Text>
          </View>
          <Switch
            value={settings.remindersEnabled}
            onValueChange={toggleReminders}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel="Nhắc trước khi ảnh bị xoá"
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text>Nhắc khi rời bãi đỗ</Text>
            <Text variant="caption" muted>
              Dùng vị trí nền, báo khi bạn rời chỗ đậu khoảng 400 m.
            </Text>
          </View>
          <Switch
            value={settings.geofenceEnabled}
            onValueChange={toggleGeofence}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel="Nhắc khi rời bãi đỗ"
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">Dữ liệu</Text>
        <Text variant="caption" muted>
          Không tài khoản, không cloud, không analytics. Mọi thứ chỉ nằm trên máy này.
        </Text>
        <TextButton
          title={busy ? 'Đang xoá…' : 'Xoá toàn bộ dữ liệu'}
          tone="danger"
          onPress={confirmDeleteAll}
          disabled={busy}
          style={styles.danger}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screen, gap: spacing.md },
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  rowText: { flex: 1, gap: 2 },
  danger: { alignSelf: 'flex-start', marginTop: spacing.xs },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
