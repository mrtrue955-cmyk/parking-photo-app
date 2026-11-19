import {
  formatLevelByStyle,
  isLevelToken,
  levelOptions,
  LEVEL_STYLES,
} from '../src/domain/levelStyle';

test('every style offers three quick picks', () => {
  for (const style of LEVEL_STYLES) {
    expect(levelOptions(style)).toHaveLength(3);
  }
});

test('quick picks follow the regional convention', () => {
  expect(levelOptions('B')).toEqual(['B1', 'B2', 'B3']);
  expect(levelOptions('F')).toEqual(['1F', '2F', '3F']);
  expect(levelOptions('P')).toEqual(['P1', 'P2', 'P3']);
  expect(levelOptions('L')).toEqual(['L1', 'L2', 'L3']);
  expect(levelOptions('G')).toEqual(['G', '1', '2']);
  expect(levelOptions('N')).toEqual(['-1', '-2', '-3']);
});

test('formats a floor number per style', () => {
  expect(formatLevelByStyle('B', 2)).toBe('B2');
  expect(formatLevelByStyle('F', 2)).toBe('2F');
  expect(formatLevelByStyle('P', 2)).toBe('P2');
  expect(formatLevelByStyle('L', 2)).toBe('L2');
  expect(formatLevelByStyle('G', 0)).toBe('G');
  expect(formatLevelByStyle('G', 2)).toBe('2');
  expect(formatLevelByStyle('N', 2)).toBe('-2');
});

test('an explicit basement keyword always wins over the style', () => {
  expect(formatLevelByStyle('F', 2, true)).toBe('B2');
  expect(formatLevelByStyle('N', 1, true)).toBe('B1');
});

test('recognises prefixed labels in any style', () => {
  for (const token of ['B2', 'b2', '1F', 'P3', 'L1', 'G', 'EG', 'RDC']) {
    expect(isLevelToken(token)).toBe(true);
  }
});

test('bare numbers are levels only for the G and N styles', () => {
  expect(isLevelToken('2', 'G')).toBe(true);
  expect(isLevelToken('-1', 'N')).toBe(true);
  expect(isLevelToken('2', 'B')).toBe(false);
  expect(isLevelToken('2', 'F')).toBe(false);
});

test('free text is never a level token', () => {
  expect(isLevelToken('cột')).toBe(false);
  expect(isLevelToken('chỗ quen')).toBe(false);
});
