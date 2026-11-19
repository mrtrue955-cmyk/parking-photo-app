export const LEVEL_STYLES = ['B', 'F', 'P', 'L', 'G', 'N'] as const;
export type LevelStyle = (typeof LEVEL_STYLES)[number];

export const DEFAULT_LEVEL_STYLE: LevelStyle = 'B';

/** Short sample of each convention, used in the settings picker. */
export const LEVEL_STYLE_EXAMPLES: Record<LevelStyle, string> = {
  B: 'B1 · B2',
  F: '1F · 2F',
  P: 'P1 · P2',
  L: 'L1 · L2',
  G: 'G · 1 · 2',
  N: '-1 · -2',
};

/** Quick-pick labels for the capture screen, in display order. */
export function levelOptions(style: LevelStyle): string[] {
  switch (style) {
    case 'B':
      return ['B1', 'B2', 'B3'];
    case 'F':
      return ['1F', '2F', '3F'];
    case 'P':
      return ['P1', 'P2', 'P3'];
    case 'L':
      return ['L1', 'L2', 'L3'];
    case 'G':
      return ['G', '1', '2'];
    case 'N':
      return ['-1', '-2', '-3'];
  }
}

/** Renders a floor number the way the chosen region writes it. */
export function formatLevelByStyle(style: LevelStyle, floor: number, basement = false): string {
  if (basement) return `B${floor}`;
  switch (style) {
    case 'B':
      return `B${floor}`;
    case 'F':
      return `${floor}F`;
    case 'P':
      return `P${floor}`;
    case 'L':
      return `L${floor}`;
    case 'G':
      return floor === 0 ? 'G' : String(floor);
    case 'N':
      return `-${floor}`;
  }
}

const PREFIX_LEVEL = /^(?:[BLP]\d{1,2}|\d{1,2}F|EG|RDC|G)$/i;
const NUMERIC_LEVEL = /^-?[0-3]$/;

/** True when the token can stand on its own as a floor label of this style. */
export function isLevelToken(token: string, style: LevelStyle = DEFAULT_LEVEL_STYLE): boolean {
  const value = token.trim();
  if (PREFIX_LEVEL.test(value)) return true;
  return (style === 'G' || style === 'N') && NUMERIC_LEVEL.test(value);
}
