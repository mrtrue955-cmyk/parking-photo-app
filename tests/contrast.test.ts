import { contrastRatio } from '../src/ui/contrast';
import { colors, type ColorScheme } from '../src/ui/theme';

const schemes: ColorScheme[] = ['light', 'dark'];

test('contrastRatio is 21 for black on white and 1 for identical colors', () => {
  // Given the two extreme pairs defined by the WCAG formula
  // When computing their contrast
  // Then black on white is 21:1 and a color against itself is 1:1, in either order
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  expect(contrastRatio('#F5A524', '#F5A524')).toBeCloseTo(1, 5);
});

describe.each(schemes)('%s theme contrast', (scheme) => {
  const c = colors[scheme];

  test('main text reaches 4.5:1 on every surface it is drawn on', () => {
    // Given the primary text color and the three surfaces it sits on
    // When computing each pair's contrast
    // Then all reach the WCAG AA threshold for normal text
    for (const surface of [c.background, c.surface, c.surfaceAlt]) {
      expect(contrastRatio(c.text, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('muted text reaches 4.5:1 on every surface it is drawn on', () => {
    // Given the muted text color and the three surfaces
    // When computing each pair's contrast
    // Then all reach AA
    for (const surface of [c.background, c.surface, c.surfaceAlt]) {
      expect(contrastRatio(c.textMuted, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('accent and danger text reach 4.5:1 on the page and card backgrounds', () => {
    // Given the accent (links) and danger (delete) colors
    // When computing their contrast on background and surface
    // Then both reach AA
    for (const surface of [c.background, c.surface]) {
      expect(contrastRatio(c.accent, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.danger, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('labels on amber buttons and on chips reach 4.5:1', () => {
    // Given the button label on the amber fill, the chip label on the chip fill,
    // and the danger text on its tinted chip
    // When computing each pair's contrast
    // Then all labels are readable
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.onChip, c.chip)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.danger, c.dangerChip)).toBeGreaterThanOrEqual(4.5);
  });
});
