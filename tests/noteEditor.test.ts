import { canQuickEdit, parseNote, setLevel, setPillar } from '../src/domain/noteEditor';

test('parses an OCR-suggested note', () => {
  expect(parseNote('B1 · cột 45')).toEqual({ level: 'B1', pillar: 45 });
});

test('parses a note without a level', () => {
  expect(parseNote('cột 12, gần thang máy')).toEqual({ level: null, pillar: 12 });
});

test('parses a lowercase and spaced note', () => {
  expect(parseNote('b2  cột  7')).toEqual({ level: 'B2', pillar: 7 });
});

test('returns nulls for free text', () => {
  expect(parseNote('chỗ quen thuộc')).toEqual({ level: null, pillar: null });
});

test('setLevel replaces the existing level token in place', () => {
  expect(setLevel('B1 · cột 45', 'B3')).toBe('B3 · cột 45');
});

test('setLevel prepends when the note has no level', () => {
  expect(setLevel('cột 45', 'B2')).toBe('B2 · cột 45');
  expect(setLevel('', 'B2')).toBe('B2');
});

test('setPillar replaces the pillar number in place', () => {
  expect(setPillar('B1 · cột 45', 46)).toBe('B1 · cột 46');
});

test('setPillar keeps the rest of a free-form note', () => {
  expect(setPillar('B1 · cột 45 gần thang máy', 7)).toBe('B1 · cột 7 gần thang máy');
});

test('setPillar clamps to a sensible range', () => {
  expect(setPillar('', 0)).toBe('cột 1');
  expect(setPillar('', 5000)).toBe('cột 999');
});

test('canQuickEdit only for empty or structured notes', () => {
  expect(canQuickEdit('')).toBe(true);
  expect(canQuickEdit('B1 · cột 45')).toBe(true);
  expect(canQuickEdit('cột 9')).toBe(true);
  expect(canQuickEdit('chỗ quen thuộc')).toBe(false);
});
