import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPhotoFiles } from '../../container';
import { historyOf } from '../../domain/current';
import { useParking } from '../../hooks/useParking';
import { HistoryRow } from '../../ui/components/HistoryRow';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { spacing } from '../../ui/theme';

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records } = useParking();
  const files = getPhotoFiles();
  const history = historyOf(records);
  const now = Date.now();

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: spacing.screen,
        paddingTop: insets.top + spacing.md,
        paddingBottom: bottomSpace,
      }}
      ListHeaderComponent={
        <Text variant="title" style={styles.title}>
          Lịch sử
        </Text>
      }
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <HistoryRow
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
  title: { marginBottom: spacing.md },
  separator: { height: spacing.sm },
});
