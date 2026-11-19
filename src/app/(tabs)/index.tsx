import { useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService, getPhotoFiles } from '../../container';
import { historyOf, pickCurrent } from '../../domain/current';
import { useParking } from '../../hooks/useParking';
import { directionsUrl } from '../../native/directions';
import { dismissParkedNotification } from '../../native/parkedNotification';
import { TextButton } from '../../ui/components/Button';
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
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records, loaded, now, refresh } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const recent = historyOf(records).slice(0, 3);

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  function openRecord(id: string) {
    router.push({ pathname: '/record/[id]', params: { id } });
  }

  async function collect() {
    try {
      await (await getParkingService()).collectCurrent();
      successFeedback();
      await dismissParkedNotification();
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
        current ? null : styles.contentFill,
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
        <View style={styles.emptyBlock}>
          <View style={styles.spacer} />
          <EmptyState
            icon="camera-outline"
            title="Chưa có vị trí nào"
            text="Chụp cây cột ở chỗ bạn đậu. App đọc tầng và số cột, ảnh tự xoá sau 30 ngày."
            steps={['Chụp cột', 'Lưu vị trí', 'Tự xoá']}
            note="Ảnh chỉ nằm trên máy này, không tải lên mạng."
          />
          <CaptureCta onPress={() => router.push('/capture')} />
        </View>
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
  contentFill: { flexGrow: 1 },
  emptyBlock: { flex: 1, justifyContent: 'center', gap: spacing.sm },
  spacer: { flex: 0 },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
