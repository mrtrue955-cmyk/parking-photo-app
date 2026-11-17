import { contrastRatio } from '../src/ui/contrast';
import { colors, type ColorScheme } from '../src/ui/theme';

const schemes: ColorScheme[] = ['light', 'dark'];

test('contrastRatio is 21 for black on white and 1 for identical colors', () => {
  // Given the two extreme pairs defined by the WCAG formula
  // When computing their contrast
  // Then black on white is 21:1 and a color against itself is 1:1, in either order
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  expect(contrastRatio('#1550A0', '#1550A0')).toBeCloseTo(1, 5);
});

describe.each(schemes)('%s theme contrast', (scheme) => {
  const c = colors[scheme];

  test('text pairs reach 4.5:1 on the background and surface', () => {
    // Given the theme's text colors and the two surfaces they are drawn on
    // When computing each pair's contrast
    // Then all of them reach the WCAG AA threshold for normal text
    for (const surface of [c.background, c.surface]) {
      expect(contrastRatio(c.text, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.textMuted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.primary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.danger, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('button label on the primary color reaches 4.5:1', () => {
    // Given the primary button color and its label color
    // When computing their contrast
    // Then the label is readable
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
  });

  test('expiry bar fills reach 3:1 against the bar track', () => {
    // Given the track color and both fill colors the expiry bar can use
    // When computing their contrast
    // Then the fill is distinguishable from the track (WCAG non-text 3:1)
    expect(contrastRatio(c.primary, c.border)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.danger, c.border)).toBeGreaterThanOrEqual(3);
  });
});

test('the bay yellow is visible on the dark background', () => {
  // Given the yellow corner brackets can sit on the dark theme background
  // When computing the contrast against it
  // Then it reaches 3:1 (on the light theme the brackets overlay the photo instead)
  expect(contrastRatio(colors.dark.bay, colors.dark.background)).toBeGreaterThanOrEqual(3);
});
