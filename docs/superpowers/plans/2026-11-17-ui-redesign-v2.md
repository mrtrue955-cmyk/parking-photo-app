# UI Redesign v2 (Amber, Charcoal, Warm White) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Parking Photo App UI after the user's reference screenshots, with an Amber + Charcoal + Warm White palette, a floating bottom tab bar (Xe của tôi, Chụp, Lịch sử), and light and dark themes, without changing data, services, permissions or notifications.

**Architecture:** Tokens (`theme.ts`) and a contrast helper stay pure and tested. Small React Native components in `src/ui/components/` consume them through `useTheme()`. Navigation becomes a root Stack containing a `(tabs)` group (custom floating tab bar) plus the full-screen `capture` and `record/[id]` routes with a custom header. Logic that can be tested without React Native (`filterHistory`, `historyStatus`) lives in `src/domain/history.ts`.

**Tech Stack:** Expo SDK 58, React Native, expo-router (Stack + Tabs), `@expo-google-fonts/be-vietnam-pro`, `@expo/vector-icons` (Ionicons), Jest (`jest-expo`).

**Spec:** `docs/superpowers/specs/2026-11-17-ui-redesign-v2-design.md` (supersedes `2026-11-17-ui-redesign-design.md`).

## Global Constraints

- UI only. Do NOT change `src/services`, `src/native`, `src/hooks/useParking.ts`, `src/container.ts`, permissions, notifications, or the logic of any screen (capture flow, keep/delete flow, collect, directions). Allowed non-UI additions: `src/domain/history.ts` (pure).
- Palette (light / dark): `background #FBF7F0 / #1E1B19`, `surface #FFFFFF / #2A2623`, `surfaceAlt #F3ECE0 / #35302C`, `text #2B2724 / #F5EFE6`, `textMuted #6F675F / #B3A99D`, `border #E9E1D4 / #3E3833`, `primary #F5A524 / #F5A524`, `onPrimary #2B2724 / #2B2724`, `accent #9A5B00 / #F5A524`, `chip #FDEBC8 / #4A3A1F`, `onChip #2B2724 / #F5E3BE`, `danger #B3261E / #FF7A6B`, `dangerChip #FBE0DD / #4A2420`. The contrast tests are the authority: if a pair fails, adjust only that hex minimally and report it.
- Amber (`primary`) is used only as a FILL (buttons, FAB, selected segment, expiry bar). Text on amber is `onPrimary` (charcoal). Accent text on light backgrounds is `accent`. `danger` only for "Xoá ngay", the near-expiry chip and the near-expiry bar.
- Font: Be Vietnam Pro only (400 Regular, 500 Medium, 600 SemiBold, 700 Bold). Variants: `display` 30/38 Bold, `title` 24/30 Bold, `heading` 18/24 SemiBold, `body` 16/24 Regular, `button` 16/24 SemiBold, `caption` 13/18 Medium. Max font scale 1.2 for `display`/`title`, 1.6 otherwise.
- Shapes: 8pt grid, screen margin 20, radius: card 24, photo 20, chip 12, input 16, pill 999, tab bar 32. Touch targets at least 48pt. Only the floating tab bar has a shadow.
- Refinement of the spec: in the tab bar the ACTIVE tab sits in a `chip` (light amber tint) circle with a charcoal icon; the center Chụp button is the only solid amber circle, so the two are never confused.
- React Compiler is enabled: no `useMemo`, `useCallback`, `React.memo` in components; every hook is called before any early return.
- UI copy Vietnamese, sentence case; keep existing strings unless this plan gives new ones. Code, identifiers and commit messages are English. Every test case has `// Given`, `// When`, `// Then` comments.
- Stage only the files a task lists. Never `git add -A`. Never run `expo prebuild`, `expo run:*` or `expo config --type prebuild`. If a tool changes `app.json` or `package.json` beyond what a task says, revert that change with `git checkout <file>` before committing.
- After adding, moving or removing route files, regenerate the typed-route declarations by running `npx expo export --platform ios --output-dir /tmp/parking-v2-check` (delete the directory afterwards), then run `npx tsc --noEmit`.

## File Structure

```
src/ui/
  contrast.ts                 # unchanged
  theme.ts                    # rewritten tokens
  fonts.ts                    # Be Vietnam Pro assets
  format.ts                   # unchanged
  useTheme.ts                 # unchanged
  components/
    Text.tsx                  # + display/heading variants
    Button.tsx                # PrimaryButton, SecondaryButton, TextButton, IconButton
    Chip.tsx                  # new
    SegmentedTabs.tsx         # new
    ScreenHeader.tsx          # new (round back button, centered title)
    EmptyState.tsx            # new
    TabBar.tsx                # new (floating, 3 slots)
    SpotCard.tsx              # rewritten
    HistoryCard.tsx           # new (replaces HistoryRow)
    ExpiryBar.tsx             # unchanged
src/domain/history.ts         # new: HistoryFilter, filterHistory, historyStatus
src/app/
  _layout.tsx                 # root Stack (headerShown false) + custom headers
  (tabs)/_layout.tsx          # Tabs with TabBar
  (tabs)/index.tsx            # Home (moved from src/app/index.tsx)
  (tabs)/history.tsx          # History
  capture.tsx
  record/[id].tsx
tests/contrast.test.ts        # rewritten
tests/history.test.ts         # new
```

---

### Task 1: Dependencies and font glyph check

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create (outside the repo): `/tmp/fontcheck/check.js`

**Interfaces:**
- Produces: `@expo-google-fonts/be-vietnam-pro` and `@expo/vector-icons` installed; the exact Be Vietnam Pro export names and the Ionicons glyph names used by this plan, confirmed from `node_modules`. The Barlow packages stay installed until Task 10.

- [ ] **Step 1: Install**

```bash
npx expo install @expo-google-fonts/be-vietnam-pro @expo/vector-icons
```

`git diff package.json app.json`: only dependency lines may change. If `expo install` added a plugin to `app.json`, revert it (`git checkout app.json`); fonts load at runtime and need no plugin.

- [ ] **Step 2: Confirm names**

Read `node_modules/@expo-google-fonts/be-vietnam-pro/index.d.ts` and confirm these exports: `BeVietnamPro_400Regular`, `BeVietnamPro_500Medium`, `BeVietnamPro_600SemiBold`, `BeVietnamPro_700Bold`. If a name differs, use the real one in all later tasks and say so in the report. Read `node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json` (or the Ionicons typings) and confirm these glyph names exist: `home`, `home-outline`, `time`, `time-outline`, `camera`, `arrow-back`. If one is missing, list the closest valid names in the report.

- [ ] **Step 3: Verify Vietnamese glyph coverage**

Locate the four `.ttf` files under `node_modules/@expo-google-fonts/be-vietnam-pro/` (400Regular, 500Medium, 600SemiBold, 700Bold).

```bash
mkdir -p /tmp/fontcheck && cd /tmp/fontcheck && npm init -y >/dev/null && npm install fontkit
```

`/tmp/fontcheck/check.js`:

```js
const fontkit = require('fontkit');
const files = process.argv.slice(2);
// All Vietnamese letters (lowercase and uppercase) with every tone mark, plus đ/Đ.
const text =
  'aàáảãạăằắẳẵặâầấẩẫậ eèéẻẽẹêềếểễệ iìíỉĩị oòóỏõọôồốổỗộơờớởỡợ uùúủũụưừứửữự yỳýỷỹỵ dđ ' +
  'AÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ EÈÉẺẼẸÊỀẾỂỄỆ IÌÍỈĨỊ OÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ UÙÚỦŨỤƯỪỨỬỮỰ YỲÝỶỸỴ DĐ';
let failed = false;
for (const file of files) {
  const font = fontkit.openSync(file);
  const missing = [...new Set([...text].filter((c) => c.trim()))].filter(
    (c) => !font.hasGlyphForCodePoint(c.codePointAt(0)),
  );
  console.log(file, missing.length === 0 ? 'OK' : 'MISSING: ' + missing.join(''));
  if (missing.length) failed = true;
}
process.exit(failed ? 1 : 0);
```

Run: `node /tmp/fontcheck/check.js <the four .ttf paths>`
Expected: every file prints `OK`, exit code 0. **If any glyph is missing: STOP and report BLOCKED** with the missing characters; do not commit.

- [ ] **Step 4: Clean up and commit**

```bash
rm -rf /tmp/fontcheck
npx tsc --noEmit && npm test
git add package.json package-lock.json
git commit -m "chore: add Be Vietnam Pro font and vector icons packages"
```

---

### Task 2: Tokens, fonts and Text variants

**Files:**
- Modify: `src/ui/theme.ts`, `src/ui/fonts.ts`, `src/ui/components/Text.tsx`
- Test: `tests/contrast.test.ts` (rewrite)

**Interfaces:**
- Consumes: `contrastRatio` from `src/ui/contrast.ts`; font export names from Task 1.
- Produces: `colors` with the new keys `surfaceAlt`, `accent`, `chip`, `onChip`, `dangerChip` plus the existing keys (new values); `fontFamilies` with `regular`, `medium`, `semibold`, `bold`; `typography` with `display`, `title`, `heading`, `body`, `button`, `caption`; `radius` with `card`, `photo`, `chip`, `input`, `pill`, `tabBar`; `spacing` unchanged.
- The old names `bay` (color), `sign` and `rowTitle` (typography) and `fontFamilies.condensed` remain as legacy aliases ONLY so the existing screens keep compiling until they are rewritten; Task 10 removes them.

- [ ] **Step 1: Rewrite the contrast test (fails first)**

`tests/contrast.test.ts`:

```ts
import { contrastRatio } from '../src/ui/contrast';
import { colors, type ColorScheme } from '../src/ui/theme';

const schemes: ColorScheme[] = ['light', 'dark'];

test('contrastRatio is 21 for black on white and 1 for identical colors', () => {
  // Given the two extreme pairs defined by the WCAG formula
  // When computing their contrast
  // Then black on white is 21:1 and a color against itself is 1:1, in either order
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  expect(contrastRatio('#F5A524', '#F5A524')).toBeCloseTo(1, 5);
});

describe.each(schemes)('%s theme contrast', (scheme) => {
  const c = colors[scheme];

  test('main text reaches 4.5:1 on every surface it is drawn on', () => {
    // Given the primary text color and the three surfaces it sits on
    // When computing each pair's contrast
    // Then all reach the WCAG AA threshold for normal text
    for (const surface of [c.background, c.surface, c.surfaceAlt]) {
      expect(contrastRatio(c.text, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('muted text reaches 4.5:1 on every surface it is drawn on', () => {
    // Given the muted text color and the three surfaces
    // When computing each pair's contrast
    // Then all reach AA
    for (const surface of [c.background, c.surface, c.surfaceAlt]) {
      expect(contrastRatio(c.textMuted, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('accent and danger text reach 4.5:1 on the page and card backgrounds', () => {
    // Given the accent (links) and danger (delete) colors
    // When computing their contrast on background and surface
    // Then both reach AA
    for (const surface of [c.background, c.surface]) {
      expect(contrastRatio(c.accent, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.danger, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('labels on amber buttons and on chips reach 4.5:1', () => {
    // Given the button label on the amber fill, the chip label on the chip fill,
    // and the danger text on its tinted chip
    // When computing each pair's contrast
    // Then all labels are readable
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.onChip, c.chip)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(c.danger, c.dangerChip)).toBeGreaterThanOrEqual(4.5);
  });
});
```

Run: `npm test -- contrast`
Expected: FAIL, because the theme does not have `surfaceAlt`/`accent`/`chip`/`onChip`/`dangerChip` yet (TypeScript or undefined color errors).

- [ ] **Step 2: Rewrite `src/ui/theme.ts`**

```ts
import type { TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
  chip: string;
  onChip: string;
  danger: string;
  dangerChip: string;
  /** Legacy alias kept until the old screens are rewritten (removed in Task 10). */
  bay: string;
};

export const colors: Record<ColorScheme, Colors> = {
  light: {
    background: '#FBF7F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F3ECE0',
    text: '#2B2724',
    textMuted: '#6F675F',
    border: '#E9E1D4',
    primary: '#F5A524',
    onPrimary: '#2B2724',
    accent: '#9A5B00',
    chip: '#FDEBC8',
    onChip: '#2B2724',
    danger: '#B3261E',
    dangerChip: '#FBE0DD',
    bay: '#F5A524',
  },
  dark: {
    background: '#1E1B19',
    surface: '#2A2623',
    surfaceAlt: '#35302C',
    text: '#F5EFE6',
    textMuted: '#B3A99D',
    border: '#3E3833',
    primary: '#F5A524',
    onPrimary: '#2B2724',
    accent: '#F5A524',
    chip: '#4A3A1F',
    onChip: '#F5E3BE',
    danger: '#FF7A6B',
    dangerChip: '#4A2420',
    bay: '#F5A524',
  },
};

export const fontFamilies = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  /** Legacy alias kept until the old screens are rewritten (removed in Task 10). */
  condensed: 'BeVietnamPro_700Bold',
} as const;

export const typography = {
  display: { fontFamily: fontFamilies.bold, fontSize: 30, lineHeight: 38 },
  title: { fontFamily: fontFamilies.bold, fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: fontFamilies.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamilies.regular, fontSize: 16, lineHeight: 24 },
  button: { fontFamily: fontFamilies.semibold, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: fontFamilies.medium, fontSize: 13, lineHeight: 18 },
  /** Legacy aliases kept until the old screens are rewritten (removed in Task 10). */
  sign: { fontFamily: fontFamilies.bold, fontSize: 30, lineHeight: 38 },
  rowTitle: { fontFamily: fontFamilies.semibold, fontSize: 18, lineHeight: 24 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, screen: 20 } as const;

export const radius = { card: 24, photo: 20, chip: 12, input: 16, pill: 999, tabBar: 32 } as const;
```

- [ ] **Step 3: Rewrite `src/ui/fonts.ts`**

```ts
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from '@expo-google-fonts/be-vietnam-pro';
import { fontFamilies } from './theme';

export const fontAssets = {
  [fontFamilies.regular]: BeVietnamPro_400Regular,
  [fontFamilies.medium]: BeVietnamPro_500Medium,
  [fontFamilies.semibold]: BeVietnamPro_600SemiBold,
  [fontFamilies.bold]: BeVietnamPro_700Bold,
};
```

- [ ] **Step 4: Update `src/ui/components/Text.tsx`**

Change only the `large` line so the display variants also cap at 1.2:

```tsx
  const large = variant === 'display' || variant === 'title' || variant === 'sign';
```

- [ ] **Step 5: Verify and commit**

Run: `npm test` (all pass, including the rewritten contrast tests; if a hex fails, adjust minimally and report) and `npx tsc --noEmit` (exit 0).

```bash
git add src/ui/theme.ts src/ui/fonts.ts src/ui/components/Text.tsx tests/contrast.test.ts
git commit -m "feat: add amber charcoal warm-white tokens and Be Vietnam Pro fonts"
```

---

### Task 3: History filtering and status logic

**Files:**
- Create: `src/domain/history.ts`
- Test: `tests/history.test.ts`

**Interfaces:**
- Consumes: `ParkingRecord` (`src/domain/types.ts`), `daysLeft`, `isExpiringSoon`, `DAY_MS` (`src/domain/expiry.ts`).
- Produces:
  - `type HistoryFilter = 'all' | 'expiring' | 'kept'`
  - `filterHistory(records: ParkingRecord[], filter: HistoryFilter, now: number): ParkingRecord[]`
  - `type HistoryStatus = { label: string; tone: 'primary' | 'danger' | 'neutral' }`
  - `historyStatus(expiresAt: number | null, now: number): HistoryStatus` (`'Đã giữ lại'` neutral; `'Sắp hết hạn'` danger when fewer than 4 days remain; otherwise `'còn N ngày'` primary)

- [ ] **Step 1: Write the failing tests**

`tests/history.test.ts`:

```ts
import { DAY_MS } from '../src/domain/expiry';
import { filterHistory, historyStatus } from '../src/domain/history';
import type { ParkingRecord } from '../src/domain/types';

const now = 1_000_000_000_000;

const rec = (id: string, expiresAt: number | null): ParkingRecord => ({
  id,
  photoPath: `${id}.jpg`,
  lat: null,
  lng: null,
  note: '',
  createdAt: now - DAY_MS,
  collectedAt: now - DAY_MS / 2,
  expiresAt,
});

const records = [
  rec('fresh', now + 20 * DAY_MS),
  rec('boundary', now + 4 * DAY_MS),
  rec('soon', now + 3 * DAY_MS),
  rec('today', now + DAY_MS / 2),
  rec('kept', null),
];

test('filterHistory "all" returns every record unchanged', () => {
  // Given a mix of fresh, expiring and kept records
  // When filtering with "all"
  // Then every record is returned in the same order
  expect(filterHistory(records, 'all', now).map((r) => r.id)).toEqual([
    'fresh', 'boundary', 'soon', 'today', 'kept',
  ]);
});

test('filterHistory "expiring" returns records with fewer than 4 days left, never kept ones', () => {
  // Given records 20, 4, 3 and under 1 days from expiry, and a kept one
  // When filtering with "expiring"
  // Then only the 3-day and the under-1-day records match; 4 days is not "soon"
  expect(filterHistory(records, 'expiring', now).map((r) => r.id)).toEqual(['soon', 'today']);
});

test('filterHistory "kept" returns only records that never expire', () => {
  // Given the same records
  // When filtering with "kept"
  // Then only the record with expiresAt null remains
  expect(filterHistory(records, 'kept', now).map((r) => r.id)).toEqual(['kept']);
});

test('filterHistory returns an empty array for an empty input', () => {
  // Given no records
  // When filtering with each filter
  // Then the result is empty and the input is not mutated
  const empty: ParkingRecord[] = [];
  expect(filterHistory(empty, 'all', now)).toEqual([]);
  expect(filterHistory(empty, 'expiring', now)).toEqual([]);
  expect(filterHistory(empty, 'kept', now)).toEqual([]);
  expect(empty).toEqual([]);
});

test('historyStatus describes kept, expiring and normal records', () => {
  // Given a kept record, one with 3 days left, one with 21 days left
  // When computing their status
  // Then kept is neutral, under 4 days is a danger "Sắp hết hạn", and the rest shows the day count
  expect(historyStatus(null, now)).toEqual({ label: 'Đã giữ lại', tone: 'neutral' });
  expect(historyStatus(now + 3 * DAY_MS, now)).toEqual({ label: 'Sắp hết hạn', tone: 'danger' });
  expect(historyStatus(now + 21 * DAY_MS, now)).toEqual({ label: 'còn 21 ngày', tone: 'primary' });
});
```

- [ ] **Step 2: Run to see it fail**

Run: `npm test -- history`
Expected: FAIL, cannot find module `../src/domain/history`.

- [ ] **Step 3: Implement**

`src/domain/history.ts`:

```ts
import { daysLeft, isExpiringSoon } from './expiry';
import type { ParkingRecord } from './types';

export type HistoryFilter = 'all' | 'expiring' | 'kept';

export function filterHistory(
  records: ParkingRecord[],
  filter: HistoryFilter,
  now: number,
): ParkingRecord[] {
  switch (filter) {
    case 'all':
      return records;
    case 'kept':
      return records.filter((r) => r.expiresAt === null);
    case 'expiring':
      return records.filter((r) => r.expiresAt !== null && isExpiringSoon(r.expiresAt, now));
  }
}

export type HistoryStatus = { label: string; tone: 'primary' | 'danger' | 'neutral' };

export function historyStatus(expiresAt: number | null, now: number): HistoryStatus {
  if (expiresAt === null) return { label: 'Đã giữ lại', tone: 'neutral' };
  if (isExpiringSoon(expiresAt, now)) return { label: 'Sắp hết hạn', tone: 'danger' };
  return { label: `còn ${daysLeft(expiresAt, now)} ngày`, tone: 'primary' };
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test` (all pass) and `npx tsc --noEmit` (exit 0).

```bash
git add src/domain/history.ts tests/history.test.ts
git commit -m "feat: add history filter and status logic"
```

---

### Task 4: Shared components (buttons, chip, segmented tabs, header, empty state)

**Files:**
- Modify: `src/ui/components/Button.tsx` (rewrite)
- Create: `src/ui/components/Chip.tsx`, `src/ui/components/SegmentedTabs.tsx`, `src/ui/components/ScreenHeader.tsx`, `src/ui/components/EmptyState.tsx`

**Interfaces:**
- Consumes: Task 2 tokens, `Text`, `useTheme`, `@expo/vector-icons` (Ionicons).
- Produces:
  - `PrimaryButton`, `SecondaryButton`: `{ title, onPress, disabled?, accessibilityLabel?, style? }`; `TextButton`: same plus `tone?: 'primary' | 'danger'`.
  - `type IconName`; `IconButton`: `{ icon: IconName, onPress, accessibilityLabel (required), tone?: 'surface' | 'primary', size?: number, disabled? }`.
  - `Chip`: `{ label, tone?: 'neutral' | 'primary' | 'danger' }`.
  - `SegmentedTabs<T extends string>`: `{ options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }`.
  - `ScreenHeader`: `{ title: string }`; exports `HEADER_CONTENT_HEIGHT` (64) and `useScreenHeaderHeight(): number` (top safe inset + 64).
  - `EmptyState`: `{ icon: IconName, text: string, actionTitle?: string, onAction?: () => void }`.

These are React Native components, verified by `tsc` and on a device, not by Jest. Existing screens keep using `PrimaryButton`/`TextButton` with the same props (they gain optional `style`).

- [ ] **Step 1: Buttons**

`src/ui/components/Button.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

export type IconName = ComponentProps<typeof Ionicons>['name'];

type BaseProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function opacityFor(disabled: boolean | undefined, pressed: boolean): number {
  if (disabled) return 0.5;
  return pressed ? 0.85 : 1;
}

function PillButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  style,
  backgroundColor,
  color,
}: BaseProps & { backgroundColor: string; color: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor, opacity: opacityFor(disabled, pressed) },
        style,
      ]}
    >
      <Text variant="button" style={{ color }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function PrimaryButton(props: BaseProps) {
  const { colors } = useTheme();
  return <PillButton {...props} backgroundColor={colors.primary} color={colors.onPrimary} />;
}

export function SecondaryButton(props: BaseProps) {
  const { colors } = useTheme();
  return <PillButton {...props} backgroundColor={colors.surfaceAlt} color={colors.text} />;
}

export function TextButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  style,
  tone = 'primary',
}: BaseProps & { tone?: 'primary' | 'danger' }) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.text, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }, style]}
    >
      <Text variant="button" style={{ color }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = 'surface',
  size = 44,
  disabled,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: 'surface' | 'primary';
  size?: number;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const backgroundColor = tone === 'primary' ? colors.primary : colors.surface;
  const iconColor = tone === 'primary' ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderColor: colors.border,
          borderWidth: tone === 'surface' ? StyleSheet.hairlineWidth : 0,
          opacity: opacityFor(disabled, pressed),
        },
        styles.center,
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.5)} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  text: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Chip**

`src/ui/components/Chip.tsx`:

```tsx
import { StyleSheet, View } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

type Tone = 'neutral' | 'primary' | 'danger';

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const { colors } = useTheme();
  const backgroundColor =
    tone === 'primary' ? colors.chip : tone === 'danger' ? colors.dangerChip : colors.surfaceAlt;
  const color = tone === 'primary' ? colors.onChip : tone === 'danger' ? colors.danger : colors.text;
  return (
    <View style={[styles.chip, { backgroundColor }]}>
      <Text variant="caption" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.chip,
  },
});
```

- [ ] **Step 3: SegmentedTabs**

`src/ui/components/SegmentedTabs.tsx`:

```tsx
import { Pressable, StyleSheet, View } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedTabs<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.row, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.item, selected ? { backgroundColor: colors.primary } : null]}
          >
            <Text variant="button" style={{ color: selected ? colors.onPrimary : colors.text }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 4, borderRadius: radius.pill },
  item: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 4: ScreenHeader**

`src/ui/components/ScreenHeader.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';
import { useTheme } from '../useTheme';
import { IconButton } from './Button';
import { Text } from './Text';

export const HEADER_CONTENT_HEIGHT = 64;

/** Full header height (top safe inset plus content), for keyboard offsets. */
export function useScreenHeaderHeight(): number {
  const insets = useSafeAreaInsets();
  return insets.top + HEADER_CONTENT_HEIGHT;
}

export function ScreenHeader({ title }: { title: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
      <View style={styles.row}>
        <IconButton icon="arrow-back" accessibilityLabel="Quay lại" onPress={goBack} />
        <Text variant="heading" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
  },
  title: { flex: 1, textAlign: 'center' },
  spacer: { width: 44 },
});
```

- [ ] **Step 5: EmptyState**

`src/ui/components/EmptyState.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../theme';
import { useTheme } from '../useTheme';
import { PrimaryButton, type IconName } from './Button';
import { Text } from './Text';

type Props = { icon: IconName; text: string; actionTitle?: string; onAction?: () => void };

export function EmptyState({ icon, text, actionTitle, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.circle, { backgroundColor: colors.primary }]}>
        <Ionicons name={icon} size={34} color={colors.onPrimary} />
      </View>
      <Text muted style={styles.text}>
        {text}
      </Text>
      {actionTitle && onAction ? (
        <PrimaryButton title={actionTitle} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  circle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  text: { textAlign: 'center', maxWidth: 280 },
  action: { alignSelf: 'stretch' },
});
```

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit` (exit 0; if an Ionicons name does not type-check, use the valid name confirmed in Task 1 and report it) and `npm test` (all pass).

```bash
git add src/ui/components/Button.tsx src/ui/components/Chip.tsx src/ui/components/SegmentedTabs.tsx src/ui/components/ScreenHeader.tsx src/ui/components/EmptyState.tsx
git commit -m "feat: add buttons, chip, segmented tabs, header and empty state components"
```

---

### Task 5: Navigation shell (root Stack, floating tab bar, tab screens)

**Files:**
- Create: `src/ui/components/TabBar.tsx`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/history.tsx`
- Move: `src/app/index.tsx` to `src/app/(tabs)/index.tsx` (use `git mv`; content unchanged in this task except its imports' relative paths)
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Consumes: Task 4 components, `useParking`, the old `HistoryRow` (used by the temporary History screen, replaced in Task 7).
- Produces: `TabBar` (exports `TAB_BAR_HEIGHT`, `useTabBarSpace(): number`, and the `TabBar` component taking `BottomTabBarProps`); route structure `(tabs)/index`, `(tabs)/history`, `capture`, `record/[id]`.

- [ ] **Step 1: TabBar**

Verify first that `BottomTabBarProps` is exported by `expo-router` (it is declared in `node_modules/expo-router/build/layouts/Tabs.d.ts`; confirm it is re-exported from the package root, else import it from `expo-router/react-navigation`). Do not import from a package that is not a top-level dependency.

`src/ui/components/TabBar.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type BottomTabBarProps } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';

export const TAB_BAR_HEIGHT = 72;
const TAB_BAR_BOTTOM_GAP = 12;
const TAB_BAR_CONTENT_GAP = 24;

/** Bottom space screens must reserve so content is not hidden behind the floating bar. */
export function useTabBarSpace(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_GAP + TAB_BAR_CONTENT_GAP + insets.bottom;
}

const TAB_ITEMS = {
  index: { label: 'Xe của tôi', icon: 'home', iconOff: 'home-outline' },
  history: { label: 'Lịch sử', icon: 'time', iconOff: 'time-outline' },
} as const;

type TabName = keyof typeof TAB_ITEMS;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const focusedName = state.routes[state.index]?.name;

  function renderTab(name: TabName) {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return null;
    const item = TAB_ITEMS[name];
    const focused = focusedName === name;

    function onPress() {
      const event = navigation.emit({
        type: 'tabPress',
        target: route!.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) navigation.navigate(route!.name, route!.params);
    }

    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: focused }}
        onPress={onPress}
        style={styles.tab}
      >
        <View style={[styles.tabCircle, focused ? { backgroundColor: colors.chip } : null]}>
          <Ionicons
            name={focused ? item.icon : item.iconOff}
            size={24}
            color={focused ? colors.onChip : colors.textMuted}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_BOTTOM_GAP }]}
    >
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {renderTab('index')}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chụp vị trí xe"
          onPress={() => router.push('/capture')}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name="camera" size={28} color={colors.onPrimary} />
        </Pressable>
        {renderTab('history')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.screen, right: spacing.screen, alignItems: 'center' },
  bar: {
    width: '100%',
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.tabBar,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tab: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  tabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Tabs layout**

`src/app/(tabs)/_layout.tsx` (check `node_modules` typings for the bottom-tabs option that sets the scene background: it is `sceneStyle` in React Navigation 7; use the name the installed typings define):

```tsx
import { Tabs } from 'expo-router';
import { TabBar } from '../../ui/components/TabBar';
import { useTheme } from '../../ui/useTheme';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Xe của tôi' }} />
      <Tabs.Screen name="history" options={{ title: 'Lịch sử' }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Move Home and fix its imports**

```bash
mkdir -p "src/app/(tabs)"
git mv src/app/index.tsx "src/app/(tabs)/index.tsx"
```

In `src/app/(tabs)/index.tsx` only update the relative imports (one more `../`): `'../container'` becomes `'../../container'`, `'../domain/current'` becomes `'../../domain/current'`, and likewise for `../hooks/useParking`, `../native/directions`, `../ui/...`. Change nothing else (the screen is rewritten in Task 6). The navigation calls `router.push('/capture')` and `router.push({ pathname: '/record/[id]', params: { id } })` stay valid because group names are not part of the URL.

- [ ] **Step 4: Temporary History screen (replaced by Task 7)**

`src/app/(tabs)/history.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPhotoFiles } from '../../container';
import { historyOf } from '../../domain/current';
import { useParking } from '../../hooks/useParking';
import { HistoryRow } from '../../ui/components/HistoryRow';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { spacing } from '../../ui/theme';

export default function History() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records } = useParking();
  const files = getPhotoFiles();
  const history = historyOf(records);
  const now = Date.now();

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: spacing.screen,
        paddingTop: insets.top + spacing.md,
        paddingBottom: bottomSpace,
      }}
      ListHeaderComponent={
        <Text variant="title" style={styles.title}>
          Lịch sử
        </Text>
      }
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <HistoryRow
          record={item}
          photoUri={files.uriFor(item.photoPath)}
          now={now}
          onPress={() => router.push({ pathname: '/record/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.md },
  separator: { height: spacing.sm },
});
```

- [ ] **Step 5: Root layout**

Replace the `<Stack ...>` block in `src/app/_layout.tsx` (keep the font gating, splash handling, `registerPurgeTask` effect and `<StatusBar style="auto" />` exactly as they are; remove now-unused imports such as `fontFamilies`):

```tsx
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="capture"
          options={{ headerShown: true, header: () => <ScreenHeader title="Chụp vị trí xe" /> }}
        />
        <Stack.Screen
          name="record/[id]"
          options={{ headerShown: true, header: () => <ScreenHeader title="Chi tiết" /> }}
        />
      </Stack>
```

Add `import { ScreenHeader } from '../ui/components/ScreenHeader';`.

- [ ] **Step 6: Regenerate typed routes, verify and commit**

Run `npx expo export --platform ios --output-dir /tmp/parking-v2-check` (must succeed; then `rm -rf /tmp/parking-v2-check`), then `npx tsc --noEmit` (exit 0) and `npm test` (all pass). Check `git status`: the old `src/app/index.tsx` is gone and nothing unexpected changed.

Verify in the typings that the Stack `header` option accepts a function returning an element for the installed native-stack, and that a custom header renders ABOVE the screen content (not overlaying it). If a route-group file named `(tabs)` needs quoting in shell commands, quote it.

```bash
git add src/ui/components/TabBar.tsx "src/app/(tabs)" src/app/_layout.tsx
git commit -m "feat: add floating tab bar navigation shell"
```

(`git add "src/app/(tabs)"` also stages the rename of `index.tsx`; confirm with `git status` that the deletion of `src/app/index.tsx` is staged.)

---

### Task 6: Home screen and cards

**Files:**
- Modify: `src/ui/components/SpotCard.tsx` (rewrite), `src/app/(tabs)/index.tsx` (rewrite)
- Create: `src/ui/components/HistoryCard.tsx`

**Interfaces:**
- Consumes: Task 3 `historyStatus`; Task 4 components; Task 5 `useTabBarSpace`; `formatTimeAgo`, `directionsUrl`, `useParking`, `getParkingService`, `getPhotoFiles`, `pickCurrent`, `historyOf`, `ExpiryBar`.
- Produces: `SpotCard` props `{ record, photoUri, now, onOpen, onNavigate, onCollect }`; `HistoryCard` props `{ record, photoUri, now, onPress }` (used by Home and, in Task 7, History).

- [ ] **Step 1: SpotCard**

`src/ui/components/SpotCard.tsx`:

```tsx
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ParkingRecord } from '../../domain/types';
import { formatTimeAgo } from '../format';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { PrimaryButton, SecondaryButton } from './Button';
import { Chip } from './Chip';
import { Text } from './Text';

type Props = {
  record: ParkingRecord;
  photoUri: string;
  now: number;
  onOpen: () => void;
  onNavigate: () => void;
  onCollect: () => void;
};

export function SpotCard({ record, photoUri, now, onOpen, onNavigate, onCollect }: Props) {
  const { colors } = useTheme();
  const hasGps = record.lat !== null && record.lng !== null;
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Mở chi tiết vị trí xe"
        onPress={onOpen}
      >
        <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
      </Pressable>
      <Chip label="Đang đậu" tone="primary" />
      {record.note ? (
        <Text variant="display" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <Text variant="caption" muted>
        Đậu {formatTimeAgo(record.createdAt, now)}
      </Text>
      <View style={styles.actions}>
        {hasGps ? (
          <>
            <SecondaryButton title="Đã lấy xe" onPress={onCollect} style={styles.secondary} />
            <PrimaryButton title="Dẫn đường về xe" onPress={onNavigate} style={styles.primary} />
          </>
        ) : (
          <PrimaryButton title="Đã lấy xe" onPress={onCollect} style={styles.primary} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    gap: spacing.sm,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  photo: { width: '100%', height: 200, borderRadius: radius.photo },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  secondary: { flex: 1 },
  primary: { flex: 1.5 },
});
```

- [ ] **Step 2: HistoryCard**

`src/ui/components/HistoryCard.tsx`:

```tsx
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { historyStatus } from '../../domain/history';
import type { ParkingRecord } from '../../domain/types';
import { formatTimeAgo } from '../format';
import { radius, spacing } from '../theme';
import { useTheme } from '../useTheme';
import { Chip } from './Chip';
import { ExpiryBar } from './ExpiryBar';
import { Text } from './Text';

type Props = { record: ParkingRecord; photoUri: string; now: number; onPress: () => void };

export function HistoryCard({ record, photoUri, now, onPress }: Props) {
  const { colors } = useTheme();
  const title = record.note || 'Không có ghi chú';
  const status = historyStatus(record.expiresAt, now);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${status.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Image source={{ uri: photoUri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.body}>
        <Chip label={status.label} tone={status.tone} />
        <Text variant="heading" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" muted>
          Đậu {formatTimeAgo(record.createdAt, now)}
        </Text>
        {record.expiresAt !== null ? <ExpiryBar expiresAt={record.expiresAt} now={now} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: { width: 88, height: 88, borderRadius: 16 },
  body: { flex: 1, gap: spacing.xs, justifyContent: 'center' },
});
```

- [ ] **Step 3: Home screen**

Replace `src/app/(tabs)/index.tsx`. Keep the `collect()` function and the `Linking.openURL(...).catch(...)` alert exactly as they are today.

```tsx
import { useRouter } from 'expo-router';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getParkingService, getPhotoFiles } from '../../container';
import { historyOf, pickCurrent } from '../../domain/current';
import { useParking } from '../../hooks/useParking';
import { directionsUrl } from '../../native/directions';
import { TextButton } from '../../ui/components/Button';
import { EmptyState } from '../../ui/components/EmptyState';
import { HistoryCard } from '../../ui/components/HistoryCard';
import { SpotCard } from '../../ui/components/SpotCard';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records, loaded, refresh } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const recent = historyOf(records).slice(0, 3);
  const now = Date.now();

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  function openRecord(id: string) {
    router.push({ pathname: '/record/[id]', params: { id } });
  }

  async function collect() {
    try {
      await (await getParkingService()).collectCurrent();
      await refresh();
    } catch {
      Alert.alert('Có lỗi xảy ra', 'Vui lòng thử lại.');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: bottomSpace },
      ]}
    >
      <Text variant="title">Xe của tôi</Text>
      {current ? (
        <SpotCard
          record={current}
          photoUri={files.uriFor(current.photoPath)}
          now={now}
          onOpen={() => openRecord(current.id)}
          onNavigate={() =>
            Linking.openURL(directionsUrl(current.lat!, current.lng!)).catch(() =>
              Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
            )
          }
          onCollect={collect}
        />
      ) : (
        <EmptyState
          icon="camera"
          text="Chụp cây cột gần chỗ đậu. Ảnh tự xoá sau 30 ngày."
          actionTitle="Chụp vị trí xe"
          onAction={() => router.push('/capture')}
        />
      )}
      {recent.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">Gần đây</Text>
            <TextButton title="Xem tất cả" onPress={() => router.push('/history')} />
          </View>
          {recent.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              photoUri={files.uriFor(record.photoPath)}
              now={now}
              onPress={() => openRecord(record.id)}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.screen, gap: spacing.md },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
```

- [ ] **Step 4: Verify and commit**

Run `npx tsc --noEmit` (exit 0; the typed `router.push('/history')` must resolve; if the group makes the href differ, use the type-checked form and report it) and `npm test` (all pass). The old `SpotCard`/`HistoryRow` usages elsewhere: `HistoryRow` is still used by the temporary History screen and is not touched here.

Device checks for the human (put them in the report): Home with a current spot (photo, "Đang đậu" chip, large note, two buttons; without GPS a single amber "Đã lấy xe"), Home with no spot (amber circle, text, "Chụp vị trí xe"), "Gần đây" with up to 3 cards and "Xem tất cả", the floating bar not covering the last card, dark mode.

```bash
git add src/ui/components/SpotCard.tsx src/ui/components/HistoryCard.tsx "src/app/(tabs)/index.tsx"
git commit -m "feat: redesign home screen with spot card and recent list"
```

---

### Task 7: History screen

**Files:**
- Modify: `src/app/(tabs)/history.tsx` (rewrite)

**Interfaces:**
- Consumes: `filterHistory`, `HistoryFilter` (Task 3); `SegmentedTabs`, `EmptyState`, `HistoryCard`, `useTabBarSpace`.

- [ ] **Step 1: Rewrite the screen**

`src/app/(tabs)/history.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPhotoFiles } from '../../container';
import { historyOf } from '../../domain/current';
import { filterHistory, type HistoryFilter } from '../../domain/history';
import { useParking } from '../../hooks/useParking';
import { EmptyState } from '../../ui/components/EmptyState';
import { HistoryCard } from '../../ui/components/HistoryCard';
import { SegmentedTabs } from '../../ui/components/SegmentedTabs';
import { useTabBarSpace } from '../../ui/components/TabBar';
import { Text } from '../../ui/components/Text';
import { spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

const OPTIONS: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'expiring', label: 'Sắp hết hạn' },
  { value: 'kept', label: 'Đã giữ lại' },
];

const EMPTY_TEXT: Record<HistoryFilter, string> = {
  all: 'Chưa có ảnh nào trong lịch sử.',
  expiring: 'Chưa có ảnh nào sắp hết hạn.',
  kept: 'Chưa có ảnh nào được giữ lại.',
};

export default function History() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomSpace = useTabBarSpace();
  const { records, loaded } = useParking();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const files = getPhotoFiles();
  const now = Date.now();

  if (!loaded) return <View style={[styles.fill, { backgroundColor: colors.background }]} />;

  const visible = filterHistory(historyOf(records), filter, now);

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: bottomSpace },
      ]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text variant="title">Lịch sử</Text>
          <SegmentedTabs options={OPTIONS} value={filter} onChange={setFilter} />
        </View>
      }
      ListEmptyComponent={<EmptyState icon="time" text={EMPTY_TEXT[filter]} />}
      ItemSeparatorComponent={Separator}
      renderItem={({ item }) => (
        <HistoryCard
          record={item}
          photoUri={files.uriFor(item.photoPath)}
          now={now}
          onPress={() => router.push({ pathname: '/record/[id]', params: { id: item.id } })}
        />
      )}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.screen },
  header: { gap: spacing.md, marginBottom: spacing.md },
  separator: { height: spacing.sm },
});
```

- [ ] **Step 2: Verify and commit**

Run `npx tsc --noEmit` (exit 0) and `npm test` (all pass).

Device checks for the human: three segments switch the list; each empty state shows its own text and icon; kept photos show the neutral "Đã giữ lại" chip; photos with fewer than 4 days show a red "Sắp hết hạn" chip and a red bar; the floating bar does not cover the last card; dark mode.

```bash
git add "src/app/(tabs)/history.tsx"
git commit -m "feat: redesign history screen with segmented filters"
```

---

### Task 8: Capture screen

**Files:**
- Modify: `src/app/capture.tsx` (restyle; logic unchanged)

**Interfaces:**
- Consumes: Task 4 components (`PrimaryButton`, `SecondaryButton`, `Text`), `useScreenHeaderHeight`; everything `capture.tsx` already imports.

ALL logic stays exactly as it is in the current file: `takePhoto`, `askNotificationOnce` (the Alert with its always-resolving promise), `save` (inner try/catch, `saved` flag, `router.back()` only after a successful save), the camera permission branches and `busy`. Only imports, JSX and styles change. The header is now provided by the Stack (`ScreenHeader`), so the keyboard offset uses `useScreenHeaderHeight()` instead of `useHeaderHeight()`.

- [ ] **Step 1: Rewrite imports, JSX and styles**

Keep the function bodies listed above verbatim and make these changes only:

1. Imports: remove `useHeaderHeight` and the old `Button` imports and the `BayFrame` import; add `PrimaryButton`, `SecondaryButton` from `../ui/components/Button` and `useScreenHeaderHeight` from `../ui/components/ScreenHeader`. Keep `useSafeAreaInsets`. Use `radius`, `spacing`, `fontFamilies` from `../ui/theme`.
2. Replace `const headerHeight = useHeaderHeight();` with `const headerHeight = useScreenHeaderHeight();` (same position, above the early returns).
3. Replace the JSX of the three render branches and the `styles` object with the following (the permission-loading branch keeps returning `<ActivityIndicator style={styles.center} color={colors.primary} />`; wrap it in a `View` with `backgroundColor: colors.background` and `styles.center` for a themed background):

Permission-denied branch:

```tsx
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.message}>App cần quyền camera để chụp vị trí xe.</Text>
        <PrimaryButton title="Cho phép camera" onPress={requestPermission} />
      </View>
    );
```

Preview branch (photo taken):

```tsx
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={headerHeight}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Image
          source={{ uri: photoUri }}
          style={styles.preview}
          contentFit="cover"
          accessible
          accessibilityLabel="Ảnh vừa chụp"
        />
        <Text variant="caption" muted>
          {coords ? 'Đã lấy vị trí GPS' : 'Không lấy được GPS, sẽ không có dẫn đường'}
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
          ]}
          placeholder="Ghi chú (ví dụ: B2, cột 14)"
          placeholderTextColor={colors.textMuted}
          cursorColor={colors.accent}
          selectionColor={colors.primary}
          accessibilityLabel="Ghi chú vị trí xe"
          value={note}
          onChangeText={setNote}
          maxLength={80}
        />
        <PrimaryButton title={busy ? 'Đang lưu...' : 'Lưu'} onPress={save} disabled={busy} />
        <SecondaryButton title="Chụp lại" onPress={() => setPhotoUri(null)} disabled={busy} />
      </KeyboardAvoidingView>
    );
```

Camera branch:

```tsx
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.camera}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      </View>
      <View style={[styles.shutterRow, { paddingBottom: spacing.sm + insets.bottom }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chụp"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={takePhoto}
          style={[styles.shutterOuter, { borderColor: colors.text, opacity: busy ? 0.5 : 1 }]}
        >
          <View style={[styles.shutterInner, { backgroundColor: colors.primary }]} />
        </Pressable>
      </View>
    </View>
  );
```

In the preview branch, keep the bottom safe-area handling the current file already has (it adds `insets.bottom` to the container's bottom padding): change the preview container's style to `[styles.container, { backgroundColor: colors.background, paddingBottom: spacing.screen + insets.bottom }]`. Styles:

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.screen, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  message: { textAlign: 'center' },
  camera: { flex: 1, borderRadius: radius.card, overflow: 'hidden' },
  preview: { flex: 1, borderRadius: radius.card },
  input: {
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
  },
  shutterRow: { alignItems: 'center' },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28 },
});
```

Keep the `Text` import (now from `../ui/components/Text`) for the message and caption. The text-only `Alert` strings and everything inside the logic functions stay as they are.

- [ ] **Step 2: Confirm logic unchanged, verify, commit**

Run `git diff src/app/capture.tsx` and confirm no changed lines inside `takePhoto`, `askNotificationOnce` or `save`. Run `npx tsc --noEmit` (exit 0) and `npm test` (all pass).

Device checks for the human: camera with a rounded viewfinder and an amber shutter in the thumb zone clear of the home indicator; after a shot the preview, GPS line, note field and the amber "Lưu" and grey "Chụp lại" buttons; the keyboard does not hide the buttons on iOS and Android; round back button and centered title in the header; camera-permission-denied state; dark mode.

```bash
git add src/app/capture.tsx
git commit -m "feat: redesign capture screen"
```

---

### Task 9: Detail screen

**Files:**
- Modify: `src/app/record/[id].tsx` (restyle; logic unchanged)

**Interfaces:**
- Consumes: Task 4 components, `Chip`, `ExpiryBar`, `historyStatus`; everything the file already imports.

ALL logic stays exactly as it is: `keep()` (busy guard, `GalleryPermissionDeniedError` vs generic alert split, `refresh()` then the 'Đã giữ lại' alert), `confirmDelete()` (the 'Huỷ'/'Xoá' Alert, busy handling, `router.back()` only after a successful delete), the `loaded` spinner and the not-found message, and `useTheme()`, `useSafeAreaInsets()` above the early returns. The header comes from the Stack (`ScreenHeader`).

- [ ] **Step 1: Restyle**

Keep the function bodies (`keep`, `confirmDelete`) verbatim. Replace imports (use `PrimaryButton`, `SecondaryButton`, `TextButton` from `../../ui/components/Button`, `Chip`, `ExpiryBar`, `Text`, `radius`, `spacing`, `historyStatus` from `../../domain/history`), and replace the final `return` and `styles` with:

```tsx
  const status = historyStatus(record.expiresAt, now);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: spacing.xl + insets.bottom },
      ]}
    >
      <Image
        source={{ uri }}
        style={styles.photo}
        contentFit="cover"
        accessible
        accessibilityLabel="Ảnh vị trí xe"
      />
      <Chip label={status.label} tone={status.tone} />
      {record.note ? (
        <Text variant="display" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <View style={[styles.info, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text variant="caption" muted>
          Chụp lúc {new Date(record.createdAt).toLocaleString('vi-VN')}
        </Text>
        <ExpiryBar expiresAt={record.expiresAt} now={now} />
        {record.lat !== null && record.lng !== null ? (
          <Text variant="caption" muted>
            Toạ độ: {record.lat.toFixed(5)}, {record.lng.toFixed(5)}
          </Text>
        ) : null}
      </View>
      {record.expiresAt !== null ? (
        <PrimaryButton title="Giữ lại" onPress={keep} disabled={busy} />
      ) : null}
      {record.lat !== null && record.lng !== null ? (
        <SecondaryButton
          title="Mở bản đồ"
          onPress={() =>
            Linking.openURL(directionsUrl(record.lat!, record.lng!)).catch(() =>
              Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
            )
          }
        />
      ) : null}
      <View style={styles.dangerZone}>
        <TextButton title="Xoá ngay" tone="danger" onPress={confirmDelete} disabled={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.screen, gap: spacing.md },
  photo: { width: '100%', height: 300, borderRadius: radius.card },
  info: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dangerZone: { marginTop: spacing.xl, alignItems: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

Keep the spinner branch returning `<ActivityIndicator style={styles.loading} color={colors.primary} />` wrapped so it has the themed background (`<View style={[styles.loading, { backgroundColor: colors.background }]}>`), and the not-found branch as it is. Import `View` from react-native, and keep `Linking`, `Alert`, `ScrollView`, `StyleSheet`, `ActivityIndicator`. `now` stays computed once as today.

- [ ] **Step 2: Confirm logic unchanged, verify, commit**

Run `git diff "src/app/record/[id].tsx"` and confirm no changed lines inside `keep` or `confirmDelete`. Run `npx tsc --noEmit` (exit 0) and `npm test` (all pass).

Device checks for the human: normal photo (status chip, large note, info card with the bar, amber "Giữ lại", grey "Mở bản đồ", red "Xoá ngay" separated at the bottom); kept photo (no "Giữ lại", neutral chip); photo without GPS (no map button or coordinates); spinner (no not-found flash); dark mode.

```bash
git add "src/app/record/[id].tsx"
git commit -m "feat: redesign detail screen"
```

---

### Task 10: Cleanup and final verification

**Files:**
- Delete: `src/ui/components/BayFrame.tsx`, `src/ui/components/HistoryRow.tsx`
- Modify: `src/ui/theme.ts` (remove legacy aliases), `src/ui/components/Text.tsx`, `package.json`, `package-lock.json`, `README.md`

- [ ] **Step 1: Remove unused code**

Confirm nothing imports `BayFrame` or `HistoryRow` (`grep -rn "BayFrame\|HistoryRow" src`), then `git rm` both files. In `theme.ts` remove the legacy aliases: the `bay` color (type and both themes), `fontFamilies.condensed`, and the `sign` and `rowTitle` typography entries. In `Text.tsx` change the `large` line to `variant === 'display' || variant === 'title'`. Run `grep -rn "colors.bay\|\.condensed\|'sign'\|'rowTitle'\|variant=\"sign\"\|variant=\"rowTitle\"" src` and fix any remaining use (there should be none after Tasks 6 to 9).

- [ ] **Step 2: Remove the Barlow packages**

```bash
npm uninstall @expo-google-fonts/barlow @expo-google-fonts/barlow-condensed
```

`git diff package.json`: only those two dependency lines are removed. Update `README.md`: the Stack line should mention Be Vietnam Pro, `@expo/vector-icons` and expo-router tabs (one line), and the layout block should list `src/ui/` and the `(tabs)` route group.

- [ ] **Step 3: Full verification**

Run, in order: `npx expo export --platform ios --output-dir /tmp/parking-v2-final` (must succeed; then `rm -rf /tmp/parking-v2-final`), `npx tsc --noEmit` (exit 0), `npm test` (all pass: the earlier tests plus the rewritten contrast tests and the new history tests), and `git status --short` (clean apart from the files of this task).

- [ ] **Step 4: Commit**

```bash
git add -A src package.json package-lock.json README.md
git commit -m "chore: remove legacy UI code and Barlow fonts"
```

(Here `git add -A src` is limited to the `src` directory so that deletions are staged; do not add anything else.)

- [ ] **Step 5: Report the human device checklist**

List for the human, light and dark: Home (current spot, empty), Lịch sử (three segments and empty states), Chụp, Chi tiết (normal, kept, no GPS), the floating tab bar (active state, amber center button, not covering content, clearing the home indicator and Android nav bar), keyboard on Capture, system text at the largest size, and correct Vietnamese diacritics in Be Vietnam Pro (for example the note "TẦNG HẦM B2, CỘT 14 Ở GẦN THANG MÁY").
