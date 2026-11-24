import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type BaseProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function opacityFor(disabled: boolean | undefined, pressed: boolean): number {
  if (disabled) return 0.5;
  return pressed ? 0.85 : 1;
}

function PillButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  style,
  backgroundColor,
  color,
}: BaseProps & { backgroundColor: string; color: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor, opacity: opacityFor(disabled, pressed) },
        style,
      ]}
    >
      <Text variant="button" style={{ color }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function PrimaryButton(props: BaseProps) {
  const { colors } = useTheme();
  return <PillButton {...props} backgroundColor={colors.primary} color={colors.onPrimary} />;
}

export function SecondaryButton(props: BaseProps) {
  const { colors } = useTheme();
  return <PillButton {...props} backgroundColor={colors.surfaceAlt} color={colors.text} />;
}

export function TextButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  style,
  tone = 'primary',
}: BaseProps & { tone?: 'primary' | 'danger' }) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.text, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }, style]}
    >
      <Text variant="button" style={{ color }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'surface',
  size = 44,
  disabled,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'surface' | 'primary';
  size?: number;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const backgroundColor = tone === 'primary' ? colors.primary : colors.surface;
  const iconColor = tone === 'primary' ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor: colors.border,
          borderWidth: tone === 'surface' ? StyleSheet.hairlineWidth : 0,
          opacity: opacityFor(disabled, pressed),
        },
        styles.center,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 52,
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
  center: { alignItems: 'center', justifyContent: 'center' },
});
