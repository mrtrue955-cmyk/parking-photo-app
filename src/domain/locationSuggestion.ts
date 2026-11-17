const MAX_LENGTH = 80;

// Keywords may appear anywhere in a line (the text is normalized first).
const LEVEL_KEYWORD = /\b(?:TANG|LEVEL|FLOOR)\s*(?:HAM\s*|BASEMENT\s*)?([BLP]?\d{1,2})\b/;
const ZONE_KEYWORD = /\b(?:KHU|ZONE|AREA)\s*[:.\-]?\s*([A-Z])\b/;
const PILLAR_KEYWORD = /\b(?:COT|PILLAR|COLUMN)\s*[:.\-]?\s*([A-Z]?\s?-?\s?\d{1,3})\b/;

// Standalone codes must be the WHOLE line, which keeps license plates and prose out.
const LEVEL_CODE = /^([BLP])\s?-?\s?(\d{1,2})$/;
const PILLAR_CODE = /^([A-Z])\s?-?\s?(\d{1,3})$/;

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

function formatLevel(captured: string): string {
  return /^[BLP]/.test(captured) ? captured : `Tầng ${captured}`;
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
    const levelMatch = LEVEL_KEYWORD.exec(line);
    if (levelMatch) {
      keywordMatched = true;
      if (level === null) level = formatLevel(levelMatch[1]);
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
    }
    if (keywordMatched) continue;

    const levelCode = LEVEL_CODE.exec(line);
    if (levelCode && level === null) {
      level = `${levelCode[1]}${levelCode[2]}`;
      continue;
    }
    const pillarCode = PILLAR_CODE.exec(line);
    if (pillarCode && pillar === null) pillar = `${pillarCode[1]}${pillarCode[2]}`;
  }

  const parts = [level, zone, pillar].filter((part): part is string => part !== null);
  if (parts.length === 0) return null;
  return parts.join(', ').slice(0, MAX_LENGTH);
}
