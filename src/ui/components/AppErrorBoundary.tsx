import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton } from './Button';

type Props = { error: Error; retry: () => Promise<void> };

/**
 * Rendered by expo-router when a route throws. Deliberately dependency-free and
 * bilingual: it may run outside the theme and i18n providers that the route expected.
 */
export function AppErrorBoundary({ error, retry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>!</Text>
      </View>
      <Text style={styles.title}>Đã có lỗi xảy ra</Text>
      <Text style={styles.subtitle}>Something went wrong</Text>
      <Text style={styles.body}>Dữ liệu của bạn vẫn an toàn trên máy. Thử lại để tiếp tục.</Text>
      <PrimaryButton title="Thử lại / Try again" onPress={() => void retry()} />
      {__DEV__ ? <Text style={styles.debug}>{error.message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 32,
    backgroundColor: '#FBF7F0',
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3ECE0',
    marginBottom: 6,
  },
  badgeText: { fontSize: 26, fontWeight: '800', color: '#9A5B00' },
  title: { fontSize: 20, fontWeight: '800', color: '#2B2724', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6F675F', textAlign: 'center' },
  body: {
    fontSize: 14,
    color: '#6F675F',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 10,
  },
  debug: { fontSize: 11, color: '#9A5B00', marginTop: 12, textAlign: 'center' },
});
