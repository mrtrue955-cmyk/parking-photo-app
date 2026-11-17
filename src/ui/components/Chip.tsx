import { StyleSheet, View } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

type Tone = 'neutral' | 'primary' | 'danger';

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const backgroundColor =
    tone === 'primary' ? colors.chip : tone === 'danger' ? colors.dangerChip : colors.surfaceAlt;
  const color = tone === 'primary' ? colors.onChip : tone === 'danger' ? colors.danger : colors.text;
  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.chip,
  },
});
