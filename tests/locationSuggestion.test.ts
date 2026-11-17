import { suggestLocationNote, toTextLines } from '../src/domain/locationSuggestion';

test('combines a level code line with a pillar keyword line', () => {
  // Given a pillar that shows "B2" on one line and "Cột 14" on another
  // When suggesting a note
  // Then it names the level and the pillar
  expect(suggestLocationNote(['B2', 'Cột 14'])).toBe('B2, cột 14');
});

test('reads level, zone and pillar from keyword lines in that order', () => {
  // Given three keyword lines given out of display order
  // When suggesting a note
  // Then the parts are always ordered level, zone, pillar
  expect(suggestLocationNote(['CỘT 21', 'KHU C', 'TẦNG 3'])).toBe('Tầng 3, khu C, cột 21');
});

test('reads several keywords from a single line', () => {
  // Given one line holding level, zone and pillar
  // When suggesting a note
  // Then all three are extracted
  expect(suggestLocationNote(['Tầng 2 - Zone A - Cột 7'])).toBe('Tầng 2, khu A, cột 7');
});

test('ignores case and Vietnamese diacritics', () => {
  // Given lowercase text without accents and an English keyword
  // When suggesting a note
  // Then it still matches
  expect(suggestLocationNote(['cot 14', 'ZONE d'])).toBe('khu D, cột 14');
});

test('uses a standalone letter and number line as the pillar when there is no keyword', () => {
  // Given a level code and a pillar written only as "A-12"
  // When suggesting a note
  // Then the second code becomes the pillar without a separator
  expect(suggestLocationNote(['B1', 'A-12'])).toBe('B1, A12');
});

test('treats a second level-style code as the pillar once the level is taken', () => {
  // Given two lines that both look like level codes
  // When suggesting a note
  // Then the first is the level and the second the pillar
  expect(suggestLocationNote(['B2', 'B14'])).toBe('B2, B14');
});

test('accepts spaces and hyphens inside standalone codes', () => {
  // Given codes written as "B 2" and "C - 14"
  // When suggesting a note
  // Then they are normalized
  expect(suggestLocationNote(['B 2', 'C - 14'])).toBe('B2, C14');
});

test('reads a level keyword with a basement word and a letter code', () => {
  // Given "TẦNG HẦM B2" and "LEVEL 4"
  // When suggesting a note
  // Then a letter code is kept as is and a bare number becomes "Tầng N"
  expect(suggestLocationNote(['TẦNG HẦM B2'])).toBe('B2');
  expect(suggestLocationNote(['LEVEL 4'])).toBe('Tầng 4');
});

test('reads a pillar keyword followed by a letter code', () => {
  // Given "PILLAR C-14"
  // When suggesting a note
  // Then the code is compacted
  expect(suggestLocationNote(['PILLAR C-14'])).toBe('cột C14');
});

test('keeps the first match of each kind', () => {
  // Given two pillar lines
  // When suggesting a note
  // Then only the first is used
  expect(suggestLocationNote(['COT 14', 'COT 15'])).toBe('cột 14');
});

test('does not treat codes inside longer lines as locations', () => {
  // Given a license plate and a sentence that contains "B2" but is not a code line
  // When suggesting a note
  // Then nothing is suggested
  expect(suggestLocationNote(['51A-123.45', 'EXIT B2 ONLY'])).toBeNull();
});

test('ignores noise, bare numbers and keywords without a value', () => {
  // Given advertising text, a total, a bare keyword and digit-only lines
  // When suggesting a note
  // Then nothing is suggested
  expect(suggestLocationNote(['GIU XE MAY MIEN PHI', 'Tổng 120', 'COT', '14', '2026'])).toBeNull();
});

test('returns null for empty input', () => {
  // Given no lines, and blank lines
  // When suggesting a note
  // Then nothing is suggested
  expect(suggestLocationNote([])).toBeNull();
  expect(suggestLocationNote(['', '   '])).toBeNull();
});

test('toTextLines splits blocks, handles CRLF, trims, drops empties and keeps order', () => {
  // Given OCR blocks holding several lines, with CRLF, padding and blank pieces
  // When splitting them into lines
  // Then each non-empty trimmed line is returned in order
  expect(toTextLines(['B2\nCột 14'])).toEqual(['B2', 'Cột 14']);
  expect(toTextLines(['A\r\nB', '  C  \n\n  \nD'])).toEqual(['A', 'B', 'C', 'D']);
  expect(toTextLines(['', '  '])).toEqual([]);
});

test('a multi-line OCR block still yields the level and pillar', () => {
  // Given Android-style blocks whose lines are joined with newlines
  // When splitting into lines before suggesting
  // Then the standalone level code is kept
  expect(suggestLocationNote(toTextLines(['B2\nCột 14']))).toBe('B2, cột 14');
  expect(suggestLocationNote(toTextLines(['B2\nA14']))).toBe('B2, A14');
});
