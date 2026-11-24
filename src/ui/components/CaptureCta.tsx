import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useI18n } from '../../i18n';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

type Props = { onPress: () => void };

/** The single call to action on the empty home screen. */
export function CaptureCta({ onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  return (
    <Animated.View entering={FadeInDown.delay(60).duration(220)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('home.cta.title')}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={[styles.tile, { backgroundColor: colors.chip }]}>
          <Ionicons name="camera" size={22} color={colors.onChip} />
        </View>
        <View style={styles.body}>
          <Text variant="button">{t('home.cta.title')}</Text>
          <Text variant="caption" muted style={styles.subtitle}>
            {t('home.cta.subtitle')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  subtitle: { lineHeight: 16 },
});
