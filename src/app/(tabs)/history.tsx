import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPhotoFiles } from '../../container';
import { historyOf } from '../../domain/current';
import { filterHistory, type HistoryFilter } from '../../domain/history';
import { useParking } from '../../hooks/useParking';
import { EmptyState } from '../../ui/components/EmptyState';
import { HistoryCard } from '../../ui/components/HistoryCard';
import { SegmentedTabs } from '../../ui/components/SegmentedTabs';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

const OPTIONS: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'expiring', label: 'Sắp hết hạn' },
  { value: 'kept', label: 'Đã giữ lại' },
];

const EMPTY_TEXT: Record<HistoryFilter, string> = {
  all: 'Chưa có ảnh nào trong lịch sử.',
  expiring: 'Chưa có ảnh nào sắp hết hạn.',
  kept: 'Chưa có ảnh nào được giữ lại.',
};

export default function History() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records, loaded } = useParking();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const files = getPhotoFiles();
  const now = Date.now();

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  const visible = filterHistory(historyOf(records), filter, now);

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: bottomSpace },
      ]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text variant="title">Lịch sử</Text>
          <SegmentedTabs options={OPTIONS} value={filter} onChange={setFilter} />
        </View>
      }
      ListEmptyComponent={<EmptyState icon="time" text={EMPTY_TEXT[filter]} />}
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
  separator: { height: spacing.sm },
});
