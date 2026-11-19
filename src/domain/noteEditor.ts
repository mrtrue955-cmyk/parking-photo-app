const LEVEL_TOKEN = /\bB[123]\b/i;
const PILLAR_TOKEN = /\b(?:cột|pillar)\s*\d{1,3}\b/i;
const PILLAR_NUMBER = /\d{1,3}/;

export type NoteParts = { level: string | null; pillar: number | null };

export function parseNote(note: string): NoteParts {
  const levelMatch = LEVEL_TOKEN.exec(note);
  const pillarMatch = PILLAR_TOKEN.exec(note);
  const numberMatch = pillarMatch ? PILLAR_NUMBER.exec(pillarMatch[0]) : null;
  return {
    level: levelMatch ? levelMatch[0].toUpperCase() : null,
    pillar: numberMatch ? Number(numberMatch[0]) : null,
  };
}

/** True when the note already carries a level or pillar token, or is still empty. */
export function canQuickEdit(note: string): boolean {
  if (note.trim() === '') return true;
  const parts = parseNote(note);
  return parts.level !== null || parts.pillar !== null;
}

export function setLevel(note: string, level: string): string {
  if (LEVEL_TOKEN.test(note)) return note.replace(LEVEL_TOKEN, level);
  const trimmed = note.trim();
  return trimmed === '' ? level : `${level} · ${trimmed}`;
}

export function setPillar(note: string, pillar: number, word = 'cột'): string {
  const value = Math.max(1, Math.min(999, Math.round(pillar)));
  if (PILLAR_TOKEN.test(note)) return note.replace(PILLAR_TOKEN, `${word} ${value}`);
  const trimmed = note.trim();
  return trimmed === '' ? `${word} ${value}` : `${trimmed} · ${word} ${value}`;
}
