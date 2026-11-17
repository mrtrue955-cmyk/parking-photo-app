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

test('reads a three-digit-or-less B code as a pillar, not a level', () => {
  // Given "B14" (a pillar) and "B2" (a level) in either order
  // When suggesting a note
  // Then the level comes first and B14 is the pillar
  expect(suggestLocationNote(['B14', 'B2'])).toBe('B2, B14');
  expect(suggestLocationNote(['B14'])).toBe('B14');
});

test('reads "tầng hầm N" as basement N and keeps plain levels', () => {
  // Given a basement level keyword with a bare number, and plain keywords
  // When suggesting a note
  // Then the basement becomes B2 and the others stay "Tầng N"
  expect(suggestLocationNote(['Tầng hầm 2'])).toBe('B2');
  expect(suggestLocationNote(['BASEMENT FLOOR 3'])).toBe('Tầng 3');
  expect(suggestLocationNote(['FLOOR BASEMENT 3'])).toBe('B3');
  expect(suggestLocationNote(['TANG 2'])).toBe('Tầng 2');
});

test('reads basement signs without the word "tầng"', () => {
  // Given basement signs written "HẦM 2", "HẦM B2" and "BASEMENT 2"
  // When suggesting a note
  // Then each gives B2
  expect(suggestLocationNote(['HẦM 2'])).toBe('B2');
  expect(suggestLocationNote(['HẦM B2'])).toBe('B2');
  expect(suggestLocationNote(['BASEMENT 2'])).toBe('B2');
});

test('reads combined level and pillar labels on one line', () => {
  // Given labels like "B2-A14", "P2-C14", "B2-14", "B2 - 14", "B2/14" and "B2 14"
  // When suggesting a note
  // Then the level and the pillar are both taken
  expect(suggestLocationNote(['B2-A14'])).toBe('B2, A14');
  expect(suggestLocationNote(['P2-C14'])).toBe('P2, C14');
  expect(suggestLocationNote(['B2-14'])).toBe('B2, cột 14');
  expect(suggestLocationNote(['B2 - 14'])).toBe('B2, cột 14');
  expect(suggestLocationNote(['B2/14'])).toBe('B2, cột 14');
  expect(suggestLocationNote(['B2 14'])).toBe('B2, cột 14');
});

test('a combined label only fills empty slots', () => {
  // Given a level already found by a keyword and then a combined label
  // When suggesting a note
  // Then the first level is kept and the pillar comes from the label
  expect(suggestLocationNote(['TẦNG 3', 'B2-14'])).toBe('Tầng 3, cột 14');
});

test('ignores one trailing punctuation mark on standalone codes', () => {
  // Given codes followed by a period, colon or comma
  // When suggesting a note
  // Then they still match
  expect(suggestLocationNote(['B2.', 'C14.'])).toBe('B2, C14');
  expect(suggestLocationNote(['B2:'])).toBe('B2');
  expect(suggestLocationNote(['B2-14,'])).toBe('B2, cột 14');
});

test('takes a level token from a pillar keyword line', () => {
  // Given a level token before or after a pillar keyword
  // When suggesting a note
  // Then it becomes the level
  expect(suggestLocationNote(['B2 - Cột 14'])).toBe('B2, cột 14');
  expect(suggestLocationNote(['Cột 14 - B2'])).toBe('B2, cột 14');
  expect(suggestLocationNote(['Cột B2'])).toBe('cột B2');
});

test('tolerates a zero in place of the O of "cột"', () => {
  // Given OCR that read "C0T 14"
  // When suggesting a note
  // Then it is a pillar keyword
  expect(suggestLocationNote(['C0T 14'])).toBe('cột 14');
});

test('stays silent on look-alike text', () => {
  // Given direction signs, plates, times, years and exit signs
  // When suggesting a note
  // Then nothing is suggested
  for (const line of ['B1 B2', '51A-123.45', '30E-123.45', '12:30', 'B2-2026', 'B12-14', 'EXIT B2 ONLY', '120.000', '2026']) {
    expect(suggestLocationNote([line])).toBeNull();
  }
});

// Look-alike letters, written with escapes: Cyrillic Ve + Ze, and Cyrillic "SOT".
const CYRILLIC_B3 = 'ВЗ';
const CYRILLIC_COT = 'СОТ';

test('folds Cyrillic look-alikes into Latin letters and digits', () => {
  // Given Vision output that mixed Cyrillic Ve + Ze into a "B3" label, and a Cyrillic "COT" keyword
  // When suggesting a note
  // Then they behave like the Latin text
  expect(suggestLocationNote([CYRILLIC_B3])).toBe('B3');
  expect(suggestLocationNote([`${CYRILLIC_COT} 14`])).toBe('cột 14');
});

test('folds Greek look-alikes into Latin letters', () => {
  // Given a Greek Beta before "2" and a Greek Kappa starting "KHU C"
  // When suggesting a note
  // Then the Greek letters are read as their Latin twins
  expect(suggestLocationNote(['Β' + '2'])).toBe('B2');
  expect(suggestLocationNote(['Κ' + 'HU C'])).toBe('khu C');
});

test('does not fold letters that have no look-alike entry', () => {
  // Given a Cyrillic letter that is not in the look-alike table (Zhe) next to a digit
  // When suggesting a note
  // Then it is not turned into a Latin code
  expect(suggestLocationNote(['Ж' + '3'])).toBeNull();
});

test('reads a lone number as the pillar next to a unique lone letter', () => {
  // Given a zone letter repeated on several pillars and one pillar number
  // When suggesting a note
  // Then the letter and number form the pillar
  expect(suggestLocationNote(['D', 'D', 'D', 'D', '27'])).toBe('D27');
});

test('reads the real AEON garage photo as D27', () => {
  // Given the exact lines Apple Vision returned for the AEON photo
  // When suggesting a note
  // Then the repeated zone letter and the pillar number combine
  expect(
    suggestLocationNote(['ÆON MALL', 'KON MALL Sn Tim', 'D', 'D', 'D', 'D', '27']),
  ).toBe('D27');
});

test('reads the real orange pillar photo as level B3 and pillar 22', () => {
  // Given Vision output "22" and a Cyrillic-mixed "B3"
  // When suggesting a note
  // Then B3 is the level and the lone number is the pillar
  expect(suggestLocationNote(['22', CYRILLIC_B3])).toBe('B3, cột 22');
  expect(suggestLocationNote(['B3', '22'])).toBe('B3, cột 22');
});

test('keeps leading zeros and combines level, letter and number', () => {
  // Given a level, one letter and a zero-padded number
  // When suggesting a note
  // Then the pillar is letter + number as written
  expect(suggestLocationNote(['01', 'E', 'B1'])).toBe('B1, E01');
  expect(suggestLocationNote(['F', 'B1', '2'])).toBe('B1, F2');
});

test('uses "cột N" for a lone number when a zone keyword was found', () => {
  // Given a zone keyword, a lone letter and a lone number
  // When suggesting a note
  // Then the number is a plain pillar and the letter is not glued to it
  expect(suggestLocationNote(['KHU A', 'D', '27'])).toBe('khu A, cột 27');
});

test('does not read a lone number without another location signal', () => {
  // Given a number alone, a number with an excluded letter, or two different letters
  // When suggesting a note
  // Then nothing is suggested
  expect(suggestLocationNote(['27'])).toBeNull();
  expect(suggestLocationNote(['I', '27'])).toBeNull();
  expect(suggestLocationNote(['P', '27'])).toBeNull();
  expect(suggestLocationNote(['O', '27'])).toBeNull();
  expect(suggestLocationNote(['D', 'E', '27'])).toBeNull();
});

test('ignores four-digit numbers and ambiguous number sets', () => {
  // Given a year next to a level, and two different numbers next to a level
  // When suggesting a note
  // Then no pillar is invented
  expect(suggestLocationNote(['2026', 'B2'])).toBe('B2');
  expect(suggestLocationNote(['27', '16', 'B2'])).toBe('B2');
  expect(suggestLocationNote(['27', '27', 'B2'])).toBe('B2, cột 27');
});

test('stays silent on the real noise photos', () => {
  // Given the lines Vision returned for photos without a pillar label
  // When suggesting a note
  // Then nothing is suggested
  expect(suggestLocationNote(['LỐI VÀO', 'SAKURA STATION', 'SERENE', '640 × 480'])).toBeNull();
  expect(suggestLocationNote(['MEGATECH'])).toBeNull();
});
