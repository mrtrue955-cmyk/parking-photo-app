import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPhotoFiles } from '../../container';
import { historyOf } from '../../domain/current';
import { filterHistory, type HistoryFilter } from '../../domain/history';
import { groupHistoryByDay } from '../../domain/historyGroups';
import { useParking } from '../../hooks/useParking';
import { useI18n } from '../../i18n';
import type { TranslationKey } from '../../i18n/translations';
import { TextButton } from '../../ui/components/Button';
import { EmptyState } from '../../ui/components/EmptyState';
import { HistoryCard } from '../../ui/components/HistoryCard';
import { SegmentedTabs } from '../../ui/components/SegmentedTabs';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

const FILTERS: { value: HistoryFilter; labelKey: TranslationKey }[] = [
  { value: 'all', labelKey: 'history.filter.all' },
  { value: 'expiring', labelKey: 'history.filter.expiring' },
  { value: 'kept', labelKey: 'history.filter.kept' },
];

const EMPTY_KEYS: Record<HistoryFilter, TranslationKey> = {
  all: 'history.empty.all',
  expiring: 'history.empty.expiring',
  kept: 'history.empty.kept',
};

export default function History() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, locale } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records, loaded, now } = useParking();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const files = getPhotoFiles();

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  const visible = filterHistory(historyOf(records), filter, now);
  const sections = groupHistoryByDay(visible, now, locale);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: bottomSpace },
      ]}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text variant="title">{t('history.title')}</Text>
            <TextButton title={t('stats.open')} onPress={() => router.push('/stats')} />
          </View>
          <SegmentedTabs
            options={FILTERS.map((item) => ({ value: item.value, label: t(item.labelKey) }))}
            value={filter}
            onChange={setFilter}
          />
        </View>
      }
      ListEmptyComponent={<EmptyState icon="time-outline" text={t(EMPTY_KEYS[filter])} />}
      stickySectionHeadersEnabled
      renderSectionHeader={({ section }) => (
        <Text
          variant="caption"
          muted
          style={[styles.sectionHeader, { backgroundColor: colors.background }]}
        >
          {section.label}
        </Text>
      )}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <HistoryCard
          record={item}
          photoUri={files.uriFor(item.photoPath)}
          now={now}
          onPress={() => router.push({ pathname: '/record/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.screen },
  header: { gap: spacing.md, marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader: { paddingVertical: spacing.sm, letterSpacing: 0.2 },
  separator: { height: spacing.sm },
});
