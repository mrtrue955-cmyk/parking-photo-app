import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { PrimaryButton, type IconName } from './Button';
import { Text } from './Text';

type Props = {
  icon: IconName;
  text: string;
  title?: string;
  steps?: string[];
  note?: string;
  actionTitle?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, text, title, steps, note, actionTitle, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[styles.tile, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      {title ? (
        <Text variant="heading" style={styles.center}>
          {title}
        </Text>
      ) : null}
      <Text muted style={[styles.center, styles.text]}>
        {text}
      </Text>
      {steps && steps.length > 0 ? (
        <View style={styles.steps}>
          {steps.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={[styles.stepIndex, { backgroundColor: colors.chip }]}>
                <Text variant="caption" style={{ color: colors.onChip }}>
                  {index + 1}
                </Text>
              </View>
              <Text variant="caption" muted style={styles.center}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {note ? (
        <View style={styles.note}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
          <Text variant="caption" muted style={styles.noteText}>
            {note}
          </Text>
        </View>
      ) : null}
      {actionTitle && onAction ? (
        <PrimaryButton title={actionTitle} onPress={onAction} style={styles.action} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: { textAlign: 'center' },
  text: { maxWidth: 280 },
  steps: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, alignSelf: 'stretch' },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  stepIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.xs },
  noteText: { flexShrink: 1 },
  action: { alignSelf: 'stretch', marginTop: spacing.sm },
});
