# Parked-Spot Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After a parking spot is saved, post exactly one local notification for the active spot ("Xe bạn đang đậu ở {ghi chú}" or "Bạn đã đậu xe") with the actions "Đã lấy xe" and "Dẫn đường về xe", keep it in sync with the active spot, and handle the action buttons.

**Architecture:** Pure logic (text, action parsing, constants) lives in `src/domain/parkedNotification.ts` and is unit tested. A thin native adapter posts, replaces and dismisses the notification with a fixed identifier (so there is never more than one). A root hook handles notification responses. Four existing places call the adapter: capture (post), Home collect (dismiss), Detail delete of the active spot (dismiss), and `useParking.refresh` (dismiss when no active spot remains).

**Tech Stack:** Expo SDK 58, `expo-notifications` 58 (categories/actions, `useLastNotificationResponse`), expo-router, Jest (`jest-expo`).

**Spec:** `docs/superpowers/specs/2026-11-17-parked-notification-design.md`

## Global Constraints

- Notification content: title `Vị trí xe của bạn`; body `Xe bạn đang đậu ở {note}` when the trimmed note is non-empty, otherwise `Bạn đã đậu xe`. No image.
- Buttons: `Đã lấy xe` (action id `collect`) and `Dẫn đường về xe` (action id `navigate`); records without GPS use a category with only `Đã lấy xe`. Both actions use `opensAppToForeground: true`.
- Fixed notification identifier `parked-spot` and fixed category ids `parked-with-gps` / `parked-no-gps`: there is never more than one parked-spot notification.
- The notification is posted immediately (`trigger: null`) so `syncReminders` (which cancels only SCHEDULED notifications) never removes it. Do not change `src/native/reminders.ts`.
- Post only when notification permission is granted; adapter functions never reject (they catch, `console.warn`, and return) so a notification failure never blocks saving or navigation.
- "Đã lấy xe" from the notification marks the spot collected ONLY if its `recordId` is still the current spot; in every case it dismisses the notification. "Dẫn đường về xe" opens the maps URL (`directionsUrl`) and does not dismiss.
- Do not change services, the repository, `src/container.ts`, permission flows, or the reminder logic. The only logic edits allowed outside the new files are the four integration points in Task 3.
- React Compiler is enabled: no `useMemo`, `useCallback`, `React.memo`; every hook before any early return.
- UI/notification copy Vietnamese; code, identifiers, commit messages English. Every test has `// Given`, `// When`, `// Then` comments.
- Stage only the files a task lists. Never `git add -A`. Never run `expo prebuild`, `expo run:*` or `expo config --type prebuild`. If a tool changes `app.json` or `package.json`, revert it with `git checkout <file>` before committing.

## File Structure

```
src/domain/parkedNotification.ts      # constants, buildParkedText, parkedCategoryFor, parseParkedAction (pure)
src/native/parkedNotification.ts      # registerParkedCategories, showParkedNotification, dismissParkedNotification
src/native/notificationSetup.ts       # setNotificationHandler (side-effect module)
src/hooks/useParkedNotificationResponses.ts   # root hook handling action taps
src/app/_layout.tsx                   # + handler import, category registration, response hook
src/app/capture.tsx                   # + post after save
src/app/(tabs)/index.tsx              # + dismiss after collect
src/app/record/[id].tsx               # + dismiss after deleting the current spot
src/hooks/useParking.ts               # + dismiss when no current spot remains
tests/parkedNotification.test.ts
```

---

### Task 1: Pure notification logic

**Files:**
- Create: `src/domain/parkedNotification.ts`
- Test: `tests/parkedNotification.test.ts`

**Interfaces:**
- Produces (all exported from `src/domain/parkedNotification.ts`):
  - `PARKED_NOTIFICATION_ID = 'parked-spot'`, `PARKED_CATEGORY_WITH_GPS = 'parked-with-gps'`, `PARKED_CATEGORY_NO_GPS = 'parked-no-gps'`, `PARKED_ACTION_COLLECT = 'collect'`, `PARKED_ACTION_NAVIGATE = 'navigate'`
  - `buildParkedText(note: string): { title: string; body: string }`
  - `parkedCategoryFor(hasGps: boolean): string`
  - `type ParkedAction = { type: 'collect'; recordId: string | null } | { type: 'navigate'; lat: number; lng: number } | { type: 'open' }`
  - `parseParkedAction(actionIdentifier: string, data: unknown): ParkedAction`

- [ ] **Step 1: Write the failing tests**

`tests/parkedNotification.test.ts`:

```ts
import {
  buildParkedText,
  parkedCategoryFor,
  parseParkedAction,
  PARKED_ACTION_COLLECT,
  PARKED_ACTION_NAVIGATE,
  PARKED_CATEGORY_NO_GPS,
  PARKED_CATEGORY_WITH_GPS,
} from '../src/domain/parkedNotification';

test('buildParkedText names the spot when there is a note', () => {
  // Given a spot saved with a note
  // When building the notification text
  // Then the body names the note after "Xe bạn đang đậu ở"
  expect(buildParkedText('B1')).toEqual({
    title: 'Vị trí xe của bạn',
    body: 'Xe bạn đang đậu ở B1',
  });
});

test('buildParkedText trims the note and keeps a long note whole', () => {
  // Given a note with surrounding spaces and one at the 80-character limit
  const long = 'B'.repeat(80);
  // When building the text
  // Then spaces are trimmed and the long note is not cut
  expect(buildParkedText('  B2, cột 14  ').body).toBe('Xe bạn đang đậu ở B2, cột 14');
  expect(buildParkedText(long).body).toBe(`Xe bạn đang đậu ở ${long}`);
});

test('buildParkedText falls back to "Bạn đã đậu xe" for an empty or blank note', () => {
  // Given no note, and a note that is only spaces
  // When building the text
  // Then the body says only that the user parked
  expect(buildParkedText('').body).toBe('Bạn đã đậu xe');
  expect(buildParkedText('   ').body).toBe('Bạn đã đậu xe');
});

test('parkedCategoryFor picks the category by GPS availability', () => {
  // Given a spot with GPS and one without
  // When choosing the category
  // Then GPS spots get both buttons, others only "Đã lấy xe"
  expect(parkedCategoryFor(true)).toBe(PARKED_CATEGORY_WITH_GPS);
  expect(parkedCategoryFor(false)).toBe(PARKED_CATEGORY_NO_GPS);
});

test('parseParkedAction reads the collect action with its record id', () => {
  // Given the collect action with the data the notification was posted with
  // When parsing it
  // Then it returns a collect action carrying the record id
  expect(parseParkedAction(PARKED_ACTION_COLLECT, { recordId: 'r1', lat: 1, lng: 2 })).toEqual({
    type: 'collect',
    recordId: 'r1',
  });
});

test('parseParkedAction still collects (and dismisses) when the record id is missing', () => {
  // Given the collect action with missing, empty or wrongly typed data
  // When parsing it
  // Then it is still a collect action with a null record id, so the handler can dismiss safely
  expect(parseParkedAction(PARKED_ACTION_COLLECT, undefined)).toEqual({ type: 'collect', recordId: null });
  expect(parseParkedAction(PARKED_ACTION_COLLECT, { recordId: '' })).toEqual({ type: 'collect', recordId: null });
  expect(parseParkedAction(PARKED_ACTION_COLLECT, { recordId: 7 })).toEqual({ type: 'collect', recordId: null });
  expect(parseParkedAction(PARKED_ACTION_COLLECT, 'junk')).toEqual({ type: 'collect', recordId: null });
});

test('parseParkedAction reads the navigate action with valid coordinates', () => {
  // Given the navigate action with numeric coordinates
  // When parsing it
  // Then it returns the coordinates
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { recordId: 'r1', lat: 10.5, lng: 106.7 })).toEqual({
    type: 'navigate',
    lat: 10.5,
    lng: 106.7,
  });
});

test('parseParkedAction falls back to "open" for navigate without usable coordinates', () => {
  // Given the navigate action with null, missing, non-numeric or non-finite coordinates
  // When parsing it
  // Then it is just "open" (never a broken maps URL)
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: null, lng: null })).toEqual({ type: 'open' });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: 1 })).toEqual({ type: 'open' });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: '1', lng: '2' })).toEqual({ type: 'open' });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: NaN, lng: 2 })).toEqual({ type: 'open' });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, null)).toEqual({ type: 'open' });
});

test('parseParkedAction treats the default tap and unknown actions as "open"', () => {
  // Given a tap on the notification body and an unknown action id
  // When parsing them
  // Then both just open the app
  expect(parseParkedAction('expo.modules.notifications.actions.DEFAULT', { recordId: 'r1' })).toEqual({ type: 'open' });
  expect(parseParkedAction('something-else', {})).toEqual({ type: 'open' });
});
```

- [ ] **Step 2: Run to see them fail**

Run: `npm test -- parkedNotification`
Expected: FAIL, cannot find module `../src/domain/parkedNotification`.

- [ ] **Step 3: Implement**

`src/domain/parkedNotification.ts`:

```ts
export const PARKED_NOTIFICATION_ID = 'parked-spot';
export const PARKED_CATEGORY_WITH_GPS = 'parked-with-gps';
export const PARKED_CATEGORY_NO_GPS = 'parked-no-gps';
export const PARKED_ACTION_COLLECT = 'collect';
export const PARKED_ACTION_NAVIGATE = 'navigate';

export function buildParkedText(note: string): { title: string; body: string } {
  const trimmed = note.trim();
  return {
    title: 'Vị trí xe của bạn',
    body: trimmed ? `Xe bạn đang đậu ở ${trimmed}` : 'Bạn đã đậu xe',
  };
}

export function parkedCategoryFor(hasGps: boolean): string {
  return hasGps ? PARKED_CATEGORY_WITH_GPS : PARKED_CATEGORY_NO_GPS;
}

export type ParkedAction =
  | { type: 'collect'; recordId: string | null }
  | { type: 'navigate'; lat: number; lng: number }
  | { type: 'open' };

function asRecord(data: unknown): Record<string, unknown> | null {
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
}

export function parseParkedAction(actionIdentifier: string, data: unknown): ParkedAction {
  const record = asRecord(data);
  if (actionIdentifier === PARKED_ACTION_COLLECT) {
    const id = record?.recordId;
    return { type: 'collect', recordId: typeof id === 'string' && id !== '' ? id : null };
  }
  if (actionIdentifier === PARKED_ACTION_NAVIGATE) {
    const lat = record?.lat;
    const lng = record?.lng;
    if (typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)) {
      return { type: 'navigate', lat, lng };
    }
  }
  return { type: 'open' };
}
```

- [ ] **Step 4: Verify and commit**

Run: `npm test` (all pass, 40 existing plus the 9 new) and `npx tsc --noEmit` (exit 0).

```bash
git add src/domain/parkedNotification.ts tests/parkedNotification.test.ts
git commit -m "feat: add parked notification text and action parsing"
```

---

### Task 2: Native adapter, handler and root wiring

**Files:**
- Create: `src/native/parkedNotification.ts`, `src/native/notificationSetup.ts`, `src/hooks/useParkedNotificationResponses.ts`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Consumes: Task 1 exports; `ParkingRecord`; `getParkingService()`; `pickCurrent`; `directionsUrl`.
- Produces: `registerParkedCategories(): Promise<void>`, `showParkedNotification(record: ParkingRecord): Promise<void>`, `dismissParkedNotification(): Promise<void>` (none of them rejects), a side-effect module that sets the foreground handler, and `useParkedNotificationResponses(): void`.

These use native modules: verified by `tsc`, `expo export`, and on a device, not Jest.

API checks before writing (read `node_modules/expo-notifications` typings; adapt names only if they differ and report it): `setNotificationCategoryAsync(identifier, actions)` with `NotificationAction { identifier, buttonTitle, options?: { opensAppToForeground } }`; `scheduleNotificationAsync({ identifier, content: { title, body, categoryIdentifier, data }, trigger: null })`; `dismissNotificationAsync(identifier)`; `setNotificationHandler({ handleNotification })` returning `{ shouldShowBanner, shouldShowList, shouldPlaySound, shouldSetBadge }`; `useLastNotificationResponse()` return type; `NotificationResponse.actionIdentifier` and `notification.request.identifier`, `notification.request.content.data`, `notification.date`.

- [ ] **Step 1: Adapter**

`src/native/parkedNotification.ts`:

```ts
import * as Notifications from 'expo-notifications';
import {
  buildParkedText,
  parkedCategoryFor,
  PARKED_ACTION_COLLECT,
  PARKED_ACTION_NAVIGATE,
  PARKED_CATEGORY_NO_GPS,
  PARKED_CATEGORY_WITH_GPS,
  PARKED_NOTIFICATION_ID,
} from '../domain/parkedNotification';
import type { ParkingRecord } from '../domain/types';

const COLLECT_BUTTON = {
  identifier: PARKED_ACTION_COLLECT,
  buttonTitle: 'Đã lấy xe',
  options: { opensAppToForeground: true },
};

const NAVIGATE_BUTTON = {
  identifier: PARKED_ACTION_NAVIGATE,
  buttonTitle: 'Dẫn đường về xe',
  options: { opensAppToForeground: true },
};

export async function registerParkedCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY_WITH_GPS, [
      COLLECT_BUTTON,
      NAVIGATE_BUTTON,
    ]);
    await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY_NO_GPS, [COLLECT_BUTTON]);
  } catch (error) {
    console.warn('Failed to register parked notification categories', error);
  }
}

/** Posts (or replaces) the single parked-spot notification. Never rejects. */
export async function showParkedNotification(record: ParkingRecord): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    const { title, body } = buildParkedText(record.note);
    await Notifications.scheduleNotificationAsync({
      identifier: PARKED_NOTIFICATION_ID,
      content: {
        title,
        body,
        categoryIdentifier: parkedCategoryFor(record.lat !== null && record.lng !== null),
        data: { recordId: record.id, lat: record.lat, lng: record.lng },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to show the parked notification', error);
  }
}

/** Removes the parked-spot notification if it is showing. Never rejects. */
export async function dismissParkedNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(PARKED_NOTIFICATION_ID);
  } catch (error) {
    console.warn('Failed to dismiss the parked notification', error);
  }
}
```

- [ ] **Step 2: Foreground handler**

`src/native/notificationSetup.ts`:

```ts
import * as Notifications from 'expo-notifications';

// Show notifications as a banner and in the list even while the app is open (no sound).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
```

- [ ] **Step 3: Response hook**

`src/hooks/useParkedNotificationResponses.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { getParkingService } from '../container';
import { pickCurrent } from '../domain/current';
import { parseParkedAction, PARKED_NOTIFICATION_ID } from '../domain/parkedNotification';
import { directionsUrl } from '../native/directions';
import { dismissParkedNotification } from '../native/parkedNotification';

async function handleParkedResponse(actionIdentifier: string, data: unknown): Promise<void> {
  const action = parseParkedAction(actionIdentifier, data);
  if (action.type === 'collect') {
    const service = await getParkingService();
    const current = pickCurrent(await service.list());
    // Only collect the spot this notification was posted for; always dismiss.
    if (current && current.id === action.recordId) await service.collectCurrent();
    await dismissParkedNotification();
  } else if (action.type === 'navigate') {
    await Linking.openURL(directionsUrl(action.lat, action.lng));
  }
}

/** Handles taps on the parked-spot notification buttons, once per response (also on cold start). */
export function useParkedNotificationResponses(): void {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    if (response.notification.request.identifier !== PARKED_NOTIFICATION_ID) return;
    const key = `${response.notification.date}:${response.actionIdentifier}`;
    if (handled.current === key) return;
    handled.current = key;
    handleParkedResponse(
      response.actionIdentifier,
      response.notification.request.content.data,
    ).catch((error) => console.warn('Failed to handle the parked notification response', error));
  }, [response]);
}
```

- [ ] **Step 4: Root layout**

In `src/app/_layout.tsx` (keep everything else exactly as it is: font gating, splash, StatusBar, the `registerPurgeTask` effect, the `unstable_settings` export, the Stack screens):
- add `import '../native/notificationSetup';` and `import { registerParkedCategories } from '../native/parkedNotification';` and `import { useParkedNotificationResponses } from '../hooks/useParkedNotificationResponses';`
- inside `RootLayout`, ABOVE the font-gating early return, call `useParkedNotificationResponses();` and add an effect `useEffect(() => { registerParkedCategories(); }, []);` (the function never rejects).

- [ ] **Step 5: Verify and commit**

Run `npx expo export --platform ios --output-dir /tmp/parking-notif-check` (must succeed; delete the directory afterwards), `npx tsc --noEmit` (exit 0), `npm test` (all pass).

Device checks for the human (put in the report): none yet; this task has no visible effect until Task 3 posts the notification.

```bash
git add src/native/parkedNotification.ts src/native/notificationSetup.ts src/hooks/useParkedNotificationResponses.ts src/app/_layout.tsx
git commit -m "feat: add parked notification adapter, foreground handler and response hook"
```

---

### Task 3: Integration points

**Files:**
- Modify: `src/app/capture.tsx`, `src/app/(tabs)/index.tsx`, `src/app/record/[id].tsx`, `src/hooks/useParking.ts`

**Interfaces:**
- Consumes: `showParkedNotification`, `dismissParkedNotification` (Task 2), `pickCurrent`.

Make the smallest edits; every existing behavior and string stays as it is.

- [ ] **Step 1: Capture posts the notification**

In `save()` of `src/app/capture.tsx`, keep the structure (inner try/catch, `saved` flag, notification-permission step outside the save error path, `router.back()` only after success). Change only: keep the record returned by the service (`const record = await service.capture({...});` stored in a variable declared next to `saved`, for example `let savedRecord: ParkingRecord | null = null;` assigned inside the inner try), and after `await askNotificationOnce().catch(() => undefined);` and before `router.back()` add `if (savedRecord) await showParkedNotification(savedRecord);`. Import `showParkedNotification` from `../native/parkedNotification` and the `ParkingRecord` type from `../domain/types`. The call never rejects, so the existing error handling is unchanged.

- [ ] **Step 2: Home collect dismisses**

In `collect()` of `src/app/(tabs)/index.tsx`, after `await (await getParkingService()).collectCurrent();` succeeds and before `await refresh();`, add `await dismissParkedNotification();`. Keep the try/catch and alert as they are. Import it from `../../native/parkedNotification`.

- [ ] **Step 2b: Detail delete dismisses only the active spot**

In `src/app/record/[id].tsx`, inside `confirmDelete`'s delete handler: compute `const wasCurrent = pickCurrent(records)?.id === recordId;` before calling `deleteNow` (import `pickCurrent` from `../../domain/current`; `records` is already available from `useParking`), and after `deleteNow` succeeds (still inside the success path, before `router.back()`) add `if (wasCurrent) await dismissParkedNotification();`. Do not change the busy handling, alerts or the keep flow. Import `dismissParkedNotification` from `../../native/parkedNotification`.

- [ ] **Step 3: useParking keeps the invariant**

In `src/hooks/useParking.ts`, in `refresh`, after the stale-request guard (`if (requestId !== latestRequest.current) return;`) and before the `syncReminders` try block, add `if (!pickCurrent(list)) await dismissParkedNotification();` (import `pickCurrent` from `../domain/current` and `dismissParkedNotification` from `../native/parkedNotification`). It never rejects, so `refresh` still never rejects. This does NOT post anything, so opening the app never re-alerts.

- [ ] **Step 4: Verify and commit**

Run `npx tsc --noEmit` (exit 0), `npm test` (all pass), and `npx expo export --platform ios --output-dir /tmp/parking-notif-check2` (then delete the directory). Confirm with `git diff` that the logic inside `takePhoto`, `askNotificationOnce`, `keep` and the rest of `save`/`confirmDelete` is unchanged apart from the lines described above.

Device checks for the human (put in the report), iOS:
1. Save a spot with a note ("B1"): a banner "Vị trí xe của bạn / Xe bạn đang đậu ở B1" appears even with the app open, and stays in the Notification Center after you leave the app.
2. Save a spot without a note: "Bạn đã đậu xe".
3. Pull the banner down or long-press: two buttons "Đã lấy xe" and "Dẫn đường về xe" (only the first for a spot without GPS).
4. Save a second spot: still exactly one notification (replaced).
5. "Đã lấy xe" on the notification opens the app, Home shows no current spot, the notification is gone.
6. "Dẫn đường về xe" opens Maps and the notification stays.
7. Delete the current spot in Detail: notification disappears; delete an OLD history item: the notification stays.
8. First-ever save (permission prompt): after allowing, the notification still appears.
9. Deny notifications: saving works with no error and no notification.

```bash
git add src/app/capture.tsx "src/app/(tabs)/index.tsx" "src/app/record/[id].tsx" src/hooks/useParking.ts
git commit -m "feat: post and dismiss the parked-spot notification with the active spot"
```
