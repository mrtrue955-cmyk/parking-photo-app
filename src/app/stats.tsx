import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { computeStats, formatDuration } from '../domain/stats';
import { useParking } from '../hooks/useParking';
import { useSettings } from '../hooks/useSettings';
import { useI18n } from '../i18n';
import { EmptyState } from '../ui/components/EmptyState';
import { Text } from '../ui/components/Text';
import { radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

export default function StatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const { records, loaded, now } = useParking();
  const { settings } = useSettings();

  if (!loaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const stats = computeStats(records, now, locale, {
    levelStyle: settings?.levelStyle ?? 'B',
  });
  const maxMonth = Math.max(1, ...stats.monthly.map((month) => month.count));

  if (stats.total === 0) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="bar-chart-outline"
          text={t('stats.empty')}
          actionTitle={t('home.cta.title')}
          onAction={() => router.push('/capture')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
    >
      <View style={styles.summaryRow}>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text variant="display">{stats.total}</Text>
          <Text variant="caption" muted>
            {t('stats.total')}
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text variant="display">{stats.thisMonth}</Text>
          <Text variant="caption" muted>
            {t('stats.thisMonth')}
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text variant="heading" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {stats.averageDurationMs === null
              ? '—'
              : formatDuration(stats.averageDurationMs, locale)}
          </Text>
          <Text variant="caption" muted>
            {t('stats.averageDuration')}
          </Text>
        </View>
      </View>

      {stats.collectedCount > 0 ? (
        <Text variant="caption" muted style={styles.hint}>
          {t('stats.averageHint', { count: stats.collectedCount })}
        </Text>
      ) : null}

      {stats.topLevels.length > 0 ? (
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text variant="heading">{t('stats.topLevels')}</Text>
          {stats.topLevels.map((entry) => (
            <View key={entry.level} style={styles.barRow}>
              <Text variant="caption" style={styles.barLabel}>
                {entry.level}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(entry.count / stats.topLevels[0].count) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" muted>
                {entry.count}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {stats.topHours.length > 0 ? (
        <View
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Text variant="heading">{t('stats.topHours')}</Text>
          {stats.topHours.map((entry) => (
            <View key={entry.hour} style={styles.barRow}>
              <Text variant="caption" style={styles.barLabel}>
                {t('stats.hourFormat', { hour: entry.hour })}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceAlt }]}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: colors.accent,
                      width: `${(entry.count / stats.topHours[0].count) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" muted>
                {entry.count}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="heading">{t('stats.monthly')}</Text>
        <View style={styles.monthRow}>
          {stats.monthly.map((month) => (
            <View key={month.key} style={styles.monthColumn}>
              <View style={[styles.monthTrack, { backgroundColor: colors.surfaceAlt }]}>
                <View
                  style={[
                    styles.monthBar,
                    {
                      height: `${Math.max(4, (month.count / maxMonth) * 100)}%`,
                      backgroundColor: month.count === 0 ? colors.border : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text variant="caption" muted numberOfLines={1}>
                {month.label}
              </Text>
              <Text variant="caption">{month.count}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screen, gap: spacing.md },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, padding: spacing.screen, justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
    gap: 2,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'space-between',
    minHeight: 96,
  },
  hint: { marginTop: -spacing.sm },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 52 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  monthColumn: { flex: 1, alignItems: 'center', gap: 4 },
  monthTrack: {
    width: '100%',
    height: 96,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  monthBar: { width: '100%', borderRadius: 8 },
});
