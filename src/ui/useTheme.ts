import { useColorScheme } from 'react-native';
import { colors, radius, spacing, type ColorScheme } from './theme';

export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colors[scheme], spacing, radius };
}
