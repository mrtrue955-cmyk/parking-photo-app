# Photo Location Suggestion (On-Device OCR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a parking photo is taken, read the text in it on the device and pre-fill the note field with a suggested location (for example "B2, cột 14") that the user can edit, so the parked-spot notification carries the location.

**Architecture:** A pure rule engine (`suggestLocationNote`) turns recognized text lines into a note. A thin native adapter wraps an on-device OCR library and never rejects. One function, `suggestNoteFromPhoto(uri)`, is the only seam the Capture screen uses (a future opt-in cloud provider can sit behind it). Capture runs it in the background after the photo is taken and fills the note only if the user has not typed anything.

**Tech Stack:** Expo SDK 58, `expo-text-extractor` (Apple Vision on iOS, Google ML Kit on Android; fallback candidates `expo-ocr-kit`, `expo-mlkit-ocr`), Jest (`jest-expo`).

**Spec:** `docs/superpowers/specs/2026-11-17-photo-location-suggestion-design.md`

## Global Constraints

- Everything runs on the device: no network code, no image leaves the phone.
- The suggestion is only text pre-filled in the note field. It never overwrites text the user typed (including after they cleared the field), never blocks "Lưu", and any failure, no result, or a result later than 5 seconds is silent.
- Rules favor precision over recall: a standalone code (like `B2` or `A12`) must be the WHOLE recognized line; keywords (tầng/level/floor, khu/zone/area, cột/pillar/column) may appear anywhere in a line. Diacritics are folded (`CỘT` = `COT`, `Đ` = `D`) and case is ignored.
- Output order: `{tầng}, {khu}, {cột}`, each kind taken from the first match; no match returns `null`; result cut to 80 characters (the note field limit).
- UI strings (Vietnamese, exact): `Đang đọc ảnh...` while reading, `Gợi ý từ ảnh, bạn có thể sửa` after a suggestion was filled. Nothing else is shown.
- Do not change services, the repository, `src/container.ts`, notification code, permission flows, or the logic of `takePhoto`, `askNotificationOnce`, `save`. The only edits to `capture.tsx` are the suggestion state, the call after the photo is taken, the retake reset, the note field's change handler, and the caption.
- React Compiler is enabled: no `useMemo`, `useCallback`, `React.memo`; every hook before any early return.
- Every test has `// Given`, `// When`, `// Then` comments. Code, identifiers, commit messages English.
- Stage only the files a task lists. Never `git add -A`. Never run `expo prebuild`, `expo run:*` or `expo config --type prebuild`. If a tool changes `app.json` or `package.json` beyond what a task says, revert that change with `git checkout <file>` before committing.
- The OCR library adds a native module: the user must rebuild the dev client (`npx expo run:ios --device`) after Task 2.

## File Structure

```
src/domain/locationSuggestion.ts    # suggestLocationNote (pure)
src/native/textRecognition.ts       # recognizeTextLines (OCR adapter, never rejects)
src/native/photoSuggestion.ts       # suggestNoteFromPhoto (the seam)
src/app/capture.tsx                 # background suggestion + caption
tests/locationSuggestion.test.ts
```

---

### Task 1: Location suggestion rules

**Files:**
- Create: `src/domain/locationSuggestion.ts`
- Test: `tests/locationSuggestion.test.ts`

**Interfaces:**
- Produces: `suggestLocationNote(lines: string[]): string | null`

- [ ] **Step 1: Write the failing tests**

`tests/locationSuggestion.test.ts`:

```ts
import { suggestLocationNote } from '../src/domain/locationSuggestion';

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
```

- [ ] **Step 2: Run to see them fail**

Run: `npm test -- locationSuggestion`
Expected: FAIL, cannot find module `../src/domain/locationSuggestion`.

- [ ] **Step 3: Implement**

`src/domain/locationSuggestion.ts`:

```ts
const MAX_LENGTH = 80;

// Keywords may appear anywhere in a line (the text is normalized first).
const LEVEL_KEYWORD = /\b(?:TANG|LEVEL|FLOOR)\s*(?:HAM\s*|BASEMENT\s*)?([BLP]?\d{1,2})\b/;
const ZONE_KEYWORD = /\b(?:KHU|ZONE|AREA)\s*[:.\-]?\s*([A-Z])\b/;
const PILLAR_KEYWORD = /\b(?:COT|PILLAR|COLUMN)\s*[:.\-]?\s*([A-Z]?\s?-?\s?\d{1,3})\b/;

// Standalone codes must be the WHOLE line, which keeps license plates and prose out.
const LEVEL_CODE = /^([BLP])\s?-?\s?(\d{1,2})$/;
const PILLAR_CODE = /^([A-Z])\s?-?\s?(\d{1,3})$/;

function normalize(line: string): string {
  return line
    .replace(/[đĐ]/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
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
```

- [ ] **Step 4: Verify and commit**

Run: `npm test` (all pass: the earlier 52 plus 13 new) and `npx tsc --noEmit` (exit 0). If a test fails, fix the implementation (not the expectation) unless an expectation is demonstrably inconsistent with the spec's rules; report any such change.

```bash
git add src/domain/locationSuggestion.ts tests/locationSuggestion.test.ts
git commit -m "feat: add location suggestion rules for recognized photo text"
```

---

### Task 2: OCR adapter and the suggestion seam

**Files:**
- Modify: `package.json`, `package-lock.json` (dependency)
- Create: `src/native/textRecognition.ts`, `src/native/photoSuggestion.ts`

**Interfaces:**
- Consumes: `suggestLocationNote` (Task 1).
- Produces: `recognizeTextLines(photoUri: string): Promise<string[]>` (never rejects, resolves `[]` on error, unsupported device, or after 5 seconds) and `suggestNoteFromPhoto(photoUri: string): Promise<string | null>` (never rejects).

These use a native module: verified by `tsc`, `expo export`, and on a device, not Jest.

- [ ] **Step 1: Verify and install the library**

Check `npm view expo-text-extractor version license peerDependencies time.modified` (expected 2.x, MIT, recent). Install with `npx expo install expo-text-extractor`. Then read the installed package (`node_modules/expo-text-extractor`: README, `build/*.d.ts`, `package.json`, the iOS Swift and Android Kotlin sources, and any `app.plugin.js`) and confirm and report:
- the exported API (expected: `extractTextFromImage(uri: string): Promise<string[]>` and a boolean `isSupported`); adapt the adapter below to the real names/signatures;
- that it accepts `file://` URIs such as the camera's temporary photo URI;
- which recognition language the iOS Vision code uses (Latin letters/digits are all we need; note whether Vietnamese diacritics are supported, but the rules fold diacritics so this is not blocking);
- whether a config plugin or any manual native setup is required (if the README documents a plugin that must be listed in `app.json`, add it and report; otherwise `app.json` must stay unchanged; revert any automatic `app.json` edit that is not required);
- that its Expo/React Native peer requirements are compatible with the installed SDK 58.

**If the library does not satisfy these requirements (no usable API, incompatible with SDK 58, or needs a manual native step you cannot make through config), STOP and report BLOCKED** with what you found; the fallback candidates are `expo-ocr-kit` and `expo-mlkit-ocr`, but switching needs the controller's decision.

- [ ] **Step 2: Adapter**

`src/native/textRecognition.ts` (adapt the import names to what Step 1 confirmed):

```ts
import { extractTextFromImage, isSupported } from 'expo-text-extractor';

const TIMEOUT_MS = 5_000;

/**
 * Reads the text lines in a photo on the device. Never rejects: any error, an
 * unsupported device, or a read that takes longer than 5 seconds resolves to [].
 */
export async function recognizeTextLines(photoUri: string): Promise<string[]> {
  try {
    if (!isSupported) return [];
    const result = await Promise.race([
      extractTextFromImage(photoUri),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), TIMEOUT_MS)),
    ]);
    return Array.isArray(result)
      ? result.filter((line): line is string => typeof line === 'string')
      : [];
  } catch (error) {
    console.warn('Failed to recognize text in the photo', error);
    return [];
  }
}
```

- [ ] **Step 3: The seam**

`src/native/photoSuggestion.ts`:

```ts
import { suggestLocationNote } from '../domain/locationSuggestion';
import { recognizeTextLines } from './textRecognition';

/**
 * The single entry point the Capture screen uses to get a note suggestion for a photo.
 * Never rejects. A future opt-in cloud provider can be added behind this function.
 */
export async function suggestNoteFromPhoto(photoUri: string): Promise<string | null> {
  try {
    return suggestLocationNote(await recognizeTextLines(photoUri));
  } catch (error) {
    console.warn('Failed to suggest a note from the photo', error);
    return null;
  }
}
```

- [ ] **Step 4: Verify and commit**

Run `npx expo export --platform ios --output-dir /tmp/parking-ocr-check` (must succeed; delete the directory afterwards; leave nothing in the repo), `npx tsc --noEmit` (exit 0), `npm test` (all pass). Do not add Jest tests that import the native module.

Device checks for the human: none yet (no visible effect until Task 3); note that the dev client must be rebuilt.

```bash
git add package.json package-lock.json src/native/textRecognition.ts src/native/photoSuggestion.ts
git commit -m "feat: add on-device text recognition adapter and photo suggestion seam"
```

(If the library required an `app.json` plugin entry, stage `app.json` as well and say so in the report.)

---

### Task 3: Capture screen integration

**Files:**
- Modify: `src/app/capture.tsx`, `README.md`

**Interfaces:**
- Consumes: `suggestNoteFromPhoto` (Task 2).

All existing capture logic stays exactly as it is (`takePhoto`, `askNotificationOnce`, `save`, permission branches, `busy`, `coords`, the notification post). Add only the behavior below.

- [ ] **Step 1: Suggestion state and flow**

In the component, above the early returns, add:

```tsx
const [suggestionStatus, setSuggestionStatus] = useState<'idle' | 'reading' | 'suggested'>('idle');
const suggestionRequest = useRef(0);
const noteEdited = useRef(false);
```

Add a function that starts a suggestion for a photo (called from `takePhoto` right after `setPhotoUri(photo.uri);`, not awaited so it never delays the preview; keep `takePhoto`'s existing try/catch/finally untouched):

```tsx
function suggestForPhoto(uri: string) {
  const requestId = ++suggestionRequest.current;
  setSuggestionStatus('reading');
  suggestNoteFromPhoto(uri).then((suggestion) => {
    // Ignore results for an older photo or after a retake/save.
    if (requestId !== suggestionRequest.current) return;
    if (suggestion && !noteEdited.current) {
      setNote(suggestion);
      setSuggestionStatus('suggested');
    } else {
      setSuggestionStatus('idle');
    }
  });
}
```

(`suggestNoteFromPhoto` never rejects, so no catch is needed.) Reset in `takePhoto` BEFORE starting a new suggestion is not necessary; the new request id invalidates old results.

Note field change handler (replace `onChangeText={setNote}`):

```tsx
onChangeText={(text) => {
  noteEdited.current = true;
  setNote(text);
  setSuggestionStatus('idle');
}}
```

"Chụp lại" handler (currently `setPhotoUri(null)`): invalidate any in-flight suggestion and reset the state: increment `suggestionRequest.current`, set `suggestionStatus` to `'idle'`; if the note was only an auto-filled suggestion (status was `'suggested'`) clear it with `setNote('')` and set `noteEdited.current = false`; if the user's own text is in the field keep it and set `noteEdited.current = true` when it is non-empty.

- [ ] **Step 2: Caption**

Directly under the note `TextInput`, render:

```tsx
{suggestionStatus !== 'idle' ? (
  <Text variant="caption" muted accessibilityLiveRegion="polite">
    {suggestionStatus === 'reading' ? 'Đang đọc ảnh...' : 'Gợi ý từ ảnh, bạn có thể sửa'}
  </Text>
) : null}
```

Import `suggestNoteFromPhoto` from `../native/photoSuggestion`. Do not change anything else (GPS caption, buttons, keyboard handling, styles other than any spacing the caption needs).

- [ ] **Step 3: README**

In `README.md` under Features add one bullet: "Suggests the location note from the photo (level, zone, pillar number) using on-device text recognition; the photo never leaves the phone." Keep it concise and English.

- [ ] **Step 4: Verify and commit**

Run `npx tsc --noEmit` (exit 0), `npm test` (all pass), and `npx expo export --platform ios --output-dir /tmp/parking-ocr-check2` (then delete the directory). Confirm with `git diff src/app/capture.tsx` that nothing inside `takePhoto`, `askNotificationOnce` or `save` changed except the single `suggestForPhoto(photo.uri)` call added in `takePhoto` after `setPhotoUri(photo.uri);`.

Device checks for the human (iOS, after rebuilding with `npx expo run:ios --device`):
1. Photograph a pillar with "B2" and "Cột 14": while reading, the caption "Đang đọc ảnh..." shows, then the note fills with "B2, cột 14" and the caption reads "Gợi ý từ ảnh, bạn có thể sửa". Save: the notification says "Xe bạn đang đậu ở B2, cột 14".
2. Photograph something without text: no note, no error, the caption disappears.
3. Start typing before the reading finishes: your text is never overwritten.
4. Tap "Chụp lại" after an auto-filled suggestion: the note is cleared and a new photo reads again; with your own typed text it is kept.
5. Turn on airplane mode: the suggestion still works.
6. Tap "Lưu" while the caption still says "Đang đọc ảnh...": it saves normally.

```bash
git add src/app/capture.tsx README.md
git commit -m "feat: suggest the location note from the photo on the capture screen"
```
