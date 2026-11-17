import { Text as RNText, type TextProps } from 'react-native';
import { typography, type TypographyVariant } from '../theme';
import { useTheme } from '../useTheme';

type Props = TextProps & { variant?: TypographyVariant; muted?: boolean };

export function Text({ variant = 'body', muted = false, style, ...rest }: Props) {
  const { colors } = useTheme();
  const large = variant === 'sign' || variant === 'title';
  return (
    <RNText
      maxFontSizeMultiplier={large ? 1.2 : 1.6}
      style={[typography[variant], { color: muted ? colors.textMuted : colors.text }, style]}
      {...rest}
    />
  );
}
