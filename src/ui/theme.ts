import type { TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  bay: string;
  danger: string;
};

export const colors: Record<ColorScheme, Colors> = {
  light: {
    background: '#E4E6E5',
    surface: '#F7F8F7',
    text: '#23272B',
    textMuted: '#5A6166',
    border: '#C9CDCC',
    primary: '#1550A0',
    onPrimary: '#FFFFFF',
    bay: '#F4C20D',
    danger: '#B3261E',
  },
  dark: {
    background: '#1B1E21',
    surface: '#252A2E',
    text: '#ECEEED',
    textMuted: '#A3AAAE',
    border: '#394046',
    primary: '#8DB6F5',
    onPrimary: '#0E1F3B',
    bay: '#F4C20D',
    danger: '#FF7A6B',
  },
};

export const fontFamilies = {
  condensed: 'BarlowCondensed_600SemiBold',
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
} as const;

export const typography = {
  sign: { fontFamily: fontFamilies.condensed, fontSize: 44, lineHeight: 48 },
  title: { fontFamily: fontFamilies.condensed, fontSize: 28, lineHeight: 32 },
  rowTitle: { fontFamily: fontFamilies.condensed, fontSize: 20, lineHeight: 24 },
  button: { fontFamily: fontFamilies.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamilies.regular, fontSize: 17, lineHeight: 24 },
  caption: { fontFamily: fontFamilies.regular, fontSize: 14, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, screen: 20 } as const;

export const radius = { card: 12, pill: 28 } as const;
