import { DEFAULT_LEVEL_STYLE, isLevelToken, type LevelStyle } from './levelStyle';

const PILLAR_TOKEN = /\b(?:cột|pillar)\s*\d{1,3}\b/i;
const PILLAR_NUMBER = /\d{1,3}/;
const SEPARATOR = ' · ';

export type NoteParts = { level: string | null; pillar: number | null };

function firstToken(note: string): string {
  const match = /^[^\s·,]+/.exec(note.trim());
  return match ? match[0] : '';
}

export function parseNote(note: string, style: LevelStyle = DEFAULT_LEVEL_STYLE): NoteParts {
  const trimmed = note.trim();
  const token = firstToken(trimmed);
  const pillarMatch = PILLAR_TOKEN.exec(trimmed);
  const numberMatch = pillarMatch ? PILLAR_NUMBER.exec(pillarMatch[0]) : null;
  return {
    level: token !== '' && isLevelToken(token, style) ? token.toUpperCase() : null,
    pillar: numberMatch ? Number(numberMatch[0]) : null,
  };
}

/** True when the note already carries a level or pillar token, or is still empty. */
export function canQuickEdit(note: string, style: LevelStyle = DEFAULT_LEVEL_STYLE): boolean {
  if (note.trim() === '') return true;
  const parts = parseNote(note, style);
  return parts.level !== null || parts.pillar !== null;
}

export function setLevel(
  note: string,
  level: string,
  style: LevelStyle = DEFAULT_LEVEL_STYLE,
): string {
  const trimmed = note.trim();
  if (trimmed === '') return level;
  const token = firstToken(trimmed);
  if (token !== '' && isLevelToken(token, style)) {
    return `${level}${trimmed.slice(token.length)}`;
  }
  return `${level}${SEPARATOR}${trimmed}`;
}

export function setPillar(note: string, pillar: number, word = 'cột'): string {
  const value = Math.max(1, Math.min(999, Math.round(pillar)));
  if (PILLAR_TOKEN.test(note)) return note.replace(PILLAR_TOKEN, `${word} ${value}`);
  const trimmed = note.trim();
  return trimmed === '' ? `${word} ${value}` : `${trimmed}${SEPARATOR}${word} ${value}`;
}
