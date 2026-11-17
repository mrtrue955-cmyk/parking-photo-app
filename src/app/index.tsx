import { useRouter } from 'expo-router';
import { Alert, FlatList, Linking, StyleSheet, View } from 'react-native';
import { getParkingService, getPhotoFiles } from '../container';
import { historyOf, pickCurrent } from '../domain/current';
import { useParking } from '../hooks/useParking';
import { directionsUrl } from '../native/directions';
import { PrimaryButton, TextButton } from '../ui/components/Button';
import { HistoryRow } from '../ui/components/HistoryRow';
import { SpotCard } from '../ui/components/SpotCard';
import { Text } from '../ui/components/Text';
import { spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { records, loaded, refresh } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const history = historyOf(records);
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

  const header = current ? (
    <View style={styles.header}>
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
      <TextButton title="Chụp vị trí mới" onPress={() => router.push('/capture')} />
    </View>
  ) : (
    <View style={styles.empty}>
      <Text variant="body" muted style={styles.emptyText}>
        Chụp cây cột gần chỗ đậu. Ảnh tự xoá sau 30 ngày.
      </Text>
      <PrimaryButton title="Chụp vị trí xe" onPress={() => router.push('/capture')} />
    </View>
  );

  const centered = !current && history.length === 0;

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.list, centered ? styles.centered : null]}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          {header}
          {history.length > 0 ? (
            <Text variant="rowTitle" muted>
              Lịch sử
            </Text>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <HistoryRow
          record={item}
          photoUri={files.uriFor(item.photoPath)}
          now={now}
          onPress={() => openRecord(item.id)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { padding: spacing.screen, paddingBottom: spacing.xl },
  centered: { flexGrow: 1, justifyContent: 'center' },
  headerWrap: { gap: spacing.md, marginBottom: spacing.md },
  header: { gap: spacing.sm },
  empty: { gap: spacing.md },
  emptyText: { textAlign: 'center' },
  separator: { height: spacing.sm },
});
