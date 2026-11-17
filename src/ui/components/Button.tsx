import { Pressable, StyleSheet } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

type BaseProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({ title, onPress, disabled, accessibilityLabel }: BaseProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: colors.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text variant="button" style={{ color: colors.onPrimary }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function TextButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  tone = 'primary',
}: BaseProps & { tone?: 'primary' | 'danger' }) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.text, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}
    >
      <Text variant="button" style={{ color }}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
