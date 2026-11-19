import { useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService, getPhotoFiles } from '../../container';
import { historyOf, pickCurrent } from '../../domain/current';
import { useParking } from '../../hooks/useParking';
import { useSettings } from '../../hooks/useSettings';
import { useI18n } from '../../i18n';
import { directionsUrl } from '../../native/directions';
import { IconButton, TextButton } from '../../ui/components/Button';
import { CaptureCta } from '../../ui/components/CaptureCta';
import { EmptyState } from '../../ui/components/EmptyState';
import { HistoryCard } from '../../ui/components/HistoryCard';
import { SpotCard } from '../../ui/components/SpotCard';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { successFeedback } from '../../ui/haptics';
import { spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records, loaded, now, refresh } = useParking();
  const { settings } = useSettings();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const recent = historyOf(records).slice(0, 3);
  const retentionDays = settings?.retentionDays ?? 30;

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  function openRecord(id: string) {
    router.push({ pathname: '/record/[id]', params: { id } });
  }

  async function collect() {
    try {
      await (await getParkingService()).collectCurrent();
      successFeedback();
      await refresh();
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorBody'));
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        current ? null : styles.contentFill,
        { paddingTop: insets.top + spacing.md, paddingBottom: bottomSpace },
      ]}
    >
      <View style={styles.headerRow}>
        <Text variant="title">{t('tabs.home')}</Text>
        <IconButton
          icon="settings-outline"
          accessibilityLabel={t('home.settings')}
          onPress={() => router.push('/settings')}
        />
      </View>
      {current ? (
        <SpotCard
          record={current}
          photoUri={files.uriFor(current.photoPath)}
          now={now}
          onOpen={() => openRecord(current.id)}
          onNavigate={() =>
            Linking.openURL(directionsUrl(current.lat!, current.lng!)).catch(() =>
              Alert.alert(t('detail.mapErrorTitle'), t('detail.mapErrorBody')),
            )
          }
          onCollect={collect}
        />
      ) : (
        <View style={styles.emptyBlock}>
          <EmptyState
            icon="camera-outline"
            title={t('home.empty.title')}
            text={t('home.empty.text', { days: retentionDays })}
            steps={[
              t('home.empty.step.capture'),
              t('home.empty.step.save'),
              t('home.empty.step.expire'),
            ]}
            note={t('home.empty.note')}
          />
          <CaptureCta onPress={() => router.push('/capture')} />
        </View>
      )}
      {recent.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">{t('home.recent')}</Text>
            <TextButton title={t('home.seeAll')} onPress={() => router.push('/history')} />
          </View>
          {recent.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              photoUri={files.uriFor(record.photoPath)}
              now={now}
              onPress={() => openRecord(record.id)}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.screen, gap: spacing.md },
  contentFill: { flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyBlock: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  spacer: { flex: 0 },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
