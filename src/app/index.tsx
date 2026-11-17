import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { Alert, Button, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { getParkingService, getPhotoFiles } from '../container';
import { historyOf, pickCurrent } from '../domain/current';
import { daysLeft } from '../domain/expiry';
import type { ParkingRecord } from '../domain/types';
import { useParking } from '../hooks/useParking';
import { directionsUrl } from '../native/directions';

function timeAgo(from: number): string {
  const minutes = Math.floor((Date.now() - from) / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function expiryLabel(record: ParkingRecord): string {
  return record.expiresAt === null
    ? 'Đã giữ lại'
    : `Tự xoá sau ${daysLeft(record.expiresAt, Date.now())} ngày`;
}

export default function Home() {
  const router = useRouter();
  const { records, refresh } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const history = historyOf(records);

  async function collect() {
    try {
      await (await getParkingService()).collectCurrent();
      await refresh();
    } catch {
      Alert.alert('Có lỗi xảy ra', 'Vui lòng thử lại.');
    }
  }

  const header = current ? (
    <View style={styles.card}>
      <Text style={styles.title}>Xe đang ở đây</Text>
      <Link href={{ pathname: '/record/[id]', params: { id: current.id } }} asChild>
        <Pressable>
          <Image source={{ uri: files.uriFor(current.photoPath) }} style={styles.hero} contentFit="cover" />
        </Pressable>
      </Link>
      {current.note ? <Text style={styles.note}>{current.note}</Text> : null}
      <Text style={styles.meta}>Đã đậu {timeAgo(current.createdAt)}</Text>
      {current.lat !== null && current.lng !== null ? (
        <Button
          title="Dẫn đường về xe"
          onPress={() =>
            Linking.openURL(directionsUrl(current.lat!, current.lng!)).catch(() =>
              Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
            )
          }
        />
      ) : null}
      <Button title="Đã lấy xe" onPress={collect} />
    </View>
  ) : (
    <View style={styles.card}>
      <Button title="Chụp vị trí xe" onPress={() => router.push('/capture')} />
    </View>
  );

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          {header}
          {current ? <Button title="Chụp vị trí mới" onPress={() => router.push('/capture')} /> : null}
          <Text style={styles.section}>Lịch sử</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.meta}>Chưa có lịch sử.</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/record/[id]', params: { id: item.id } }} asChild>
          <Pressable style={styles.row}>
            <Image source={{ uri: files.uriFor(item.photoPath) }} style={styles.thumb} contentFit="cover" />
            <View style={styles.rowText}>
              <Text>{item.note || 'Không có ghi chú'}</Text>
              <Text style={styles.meta}>{expiryLabel(item)}</Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: { gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  title: { fontSize: 18, fontWeight: '600' },
  hero: { width: '100%', height: 220, borderRadius: 8 },
  note: { fontSize: 16 },
  meta: { color: '#666' },
  section: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  rowText: { flex: 1, gap: 2 },
});
