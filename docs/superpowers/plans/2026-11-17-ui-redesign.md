# UI Redesign (Parking Garage Signage) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Parking Photo App UI (Home, Capture, Detail) in a parking-garage-signage style with light and dark themes, without changing data, services, permissions or flows.

**Architecture:** A pure token module (`theme.ts`) plus a WCAG contrast helper make the design system testable under Jest. Small React Native components in `src/ui/` (Text, buttons, BayFrame, ExpiryBar, SpotCard, HistoryRow) consume tokens through a `useTheme()` hook that follows the system color scheme. The three screens are rewritten on top of those components; all existing logic is kept verbatim.

**Tech Stack:** Expo SDK 58, React Native, expo-router, expo-font + `@expo-google-fonts/barlow` / `@expo-google-fonts/barlow-condensed`, Jest (`jest-expo`).

**Spec:** `docs/superpowers/specs/2026-11-17-ui-redesign-design.md`

## Prerequisite (controller, before Task 1)

`package.json` must have no uncommitted changes when Task 1 starts (the dependency install in Task 1 edits it and would otherwise sweep unrelated changes into its commit). Check with `git status --short`.

## Global Constraints

- Only the UI changes. Do NOT change `src/domain` behavior, `src/services`, `src/native`, `src/hooks`, `src/container.ts`, permissions, notifications or navigation flow. The only allowed non-UI additions are the two pure helpers in Task 3.
- Routes live in `src/app/`. Components live in `src/ui/`.
- React Compiler is enabled (`app.json` `experiments.reactCompiler`): do not use `useMemo`, `useCallback` or `React.memo` in new components.
- UI copy is Vietnamese and sentence case, with plain verbs. Keep the existing strings exactly unless this plan shows a new one. Code, identifiers and commit messages are English.
- Every test case has `// Given`, `// When`, `// Then` comments.
- Tokens (light / dark): `background #E4E6E5 / #1B1E21`, `surface #F7F8F7 / #252A2E`, `text #23272B / #ECEEED`, `textMuted #5A6166 / #A3AAAE`, `border #C9CDCC / #394046`, `primary #1550A0 / #8DB6F5`, `onPrimary #FFFFFF / #0E1F3B`, `bay #F4C20D / #F4C20D`, `danger #B3261E / #FF7A6B`. (`danger` light was darkened from the spec's `#C23B2E` to pass 4.5:1 on `background`; the contrast tests are the authority and a value may be adjusted minimally if a test shows it fails.)
- `bay` (yellow) is used ONLY for the corner brackets (BayFrame). `danger` is used only for "Xoá ngay" and for the expiry bar when fewer than 4 days remain.
- Type: Barlow Condensed SemiBold for `sign` (44/48), `title` (28/32), `rowTitle` (20/24); Barlow SemiBold for `button` (18/24); Barlow Regular for `body` (17/24) and `caption` (14/20). Max font scale 1.2 for `sign`/`title`, 1.6 for the rest.
- Layout: 8pt grid, screen margin 20, card/photo radius 12, button radius 28 (pill), no shadows, touch targets at least 48pt tall.
- `package.json` may be modified by Expo tooling (`expo run:*`): never `git add -A`; stage only the files a task lists.

## File Structure

```
src/ui/
  contrast.ts            # relativeLuminance, contrastRatio (pure)
  theme.ts               # colors, fontFamilies, typography, spacing, radius (pure)
  format.ts              # formatTimeAgo (pure)
  fonts.ts               # fontAssets map for useFonts
  useTheme.ts            # hook: scheme + tokens
  components/
    Text.tsx
    Button.tsx           # PrimaryButton, TextButton
    BayFrame.tsx
    ExpiryBar.tsx
    SpotCard.tsx
    HistoryRow.tsx
src/domain/expiry.ts     # + expiryFraction, isExpiringSoon, EXPIRY_WARN_DAYS
src/app/_layout.tsx      # fonts, splash, themed header
src/app/index.tsx        # Home
src/app/capture.tsx      # Capture
src/app/record/[id].tsx  # Detail
tests/contrast.test.ts
tests/format.test.ts
tests/expiry.test.ts     # + new cases
```

---

### Task 1: Font packages and Vietnamese glyph check

**Files:**
- Modify: `package.json`, `package-lock.json` (dependencies)
- Modify: `docs/superpowers/specs/2026-11-17-ui-redesign-design.md` (the "Phụ thuộc mới" section)
- Create (outside the repo): `/tmp/fontcheck/check.js` (throwaway)

**Interfaces:**
- Produces: the packages `@expo-google-fonts/barlow` and `@expo-google-fonts/barlow-condensed` installed, and the exact exported font names used by Task 4 (`Barlow_400Regular`, `Barlow_500Medium`, `Barlow_600SemiBold`, `BarlowCondensed_600SemiBold`), confirmed by reading `node_modules`.

- [ ] **Step 1: Install the packages**

```bash
npx expo install @expo-google-fonts/barlow @expo-google-fonts/barlow-condensed expo-font expo-splash-screen
```

Check `git diff package.json`: only dependency lines should change. `expo-font` and `expo-splash-screen` are already dependencies, so `expo install` should only confirm them.

- [ ] **Step 2: Confirm the exported names**

Read `node_modules/@expo-google-fonts/barlow/index.d.ts` and `node_modules/@expo-google-fonts/barlow-condensed/index.d.ts`. Confirm these four exports exist: `Barlow_400Regular`, `Barlow_500Medium`, `Barlow_600SemiBold`, `BarlowCondensed_600SemiBold`. If a name differs, use the real name everywhere in later tasks and say so in your report.

- [ ] **Step 3: Verify Vietnamese glyph coverage**

Install `fontkit` outside the project and check every font file the app will use. Locate the `.ttf` files under `node_modules/@expo-google-fonts/barlow/` and `.../barlow-condensed/` (for example `400Regular/Barlow_400Regular.ttf`, `500Medium/Barlow_500Medium.ttf`, `600SemiBold/Barlow_600SemiBold.ttf`, `600SemiBold/BarlowCondensed_600SemiBold.ttf`).

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
Expected: every file prints `OK` and the exit code is 0.

**If any glyph is missing: STOP and report BLOCKED** with the missing characters. Do not continue to Task 2: the fallback (Be Vietnam Pro) changes the font names throughout the plan and needs the controller's decision.

- [ ] **Step 4: Correct the spec**

In the spec's "Phụ thuộc mới" section, replace the sentence about rebuilding the native app with: "Không cần build native lại: `expo-font` đã nằm trong bản build hiện tại và font được nạp lúc chạy bằng `useFonts`." Keep the rest.

In the spec's "Xử lý lỗi và trường hợp biên" section, replace the bullet that starts with "Ảnh không tải được" with: "Ảnh thiếu file: bản ghi bị dọn tự động khi mở app (hành vi hiện có), nên không cần giao diện riêng."

- [ ] **Step 5: Clean up and commit**

```bash
rm -rf /tmp/fontcheck
git add package.json package-lock.json docs/superpowers/specs/2026-11-17-ui-redesign-design.md
git commit -m "chore: add Barlow font packages"
```

---

### Task 2: Contrast helper and theme tokens

**Files:**
- Create: `src/ui/contrast.ts`, `src/ui/theme.ts`
- Test: `tests/contrast.test.ts`

**Interfaces:**
- Produces:
  - `relativeLuminance(hex: string): number`, `contrastRatio(a: string, b: string): number` from `src/ui/contrast.ts` (hex is `#RRGGBB`).
  - From `src/ui/theme.ts`: `type ColorScheme = 'light' | 'dark'`, `type Colors`, `colors: Record<ColorScheme, Colors>`, `fontFamilies`, `typography`, `type TypographyVariant`, `spacing`, `radius`.

- [ ] **Step 1: Write the failing test**

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
  expect(contrastRatio('#1550A0', '#1550A0')).toBeCloseTo(1, 5);
});

describe.each(schemes)('%s theme contrast', (scheme) => {
  const c = colors[scheme];

  test('text pairs reach 4.5:1 on the background and surface', () => {
    // Given the theme's text colors and the two surfaces they are drawn on
    // When computing each pair's contrast
    // Then all of them reach the WCAG AA threshold for normal text
    for (const surface of [c.background, c.surface]) {
      expect(contrastRatio(c.text, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.textMuted, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.primary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.danger, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('button label on the primary color reaches 4.5:1', () => {
    // Given the primary button color and its label color
    // When computing their contrast
    // Then the label is readable
    expect(contrastRatio(c.onPrimary, c.primary)).toBeGreaterThanOrEqual(4.5);
  });

  test('expiry bar fills reach 3:1 against the bar track', () => {
    // Given the track color and both fill colors the expiry bar can use
    // When computing their contrast
    // Then the fill is distinguishable from the track (WCAG non-text 3:1)
    expect(contrastRatio(c.primary, c.border)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(c.danger, c.border)).toBeGreaterThanOrEqual(3);
  });
});

test('the bay yellow is visible on the dark background', () => {
  // Given the yellow corner brackets can sit on the dark theme background
  // When computing the contrast against it
  // Then it reaches 3:1 (on the light theme the brackets overlay the photo instead)
  expect(contrastRatio(colors.dark.bay, colors.dark.background)).toBeGreaterThanOrEqual(3);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npm test -- contrast`
Expected: FAIL, cannot find module `../src/ui/contrast`.

- [ ] **Step 3: Implement the contrast helper**

`src/ui/contrast.ts`:

```ts
function channelToLinear(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a `#RRGGBB` color. */
export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** WCAG contrast ratio between two `#RRGGBB` colors (order does not matter). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 4: Implement the theme tokens**

`src/ui/theme.ts`:

```ts
import type { TextStyle } from 'react-native';

export type ColorScheme = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  bay: string;
  danger: string;
};

export const colors: Record<ColorScheme, Colors> = {
  light: {
    background: '#E4E6E5',
    surface: '#F7F8F7',
    text: '#23272B',
    textMuted: '#5A6166',
    border: '#C9CDCC',
    primary: '#1550A0',
    onPrimary: '#FFFFFF',
    bay: '#F4C20D',
    danger: '#B3261E',
  },
  dark: {
    background: '#1B1E21',
    surface: '#252A2E',
    text: '#ECEEED',
    textMuted: '#A3AAAE',
    border: '#394046',
    primary: '#8DB6F5',
    onPrimary: '#0E1F3B',
    bay: '#F4C20D',
    danger: '#FF7A6B',
  },
};

export const fontFamilies = {
  condensed: 'BarlowCondensed_600SemiBold',
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
} as const;

export const typography = {
  sign: { fontFamily: fontFamilies.condensed, fontSize: 44, lineHeight: 48 },
  title: { fontFamily: fontFamilies.condensed, fontSize: 28, lineHeight: 32 },
  rowTitle: { fontFamily: fontFamilies.condensed, fontSize: 20, lineHeight: 24 },
  button: { fontFamily: fontFamilies.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fontFamilies.regular, fontSize: 17, lineHeight: 24 },
  caption: { fontFamily: fontFamilies.regular, fontSize: 14, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, screen: 20 } as const;

export const radius = { card: 12, pill: 28 } as const;
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS for the new file and all earlier tests. If a contrast assertion fails, adjust only that hex minimally (keep the hue), re-run, and record the change in your report.

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit` (exit 0).

```bash
git add src/ui/contrast.ts src/ui/theme.ts tests/contrast.test.ts
git commit -m "feat: add theme tokens and WCAG contrast helper"
```

---

### Task 3: Expiry bar and time-ago helpers

**Files:**
- Modify: `src/domain/expiry.ts` (append)
- Create: `src/ui/format.ts`
- Test: `tests/expiry.test.ts` (append), `tests/format.test.ts`

**Interfaces:**
- Consumes: `DAY_MS`, `RETENTION_DAYS`, `daysLeft` from `src/domain/expiry.ts`.
- Produces:
  - `EXPIRY_WARN_DAYS = 4`
  - `expiryFraction(expiresAt: number, now: number): number` (0..1, share of the 30-day window left)
  - `isExpiringSoon(expiresAt: number, now: number): boolean`
  - `formatTimeAgo(from: number, now: number): string`

- [ ] **Step 1: Write the failing tests**

Append to `tests/expiry.test.ts` (add `expiryFraction`, `isExpiringSoon` to the existing import from `../src/domain/expiry`):

```ts
test('expiryFraction is the share of the 30-day window that is left, clamped to 0..1', () => {
  // Given a photo that was just taken, one half-way through, one expired, and a clock set before capture
  const now = 1_000_000;
  // When computing the fraction left
  // Then it is 1, 0.5, 0 and 1 respectively (never outside 0..1)
  expect(expiryFraction(now + 30 * DAY_MS, now)).toBe(1);
  expect(expiryFraction(now + 15 * DAY_MS, now)).toBe(0.5);
  expect(expiryFraction(now - DAY_MS, now)).toBe(0);
  expect(expiryFraction(now + 40 * DAY_MS, now)).toBe(1);
});

test('isExpiringSoon is true only when fewer than 4 whole days are left', () => {
  // Given expiry times 5, 4, 3 and 0 days away
  const now = 1_000_000;
  // When checking each
  // Then only 3 days and 0 days count as expiring soon
  expect(isExpiringSoon(now + 5 * DAY_MS, now)).toBe(false);
  expect(isExpiringSoon(now + 4 * DAY_MS, now)).toBe(false);
  expect(isExpiringSoon(now + 3 * DAY_MS, now)).toBe(true);
  expect(isExpiringSoon(now, now)).toBe(true);
});
```

`tests/format.test.ts`:

```ts
import { formatTimeAgo } from '../src/ui/format';

const MINUTE = 60_000;

test('formatTimeAgo picks the right unit in Vietnamese', () => {
  // Given a fixed "now" and times 20 seconds, 5 minutes, 3 hours and 2 days earlier
  const now = 10_000_000_000;
  // When formatting each
  // Then the label names the largest whole unit
  expect(formatTimeAgo(now - 20_000, now)).toBe('vừa xong');
  expect(formatTimeAgo(now - 5 * MINUTE, now)).toBe('5 phút trước');
  expect(formatTimeAgo(now - 3 * 60 * MINUTE, now)).toBe('3 giờ trước');
  expect(formatTimeAgo(now - 2 * 24 * 60 * MINUTE, now)).toBe('2 ngày trước');
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npm test -- expiry format`
Expected: FAIL (`expiryFraction`/`isExpiringSoon` not exported, `../src/ui/format` missing).

- [ ] **Step 3: Implement**

Append to `src/domain/expiry.ts`:

```ts
export const EXPIRY_WARN_DAYS = 4;

/** Share of the retention window that is left, from 0 (expired) to 1 (just taken). */
export function expiryFraction(expiresAt: number, now: number): number {
  const fraction = (expiresAt - now) / (RETENTION_DAYS * DAY_MS);
  return Math.min(1, Math.max(0, fraction));
}

export function isExpiringSoon(expiresAt: number, now: number): boolean {
  return daysLeft(expiresAt, now) < EXPIRY_WARN_DAYS;
}
```

`src/ui/format.ts`:

```ts
export function formatTimeAgo(from: number, now: number): string {
  const minutes = Math.floor((now - from) / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}
```

- [ ] **Step 4: Run, typecheck, commit**

Run: `npm test` (all pass) and `npx tsc --noEmit` (exit 0).

```bash
git add src/domain/expiry.ts src/ui/format.ts tests/expiry.test.ts tests/format.test.ts
git commit -m "feat: add expiry fraction and time-ago helpers"
```

---

### Task 4: Theme hook, fonts, components and root layout

**Files:**
- Create: `src/ui/useTheme.ts`, `src/ui/fonts.ts`, `src/ui/components/Text.tsx`, `src/ui/components/Button.tsx`, `src/ui/components/BayFrame.tsx`, `src/ui/components/ExpiryBar.tsx`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Consumes: Task 2 tokens, Task 3 helpers, `registerPurgeTask` from `src/background/purgeTask`.
- Produces:
  - `useTheme(): { scheme: ColorScheme; colors: Colors; spacing; radius }`
  - `fontAssets` map (family name to font module) for `useFonts`.
  - `<Text variant? muted? ...TextProps />`
  - `<PrimaryButton title onPress disabled? accessibilityLabel? />`, `<TextButton title onPress disabled? tone?: 'primary' | 'danger' />`
  - `<BayFrame style?>children</BayFrame>` (yellow corner brackets overlaid on the content)
  - `<ExpiryBar expiresAt: number | null now: number />`

These are React Native components: they are verified by `tsc` and on a device, not by Jest.

- [ ] **Step 1: Hook and fonts**

`src/ui/useTheme.ts`:

```ts
import { useColorScheme } from 'react-native';
import { colors, radius, spacing, type ColorScheme } from './theme';

export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: colors[scheme], spacing, radius };
}
```

`src/ui/fonts.ts` (use the real export names confirmed in Task 1):

```ts
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from '@expo-google-fonts/barlow';
import { BarlowCondensed_600SemiBold } from '@expo-google-fonts/barlow-condensed';
import { fontFamilies } from './theme';

export const fontAssets = {
  [fontFamilies.regular]: Barlow_400Regular,
  [fontFamilies.medium]: Barlow_500Medium,
  [fontFamilies.semibold]: Barlow_600SemiBold,
  [fontFamilies.condensed]: BarlowCondensed_600SemiBold,
};
```

- [ ] **Step 2: Text**

`src/ui/components/Text.tsx`:

```tsx
import { Text as RNText, type TextProps } from 'react-native';
import { typography, type TypographyVariant } from '../theme';
import { useTheme } from '../useTheme';

type Props = TextProps & { variant?: TypographyVariant; muted?: boolean };

export function Text({ variant = 'body', muted = false, style, ...rest }: Props) {
  const { colors } = useTheme();
  const large = variant === 'sign' || variant === 'title';
  return (
    <RNText
      maxFontSizeMultiplier={large ? 1.2 : 1.6}
      style={[typography[variant], { color: muted ? colors.textMuted : colors.text }, style]}
      {...rest}
    />
  );
}
```

- [ ] **Step 3: Buttons**

`src/ui/components/Button.tsx`:

```tsx
import { Pressable, StyleSheet } from 'react-native';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { Text } from './Text';

type BaseProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function PrimaryButton({ title, onPress, disabled, accessibilityLabel }: BaseProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: colors.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Text variant="button" style={{ color: colors.onPrimary }}>
        {title}
      </Text>
    </Pressable>
  );
}

export function TextButton({
  title,
  onPress,
  disabled,
  accessibilityLabel,
  tone = 'primary',
}: BaseProps & { tone?: 'primary' | 'danger' }) {
  const { colors } = useTheme();
  const color = tone === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.text, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}
    >
      <Text variant="button" style={{ color }}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    minHeight: 56,
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
});
```

- [ ] **Step 4: BayFrame**

`src/ui/components/BayFrame.tsx`:

```tsx
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../useTheme';

const SIZE = 28;
const THICKNESS = 5;
const INSET = 8;

const corners = [
  { top: INSET, left: INSET, borderTopWidth: THICKNESS, borderLeftWidth: THICKNESS, borderTopLeftRadius: 6 },
  { top: INSET, right: INSET, borderTopWidth: THICKNESS, borderRightWidth: THICKNESS, borderTopRightRadius: 6 },
  { bottom: INSET, left: INSET, borderBottomWidth: THICKNESS, borderLeftWidth: THICKNESS, borderBottomLeftRadius: 6 },
  { bottom: INSET, right: INSET, borderBottomWidth: THICKNESS, borderRightWidth: THICKNESS, borderBottomRightRadius: 6 },
] as const;

/** Overlays four yellow parking-bay corner brackets on its content. */
export function BayFrame({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View style={style}>
      {children}
      {corners.map((corner, index) => (
        <View
          key={index}
          pointerEvents="none"
          style={[styles.corner, { borderColor: colors.bay }, corner]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', width: SIZE, height: SIZE },
});
```

- [ ] **Step 5: ExpiryBar**

`src/ui/components/ExpiryBar.tsx`:

```tsx
import { StyleSheet, View } from 'react-native';
import { daysLeft, expiryFraction, isExpiringSoon, RETENTION_DAYS } from '../../domain/expiry';
import { useTheme } from '../useTheme';
import { Text } from './Text';

/** Shows how much of the 30-day retention window is left, or "Đã giữ lại" for kept photos. */
export function ExpiryBar({ expiresAt, now }: { expiresAt: number | null; now: number }) {
  const { colors } = useTheme();

  if (expiresAt === null) {
    return (
      <Text variant="caption" muted>
        Đã giữ lại
      </Text>
    );
  }

  const days = daysLeft(expiresAt, now);
  const label = `còn ${days} ngày`;
  const fill = isExpiringSoon(expiresAt, now) ? colors.danger : colors.primary;
  const percent = Math.round(expiryFraction(expiresAt, now) * 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: RETENTION_DAYS, now: days }}
      style={styles.row}
    >
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { backgroundColor: fill, width: `${percent}%` }]} />
      </View>
      <Text variant="caption" muted>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
```

- [ ] **Step 6: Root layout (fonts, splash, themed header)**

Replace `src/app/_layout.tsx`:

```tsx
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { registerPurgeTask } from '../background/purgeTask';
import { fontAssets } from '../ui/fonts';
import { fontFamilies } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { colors } = useTheme();
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    registerPurgeTask().catch(() => {});
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // On a font error the app still starts and falls back to system fonts.
  if (!fontsLoaded && !fontError) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontFamily: fontFamilies.condensed, fontSize: 24 },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Xe của tôi' }} />
      <Stack.Screen name="capture" options={{ title: 'Chụp vị trí xe' }} />
      <Stack.Screen name="record/[id]" options={{ title: 'Chi tiết' }} />
    </Stack>
  );
}
```

Before writing it, check the SDK 58 typings/docs for `useFonts` (`node_modules/expo-font`) and `expo-splash-screen` (`preventAutoHideAsync`, `hideAsync`); adapt names only if they differ and say so in the report.

- [ ] **Step 7: Verify and commit**

Run: `npx tsc --noEmit` (exit 0) and `npm test` (all pass).

```bash
git add src/ui src/app/_layout.tsx
git commit -m "feat: add themed UI components, fonts and root layout"
```

---

### Task 5: Home screen

**Files:**
- Create: `src/ui/components/SpotCard.tsx`, `src/ui/components/HistoryRow.tsx`
- Modify: `src/app/index.tsx` (rewrite)

**Interfaces:**
- Consumes: Task 4 components, `formatTimeAgo`, `directionsUrl` (`src/native/directions.ts`), `useParking`, `getParkingService`, `getPhotoFiles`, `pickCurrent`, `historyOf`.
- Produces: the redesigned Home. Behavior is unchanged except that nothing is rendered until `loaded` is true (avoids flashing the empty state).

- [ ] **Step 1: SpotCard**

`src/ui/components/SpotCard.tsx`:

```tsx
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ParkingRecord } from '../../domain/types';
import { formatTimeAgo } from '../format';
import { BayFrame } from './BayFrame';
import { PrimaryButton, TextButton } from './Button';
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
  const hasGps = record.lat !== null && record.lng !== null;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="imagebutton" accessibilityLabel="Mở chi tiết vị trí xe" onPress={onOpen}>
        <BayFrame style={styles.frame}>
          <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" accessible accessibilityLabel="Ảnh vị trí xe" />
        </BayFrame>
      </Pressable>
      {record.note ? (
        <Text variant="sign" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <Text variant="caption" muted>
        Đậu {formatTimeAgo(record.createdAt, now)}
      </Text>
      {hasGps ? <PrimaryButton title="Dẫn đường về xe" onPress={onNavigate} /> : null}
      <TextButton title="Đã lấy xe" onPress={onCollect} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  frame: { borderRadius: 12, overflow: 'hidden' },
  photo: { width: '100%', height: 240 },
});
```

- [ ] **Step 2: HistoryRow**

`src/ui/components/HistoryRow.tsx`:

```tsx
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import type { ParkingRecord } from '../../domain/types';
import { radius } from '../theme';
import { useTheme } from '../useTheme';
import { ExpiryBar } from './ExpiryBar';
import { Text } from './Text';

type Props = { record: ParkingRecord; photoUri: string; now: number; onPress: () => void };

export function HistoryRow({ record, photoUri, now, onPress }: Props) {
  const { colors } = useTheme();
  const title = record.note || 'Không có ghi chú';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 }]}
    >
      <Image source={{ uri: photoUri }} style={styles.thumb} contentFit="cover" />
      <View style={styles.text}>
        <Text variant="rowTitle" numberOfLines={1}>
          {title}
        </Text>
        <ExpiryBar expiresAt={record.expiresAt} now={now} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.card },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  text: { flex: 1, gap: 6 },
});
```

- [ ] **Step 3: Home screen**

Replace `src/app/index.tsx` (the `collect` logic and the `Linking` error handling are kept as they are today):

```tsx
import { useRouter } from 'expo-router';
import { Alert, FlatList, Linking, StyleSheet, View } from 'react-native';
import { getParkingService, getPhotoFiles } from '../container';
import { historyOf, pickCurrent } from '../domain/current';
import { useParking } from '../hooks/useParking';
import { directionsUrl } from '../native/directions';
import { PrimaryButton, TextButton } from '../ui/components/Button';
import { HistoryRow } from '../ui/components/HistoryRow';
import { SpotCard } from '../ui/components/SpotCard';
import { Text } from '../ui/components/Text';
import { spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const { records, loaded, refresh } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const history = historyOf(records);
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

  const header = current ? (
    <View style={styles.header}>
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
      <TextButton title="Chụp vị trí mới" onPress={() => router.push('/capture')} />
    </View>
  ) : (
    <View style={styles.empty}>
      <Text variant="body" muted style={styles.emptyText}>
        Chụp cây cột gần chỗ đậu. Ảnh tự xoá sau 30 ngày.
      </Text>
      <PrimaryButton title="Chụp vị trí xe" onPress={() => router.push('/capture')} />
    </View>
  );

  const centered = !current && history.length === 0;

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.list, centered ? styles.centered : null]}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          {header}
          {history.length > 0 ? (
            <Text variant="rowTitle" muted>
              Lịch sử
            </Text>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <HistoryRow
          record={item}
          photoUri={files.uriFor(item.photoPath)}
          now={now}
          onPress={() => openRecord(item.id)}
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  list: { padding: spacing.screen, paddingBottom: spacing.xl },
  centered: { flexGrow: 1, justifyContent: 'center' },
  headerWrap: { gap: spacing.md, marginBottom: spacing.md },
  header: { gap: spacing.sm },
  empty: { gap: spacing.md },
  emptyText: { textAlign: 'center' },
  separator: { height: spacing.sm },
});
```

- [ ] **Step 4: Verify and commit**

Run: `npx tsc --noEmit` (exit 0; typed routes must accept `router.push({ pathname: '/record/[id]', params: { id } })`) and `npm test` (all pass).

Remaining device checks for the human (put them in the report): Home with a current spot (frame corners over the photo, large note, two buttons), Home with no spot and no history (centered text and button), a long note (shrinks to two lines), a history row with a kept photo ("Đã giữ lại") and one with fewer than 4 days left (red bar), dark mode.

```bash
git add src/ui/components/SpotCard.tsx src/ui/components/HistoryRow.tsx src/app/index.tsx
git commit -m "feat: redesign home screen"
```

---

### Task 6: Capture screen

**Files:**
- Modify: `src/app/capture.tsx` (restyle; logic unchanged)

**Interfaces:**
- Consumes: Task 4 components and tokens, plus everything `capture.tsx` already imports.

All logic (`takePhoto`, `askNotificationOnce`, `save`, permission handling) stays exactly as it is today. Only the JSX and `styles` change, plus theme colors.

- [ ] **Step 1: Rewrite the file**

Replace `src/app/capture.tsx`:

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { getParkingService } from '../container';
import { getCoords } from '../native/location';
import { ensureNotificationPermission } from '../native/reminders';
import { BayFrame } from '../ui/components/BayFrame';
import { PrimaryButton, TextButton } from '../ui/components/Button';
import { Text } from '../ui/components/Text';
import { fontFamilies, radius, spacing } from '../ui/theme';
import { useTheme } from '../ui/useTheme';

type Coords = { lat: number; lng: number } | null;

export default function CaptureScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!permission) return <ActivityIndicator style={styles.center} color={colors.primary} />;
  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.message}>App cần quyền camera để chụp vị trí xe.</Text>
        <PrimaryButton title="Cho phép camera" onPress={requestPermission} />
      </View>
    );
  }

  async function takePhoto() {
    setBusy(true);
    try {
      const coordsPromise = getCoords();
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo) return;
      setPhotoUri(photo.uri);
      setCoords(await coordsPromise);
    } catch {
      Alert.alert('Không chụp được ảnh', 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  async function askNotificationOnce() {
    const status = (await Notifications.getPermissionsAsync()).status;
    if (status !== 'undetermined') return;
    await new Promise<void>((resolve) => {
      Alert.alert(
        'Nhắc trước khi xoá',
        'Cho phép thông báo để app nhắc bạn trước khi ảnh bị xoá.',
        [
          {
            text: 'Tiếp tục',
            onPress: () => {
              ensureNotificationPermission()
                .catch(() => undefined)
                .finally(() => resolve());
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve() },
      );
    });
  }

  async function save() {
    if (!photoUri) return;
    setBusy(true);
    let saved = false;
    try {
      try {
        const service = await getParkingService();
        await service.capture({
          tempUri: photoUri,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
          note,
        });
        saved = true;
      } catch {
        Alert.alert('Không lưu được ảnh', 'Vui lòng thử lại.');
      }
      if (saved) {
        await askNotificationOnce().catch(() => undefined);
        router.back();
      }
    } finally {
      setBusy(false);
    }
  }

  if (photoUri) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" accessible accessibilityLabel="Ảnh vừa chụp" />
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
          accessibilityLabel="Ghi chú vị trí xe"
          value={note}
          onChangeText={setNote}
          maxLength={80}
        />
        <PrimaryButton title={busy ? 'Đang lưu...' : 'Lưu'} onPress={save} disabled={busy} />
        <TextButton title="Chụp lại" onPress={() => setPhotoUri(null)} disabled={busy} />
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BayFrame style={styles.camera}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
      </BayFrame>
      <View style={styles.shutterRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chụp"
          accessibilityState={{ disabled: busy }}
          disabled={busy}
          onPress={takePhoto}
          style={[styles.shutterOuter, { borderColor: colors.text, opacity: busy ? 0.5 : 1 }]}
        >
          <View style={[styles.shutterInner, { backgroundColor: colors.text }]} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.screen, gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.lg },
  message: { textAlign: 'center' },
  camera: { flex: 1, borderRadius: radius.card, overflow: 'hidden' },
  preview: { flex: 1, borderRadius: radius.card },
  input: {
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontFamily: fontFamilies.regular,
    fontSize: 17,
  },
  shutterRow: { alignItems: 'center', paddingBottom: spacing.sm },
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

- [ ] **Step 2: Verify and commit**

Run: `npx tsc --noEmit` (exit 0) and `npm test` (all pass).

Device checks for the human (put them in the report): camera view with the four yellow corners and a large shutter button; after a shot, the preview, GPS line, note field (keyboard does not hide the "Lưu" button) and both buttons; camera-permission-denied state; dark mode.

```bash
git add src/app/capture.tsx
git commit -m "feat: redesign capture screen"
```

---

### Task 7: Detail screen

**Files:**
- Modify: `src/app/record/[id].tsx` (restyle; logic unchanged)

**Interfaces:**
- Consumes: Task 4 components and tokens, plus everything the file already imports.

`keep`, `confirmDelete` and their error handling stay exactly as they are today.

- [ ] **Step 1: Rewrite the file**

Replace `src/app/record/[id].tsx`:

```tsx
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { getParkingService, getPhotoFiles } from '../../container';
import { useParking } from '../../hooks/useParking';
import { directionsUrl } from '../../native/directions';
import { GalleryPermissionDeniedError } from '../../services/ports';
import { PrimaryButton, TextButton } from '../../ui/components/Button';
import { ExpiryBar } from '../../ui/components/ExpiryBar';
import { Text } from '../../ui/components/Text';
import { radius, spacing } from '../../ui/theme';
import { useTheme } from '../../ui/useTheme';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { records, loaded, refresh } = useParking();
  const [busy, setBusy] = useState(false);
  const record = records.find((r) => r.id === id);

  if (!loaded) {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  }
  if (!record) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text muted>Ảnh không còn tồn tại.</Text>
      </View>
    );
  }

  const recordId = record.id;
  const uri = getPhotoFiles().uriFor(record.photoPath);
  const now = Date.now();

  async function keep() {
    if (busy) return;
    setBusy(true);
    try {
      await (await getParkingService()).keep(recordId);
      await refresh();
      Alert.alert('Đã giữ lại', 'Ảnh đã được lưu vào thư viện và sẽ không bị tự xoá.');
    } catch (error) {
      if (error instanceof GalleryPermissionDeniedError) {
        Alert.alert('Không giữ lại được', 'Hãy cho phép app lưu ảnh vào thư viện trong Cài đặt.');
      } else {
        Alert.alert('Không giữ lại được', 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (busy) return;
    Alert.alert('Xoá ảnh này?', 'Ảnh sẽ bị xoá ngay.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          if (busy) return;
          setBusy(true);
          try {
            await (await getParkingService()).deleteNow(recordId);
          } catch {
            Alert.alert('Không xoá được', 'Vui lòng thử lại.');
            setBusy(false);
            return;
          }
          setBusy(false);
          router.back();
        },
      },
    ]);
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
    >
      <Image source={{ uri }} style={styles.photo} contentFit="cover" accessible accessibilityLabel="Ảnh vị trí xe" />
      {record.note ? (
        <Text variant="sign" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
          {record.note}
        </Text>
      ) : (
        <Text muted>Không có ghi chú</Text>
      )}
      <Text variant="caption" muted>
        Chụp lúc {new Date(record.createdAt).toLocaleString('vi-VN')}
      </Text>
      <ExpiryBar expiresAt={record.expiresAt} now={now} />
      {record.lat !== null && record.lng !== null ? (
        <View style={styles.block}>
          <Text variant="caption" muted>
            Toạ độ: {record.lat.toFixed(5)}, {record.lng.toFixed(5)}
          </Text>
          <TextButton
            title="Mở bản đồ"
            onPress={() =>
              Linking.openURL(directionsUrl(record.lat!, record.lng!)).catch(() =>
                Alert.alert('Không mở được bản đồ', 'Hãy cài ứng dụng bản đồ rồi thử lại.'),
              )
            }
          />
        </View>
      ) : null}
      {record.expiresAt !== null ? <PrimaryButton title="Giữ lại" onPress={keep} disabled={busy} /> : null}
      <View style={styles.dangerZone}>
        <TextButton title="Xoá ngay" tone="danger" onPress={confirmDelete} disabled={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.screen, gap: spacing.md, paddingBottom: spacing.xl },
  photo: { width: '100%', height: 320, borderRadius: radius.card },
  block: { gap: spacing.xs },
  dangerZone: { marginTop: spacing.xl, alignItems: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Verify and commit**

Run: `npx tsc --noEmit` (exit 0) and `npm test` (all pass).

Device checks for the human (put them in the report): detail of a normal photo (large note, expiry bar, "Giữ lại" primary, "Xoá ngay" red and separated), detail of a kept photo (no "Giữ lại", text "Đã giữ lại"), photo without GPS (no coordinates or map button), spinner on open (no "Ảnh không còn tồn tại" flash), dark mode.

```bash
git add "src/app/record/[id].tsx"
git commit -m "feat: redesign detail screen"
```

---

### Task 8: Final verification

**Files:** none (verification only; fix only defects in files this plan created or changed).

- [ ] **Step 1: Static checks**

Run: `npm test` (all pass; expect the earlier 23 tests plus the new contrast, expiry and format tests) and `npx tsc --noEmit` (exit 0). Run `git status --short`: only an unrelated `package.json` change from Expo tooling may remain.

- [ ] **Step 2: Bundling smoke test**

Run `npx expo export --platform ios --output-dir /tmp/parking-ui-export-check` (and delete the directory afterwards; leave nothing in the repo). Expected: it completes without errors, which proves the font imports and all new modules resolve.

- [ ] **Step 3: Report the human device checklist**

List in the report, for the human to run on a device in light AND dark mode: Home (current spot, no spot, long note, kept photo, expiring-soon red bar), Capture, Detail, system text size at the largest setting (layout scrolls and nothing is cut off), and the correct rendering of Vietnamese diacritics in every font (type a note such as "Tầng B2, cột 14, gần thang máy, khu Đ").
