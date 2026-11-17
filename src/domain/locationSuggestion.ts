const MAX_LENGTH = 80;

// Keywords may appear anywhere in a line (the text is normalized first).
const LEVEL_KEYWORD = /\b(?:TANG|LEVEL|FLOOR)\s*(?:(HAM|BASEMENT)\s*)?([BLP]?\d{1,2})\b/;
const BASEMENT_KEYWORD = /\b(?:HAM|BASEMENT)\s*[:.\-]?\s*B?(\d)\b/;
const ZONE_KEYWORD = /\b(?:KHU|ZONE|AREA)\s*[:.\-]?\s*([A-Z])\b/;
const PILLAR_KEYWORD = /\b(?:C[O0]T|PILLAR|COLUMN)\s*[:.\-]?\s*([A-Z]?\s?-?\s?\d{1,3})\b/;
// A level token next to a pillar keyword, e.g. "B2 - COT 14" or "COT 14 - B2".
const LEVEL_TOKEN = /(?:^|[\s\-/])([BL]\d)(?:$|[\s\-/])/;

// Standalone codes must be the WHOLE line (minus one trailing punctuation mark), which keeps
// license plates and prose out. Levels are one digit for B and P (so "B14" is a pillar).
const LEVEL_CODE = /^(?:([BP])\s?-?\s?(\d)|(L)\s?-?\s?(\d{1,2}))$/;
const PILLAR_CODE = /^([A-Z])\s?-?\s?(\d{1,3})$/;
// "B2-A14", "P2-C14", "B2-14", "B2 - 14", "B2/14".
const COMBINED_CODE = /^([BLP])\s?(\d)\s?[-/]\s?([A-Z])?\s?(\d{1,3})$/;
// "B2 14": digits only after the space, so a direction sign like "B1 B2" does not match.
const SPACED_COMBINED_CODE = /^([BLP])(\d) (\d{1,3})$/;

/**
 * OCR blocks can hold several lines joined with newlines (Android returns whole blocks), but
 * the rules work on single lines, so split, trim and drop empty pieces, keeping order.
 */
export function toTextLines(blocks: string[]): string[] {
  return blocks
    .flatMap((block) => block.split(/\r?\n/))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function normalize(line: string): string {
  return line
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function compactCode(code: string): string {
  return code.replace(/[\s-]/g, '');
}

function formatLevel(captured: string, basement: boolean): string {
  if (/^[BLP]/.test(captured)) return captured;
  return basement ? `B${captured}` : `Tầng ${captured}`;
}

/**
 * Turns the text lines recognized in a parking photo into a note like "B2, cột 14".
 * Favors precision over recall; returns null when nothing looks like a location.
 */
export function suggestLocationNote(lines: string[]): string | null {
  let level: string | null = null;
  let zone: string | null = null;
  let pillar: string | null = null;

  for (const raw of lines) {
    const line = normalize(raw);
    if (line === '') continue;

    let keywordMatched = false;
    let levelKeywordMatched = false;
    const levelMatch = LEVEL_KEYWORD.exec(line);
    const basementMatch = levelMatch ? null : BASEMENT_KEYWORD.exec(line);
    if (levelMatch) {
      keywordMatched = true;
      levelKeywordMatched = true;
      if (level === null) level = formatLevel(levelMatch[2], levelMatch[1] !== undefined);
    } else if (basementMatch) {
      keywordMatched = true;
      levelKeywordMatched = true;
      if (level === null) level = `B${basementMatch[1]}`;
    }
    const zoneMatch = ZONE_KEYWORD.exec(line);
    if (zoneMatch) {
      keywordMatched = true;
      if (zone === null) zone = `khu ${zoneMatch[1]}`;
    }
    const pillarMatch = PILLAR_KEYWORD.exec(line);
    if (pillarMatch) {
      keywordMatched = true;
      if (pillar === null) pillar = `cột ${compactCode(pillarMatch[1])}`;
      if (level === null && !levelKeywordMatched) {
        const token = LEVEL_TOKEN.exec(line.replace(pillarMatch[0], ' '));
        if (token) level = token[1];
      }
    }
    if (keywordMatched) continue;

    const code = line.replace(/[.:,;]$/, '');
    const combined = COMBINED_CODE.exec(code);
    if (combined) {
      if (level === null) level = `${combined[1]}${combined[2]}`;
      if (pillar === null) {
        pillar = combined[3] ? `${combined[3]}${combined[4]}` : `cột ${combined[4]}`;
      }
      continue;
    }
    const spaced = SPACED_COMBINED_CODE.exec(code);
    if (spaced) {
      if (level === null) level = `${spaced[1]}${spaced[2]}`;
      if (pillar === null) pillar = `cột ${spaced[3]}`;
      continue;
    }
    const levelCode = LEVEL_CODE.exec(code);
    if (levelCode && level === null) {
      level = levelCode[1] ? `${levelCode[1]}${levelCode[2]}` : `${levelCode[3]}${levelCode[4]}`;
      continue;
    }
    const pillarCode = PILLAR_CODE.exec(code);
    if (pillarCode && pillar === null) pillar = `${pillarCode[1]}${pillarCode[2]}`;
  }

  const parts = [level, zone, pillar].filter((part): part is string => part !== null);
  if (parts.length === 0) return null;
  return parts.join(', ').slice(0, MAX_LENGTH);
}
