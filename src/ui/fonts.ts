import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed';
import { fontFamilies } from './theme';

export const fontAssets = {
  [fontFamilies.regular]: Barlow_400Regular,
  [fontFamilies.medium]: Barlow_500Medium,
  [fontFamilies.semibold]: Barlow_600SemiBold,
  [fontFamilies.condensed]: BarlowCondensed_600SemiBold,
};
