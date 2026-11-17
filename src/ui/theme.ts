import type { TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
  chip: string;
  onChip: string;
  danger: string;
  dangerChip: string;
  /** Legacy alias kept until the old screens are rewritten (removed in Task 10). */
  bay: string;
};

export const colors: Record<ColorScheme, Colors> = {
  light: {
    background: '#FBF7F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F3ECE0',
    text: '#2B2724',
    textMuted: '#6F675F',
    border: '#E9E1D4',
    primary: '#F5A524',
    onPrimary: '#2B2724',
    accent: '#9A5B00',
    chip: '#FDEBC8',
    onChip: '#2B2724',
    danger: '#B3261E',
    dangerChip: '#FBE0DD',
    bay: '#F5A524',
  },
  dark: {
    background: '#1E1B19',
    surface: '#2A2623',
    surfaceAlt: '#35302C',
    text: '#F5EFE6',
    textMuted: '#B3A99D',
    border: '#3E3833',
    primary: '#F5A524',
    onPrimary: '#2B2724',
    accent: '#F5A524',
    chip: '#4A3A1F',
    onChip: '#F5E3BE',
    danger: '#FF7A6B',
    dangerChip: '#4A2420',
    bay: '#F5A524',
  },
};

export const fontFamilies = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  /** Legacy alias kept until the old screens are rewritten (removed in Task 10). */
  condensed: 'BeVietnamPro_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamilies.bold, fontSize: 30, lineHeight: 38 },
  title: { fontFamily: fontFamilies.bold, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fontFamilies.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 24 },
  button: { fontFamily: fontFamilies.semibold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fontFamilies.medium, fontSize: 13, lineHeight: 18 },
  /** Legacy aliases kept until the old screens are rewritten (removed in Task 10). */
  sign: { fontFamily: fontFamilies.bold, fontSize: 30, lineHeight: 38 },
  rowTitle: { fontFamily: fontFamilies.semibold, fontSize: 18, lineHeight: 24 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, screen: 20 } as const;

export const radius = { card: 24, photo: 20, chip: 12, input: 16, pill: 999, tabBar: 32 } as const;
