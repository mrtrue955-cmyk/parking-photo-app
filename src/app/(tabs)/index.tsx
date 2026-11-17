import { useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService, getPhotoFiles } from '../../container';
import { historyOf, pickCurrent } from '../../domain/current';
import { useParking } from '../../hooks/useParking';
import { directionsUrl } from '../../native/directions';
import { TextButton } from '../../ui/components/Button';
import { EmptyState } from '../../ui/components/EmptyState';
import { HistoryCard } from '../../ui/components/HistoryCard';
import { SpotCard } from '../../ui/components/SpotCard';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records, loaded, refresh } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const recent = historyOf(records).slice(0, 3);
  const now = Date.now();

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  function openRecord(id: string) {
    router.push({ pathname: '/record/[id]', params: { id } });
  }

  async function collect() {
    try {
      await (await getParkingService()).collectCurrent();
      await refresh();
    } catch {
      Alert.alert('Có lỗi xảy ra', 'Vui lòng thử lại.');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: bottomSpace },
      ]}
    >
      <Text variant="title">Xe của tôi</Text>
      {current ? (
        <SpotCard
          record={current}
          photoUri={files.uriFor(current.photoPath)}
          now={now}
          onOpen={() => openRecord(current.id)}
          onNavigate={() =>
            Linking.openURL(directionsUrl(current.lat!, current.lng!)).catch(() =>
              Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
            )
          }
          onCollect={collect}
        />
      ) : (
        <EmptyState
          icon="camera"
          text="Chụp cây cột gần chỗ đậu. Ảnh tự xoá sau 30 ngày."
          actionTitle="Chụp vị trí xe"
          onAction={() => router.push('/capture')}
        />
      )}
      {recent.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">Gần đây</Text>
            <TextButton title="Xem tất cả" onPress={() => router.push('/history')} />
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
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
