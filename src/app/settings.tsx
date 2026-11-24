import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService } from '../container';
import { pickCurrent } from '../domain/current';
import { LEVEL_STYLES, LEVEL_STYLE_EXAMPLES, type LevelStyle } from '../domain/levelStyle';
import { RETENTION_OPTIONS, type Language, type RetentionDays } from '../domain/settings';
import { useParking } from '../hooks/useParking';
import { useSettings } from '../hooks/useSettings';
import { useI18n } from '../i18n';
import type { TranslationKey } from '../i18n/translations';
import { requestBackgroundLocation, syncGeofence } from '../native/geofence';
import { ensureNotificationPermission, syncReminders } from '../native/reminders';
import { TextButton } from '../ui/components/Button';
import { SegmentedTabs } from '../ui/components/SegmentedTabs';
import { Text } from '../ui/components/Text';
import { radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

const RETENTION_LABEL_KEYS: Record<RetentionDays, TranslationKey> = {
  7: 'settings.retention.7',
  30: 'settings.retention.30',
  60: 'settings.retention.60',
};

const LANGUAGE_KEYS: Record<Language, TranslationKey> = {
  system: 'settings.language.system',
  vi: 'settings.language.vi',
  en: 'settings.language.en',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, language, locale, setLanguage } = useI18n();
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
        Alert.alert(t('settings.reminders.deniedTitle'), t('settings.reminders.deniedBody'));
        return;
      }
    }
    const updated = await update({ remindersEnabled: next });
    const service = await getParkingService();
    const list = await service.list();
    if (updated.remindersEnabled) await syncReminders(list, Date.now(), locale);
    else await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async function toggleGeofence(next: boolean) {
    if (next) {
      const granted = await requestBackgroundLocation();
      if (!granted) {
        Alert.alert(t('settings.geofence.deniedTitle'), t('settings.geofence.deniedBody'));
        return;
      }
    }
    await update({ geofenceEnabled: next });
    await syncGeofence(pickCurrent(records), next);
  }

  function confirmDeleteAll() {
    Alert.alert(t('settings.data.confirmTitle'), t('settings.data.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.data.confirm'),
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            const service = await getParkingService();
            const removed = await service.deleteAll();
            await Notifications.cancelAllScheduledNotificationsAsync();
            await syncGeofence(null, false);
            await refresh();
            Alert.alert(
              t('settings.data.doneTitle'),
              t('settings.data.doneBody', { count: removed }),
            );
            router.back();
          } catch {
            Alert.alert(t('settings.data.errorTitle'), t('common.errorBody'));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">{t('settings.retention.title')}</Text>
        <Text variant="caption" muted>
          {t('settings.retention.body', { days: settings.retentionDays })}
        </Text>
        <SegmentedTabs
          options={RETENTION_OPTIONS.map((days) => ({
            value: String(days),
            label: t(RETENTION_LABEL_KEYS[days]),
          }))}
          value={String(settings.retentionDays)}
          onChange={changeRetention}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">{t('settings.language.title')}</Text>
        <Text variant="caption" muted>
          {t('settings.language.body')}
        </Text>
        <SegmentedTabs
          options={(Object.keys(LANGUAGE_KEYS) as Language[]).map((value) => ({
            value,
            label: t(LANGUAGE_KEYS[value]),
          }))}
          value={language}
          onChange={(value) => setLanguage(value as Language)}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">{t('settings.levelStyle.title')}</Text>
        <Text variant="caption" muted>
          {t('settings.levelStyle.body')}
        </Text>
        <View style={styles.styleRow}>
          {LEVEL_STYLES.map((style) => {
            const active = settings.levelStyle === style;
            return (
              <Pressable
                key={style}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={LEVEL_STYLE_EXAMPLES[style]}
                onPress={() => update({ levelStyle: style as LevelStyle })}
                style={[
                  styles.styleChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceAlt,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text variant="caption" style={{ color: active ? colors.onPrimary : colors.text }}>
                  {LEVEL_STYLE_EXAMPLES[style]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">{t('settings.reminders.title')}</Text>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text>{t('settings.reminders.expiry')}</Text>
            <Text variant="caption" muted>
              {t('settings.reminders.expiryBody')}
            </Text>
          </View>
          <Switch
            value={settings.remindersEnabled}
            onValueChange={toggleReminders}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel={t('settings.reminders.expiry')}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text>{t('capture.quickSave')}</Text>
            <Text variant="caption" muted>
              {t('capture.quickSaveHint')}
            </Text>
          </View>
          <Switch
            value={settings.quickSave}
            onValueChange={(next) => {
              void update({ quickSave: next });
            }}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel={t('capture.quickSave')}
          />
        </View>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text>{t('settings.reminders.geofence')}</Text>
            <Text variant="caption" muted>
              {t('settings.reminders.geofenceBody')}
            </Text>
          </View>
          <Switch
            value={settings.geofenceEnabled}
            onValueChange={toggleGeofence}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
            accessibilityLabel={t('settings.reminders.geofence')}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">{t('settings.onboarding.title')}</Text>
        <Text variant="caption" muted>
          {t('settings.onboarding.body')}
        </Text>
        <TextButton
          title={t('settings.onboarding.replay')}
          onPress={() => router.push('/onboarding')}
          style={styles.replay}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">{t('settings.data.title')}</Text>
        <Text variant="caption" muted>
          {t('settings.data.body')}
        </Text>
        <TextButton
          title={busy ? t('settings.data.deleting') : t('settings.data.deleteAll')}
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
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.xs },
  styleChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, gap: 2 },
  danger: { alignSelf: 'flex-start', marginTop: spacing.xs },
  replay: { alignSelf: 'flex-start' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
