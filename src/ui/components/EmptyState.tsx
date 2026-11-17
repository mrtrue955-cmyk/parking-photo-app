import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
import { useTheme } from '../useTheme';
import { PrimaryButton, type IconName } from './Button';
import { Text } from './Text';

type Props = { icon: IconName; text: string; actionTitle?: string; onAction?: () => void };

export function EmptyState({ icon, text, actionTitle, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: colors.primary }]}>
        <Ionicons name={icon} size={34} color={colors.onPrimary} />
      </View>
      <Text muted style={styles.text}>
        {text}
      </Text>
      {actionTitle && onAction ? (
        <PrimaryButton title={actionTitle} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  circle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center', maxWidth: 280 },
  action: { alignSelf: 'stretch' },
});
