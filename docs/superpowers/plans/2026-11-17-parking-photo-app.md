# Parking Photo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ứng dụng React Native cho phép chụp ảnh vị trí đậu xe, lưu ngoài Gallery, tự xoá sau 30 ngày.

**Architecture:** Logic nghiệp vụ (hết hạn, chọn vị trí hiện tại, dọn dẹp, nhắc nhở) là hàm thuần và một service nhận dependency qua tham số, nên test được bằng Jest với fake. Lớp native (SQLite, file, Gallery, camera, GPS, thông báo) là adapter mỏng, test tay trên máy thật. Giao diện dùng expo-router với 3 màn hình.

**Tech Stack:** Expo (dev build), TypeScript, expo-router, expo-camera, expo-location, expo-sqlite, expo-file-system, expo-media-library, expo-notifications, expo-task-manager, expo-background-task, Jest (`jest-expo`).

## Global Constraints

- Thời hạn lưu: 30 ngày kể từ `createdAt`; `expiresAt` không đổi khi bấm "Đã lấy xe".
- Ảnh lưu trong thư mục riêng của app, **không** vào Gallery, trừ khi bấm "Giữ lại".
- `expiresAt = null` nghĩa là đã giữ lại, không bao giờ tự xoá.
- `photoPath` chỉ lưu **tên file** (ví dụ `abc.jpg`), không lưu đường dẫn tuyệt đối, vì đường dẫn thư mục app trên iOS có thể đổi sau khi cập nhật app. Đường dẫn đầy đủ được ghép lúc đọc qua `files.uriFor(name)`.
- Khi xoá: xoá file trước, rồi xoá bản ghi.
- Quyền xin đúng lúc: camera và vị trí ở màn hình Chụp; thông báo sau lần chụp đầu tiên; ghi Gallery chỉ khi bấm "Giữ lại".
- Thiếu GPS thì vẫn lưu ảnh và ghi chú, chỉ ẩn nút dẫn đường.
- Giao diện tiếng Việt. Mã nguồn, tên biến, commit message dùng tiếng Anh.
- Commit: repo của bạn bật ký GPG. Nếu agent không có terminal để nhập passphrase thì dừng ở bước commit và để bạn tự commit.

## File Structure

```
app/
  _layout.tsx            # Stack + import background task
  index.tsx              # Home
  capture.tsx            # Chụp
  record/[id].tsx        # Chi tiết
src/
  domain/
    types.ts             # ParkingRecord
    expiry.ts            # RETENTION_DAYS, computeExpiresAt, daysLeft, isExpired, buildReminders
    current.ts           # pickCurrent, historyOf
  services/
    ports.ts             # ParkingRepository, PhotoFiles, Gallery interfaces
    parkingService.ts    # capture, collectCurrent, keep, deleteNow, purgeExpired, list
  native/
    db.ts                # mở SQLite + tạo bảng
    sqliteRepository.ts  # ParkingRepository bằng SQLite
    photoFiles.ts        # PhotoFiles bằng expo-file-system
    gallery.ts           # Gallery bằng expo-media-library
    location.ts          # getCoords()
    reminders.ts         # ensureNotificationPermission, syncReminders
  container.ts           # getParkingService()
  background/
    purgeTask.ts         # đăng ký background task
  hooks/
    useParking.ts        # records + refresh khi focus / foreground
tests/
  fakes.ts
  expiry.test.ts
  current.test.ts
  parkingService.test.ts
```

---

### Task 1: Khởi tạo dự án Expo và Jest

**Files:**
- Create: toàn bộ khung dự án trong `~/Desktop/parking-photo-app` (`package.json`, `app.json`, `tsconfig.json`, ...)
- Create: `tests/smoke.test.ts` (xoá sau khi xong task)

**Interfaces:**
- Produces: dự án chạy được `npm test` và `npx expo start`.

- [ ] **Step 1: Tạo khung Expo ở thư mục tạm rồi chuyển lên**

```bash
cd ~/Desktop/parking-photo-app
npx create-expo-app@latest tmp-app --template default
rm -rf tmp-app/.git
rsync -a tmp-app/ ./
rm -rf tmp-app
npm run reset-project
rm -rf app-example
```

`reset-project` tạo thư mục `app/` trống và chuyển code mẫu vào `app-example/`, ta xoá thư mục này.

- [ ] **Step 2: Cài thư viện**

```bash
npx expo install expo-camera expo-location expo-sqlite expo-file-system expo-media-library expo-notifications expo-task-manager expo-background-task
npx expo install jest-expo jest @types/jest -- --save-dev
```

- [ ] **Step 3: Cấu hình Jest trong `package.json`**

Thêm vào `scripts`: `"test": "jest"`. Thêm khối cấp cao nhất:

```json
"jest": {
  "preset": "jest-expo",
  "testMatch": ["<rootDir>/tests/**/*.test.ts"]
}
```

- [ ] **Step 4: Viết test khói và chạy**

`tests/smoke.test.ts`:

```ts
test('jest runs', () => {
  expect(1 + 1).toBe(2);
});
```

Run: `npm test`
Expected: PASS (1 test).

- [ ] **Step 5: Cấu hình quyền trong `app.json`**

Trong `expo.plugins` thêm:

```json
[
  "expo-camera",
  { "cameraPermission": "Cho phép app chụp ảnh vị trí xe của bạn." }
],
[
  "expo-location",
  { "locationWhenInUsePermission": "Cho phép app lưu vị trí xe để dẫn đường về." }
],
[
  "expo-media-library",
  {
    "photosPermission": "Cho phép app truy cập ảnh.",
    "savePhotosPermission": "Cho phép app lưu ảnh bạn chọn giữ lại vào thư viện.",
    "isAccessMediaLocationEnabled": false
  }
],
"expo-notifications",
"expo-background-task"
```

- [ ] **Step 6: Xoá test khói và commit**

```bash
rm tests/smoke.test.ts
git add -A
git commit -m "chore: scaffold Expo app with jest-expo"
```

---

### Task 2: Domain thuần (kiểu dữ liệu, hết hạn, vị trí hiện tại, nhắc nhở)

**Files:**
- Create: `src/domain/types.ts`, `src/domain/expiry.ts`, `src/domain/current.ts`
- Test: `tests/expiry.test.ts`, `tests/current.test.ts`

**Interfaces:**
- Produces:
  - `type ParkingRecord = { id: string; photoPath: string; lat: number | null; lng: number | null; note: string; createdAt: number; collectedAt: number | null; expiresAt: number | null }`
  - `RETENTION_DAYS = 30`, `DAY_MS = 86_400_000`
  - `computeExpiresAt(createdAt: number): number`
  - `daysLeft(expiresAt: number, now: number): number`
  - `isExpired(r: ParkingRecord, now: number): boolean`
  - `buildReminders(records: ParkingRecord[], now: number): { triggerAt: number; count: number }[]`
  - `pickCurrent(records: ParkingRecord[]): ParkingRecord | null`
  - `historyOf(records: ParkingRecord[]): ParkingRecord[]`

- [ ] **Step 1: Viết kiểu dữ liệu**

`src/domain/types.ts`:

```ts
export type ParkingRecord = {
  id: string;
  photoPath: string; // file name relative to the photos directory
  lat: number | null;
  lng: number | null;
  note: string;
  createdAt: number; // epoch ms
  collectedAt: number | null; // null while the car is still parked
  expiresAt: number | null; // null = kept forever
};
```

- [ ] **Step 2: Viết test thất bại cho `expiry`**

`tests/expiry.test.ts`:

```ts
import { buildReminders, computeExpiresAt, DAY_MS, daysLeft, isExpired } from '../src/domain/expiry';
import type { ParkingRecord } from '../src/domain/types';

const base: ParkingRecord = {
  id: 'a', photoPath: 'a.jpg', lat: null, lng: null, note: '',
  createdAt: 0, collectedAt: null, expiresAt: 30 * DAY_MS,
};

test('computeExpiresAt adds 30 days', () => {
  // Given a capture time
  const createdAt = 1_000;
  // When computing expiry
  // Then it is exactly 30 days later
  expect(computeExpiresAt(createdAt)).toBe(createdAt + 30 * DAY_MS);
});

test('daysLeft rounds up and never goes below zero', () => {
  // Given an expiry 1.2 days away and one already passed
  // When asking how many days are left
  // Then a partial day counts as a full day, and past expiry is 0
  expect(daysLeft(1.2 * DAY_MS, 0)).toBe(2);
  expect(daysLeft(0, 5 * DAY_MS)).toBe(0);
});

test('isExpired is true only when expiresAt has passed', () => {
  // Given records that are expired, not yet expired, and kept forever
  // When checking each
  // Then only the passed one is expired; a kept record (null) never is
  expect(isExpired({ ...base, expiresAt: 10 }, 10)).toBe(true);
  expect(isExpired({ ...base, expiresAt: 11 }, 10)).toBe(false);
  expect(isExpired({ ...base, expiresAt: null }, 10 ** 15)).toBe(false);
});

test('buildReminders groups records expiring the same day and skips past or kept ones', () => {
  // Given two records expiring on day 10, one on day 20, one kept, one whose reminder time already passed
  const records: ParkingRecord[] = [
    { ...base, id: '1', expiresAt: 10 * DAY_MS + 1000 },
    { ...base, id: '2', expiresAt: 10 * DAY_MS + 2000 },
    { ...base, id: '3', expiresAt: 20 * DAY_MS },
    { ...base, id: '4', expiresAt: null },
    { ...base, id: '5', expiresAt: DAY_MS / 2 },
  ];
  // When building reminders at time 0
  const result = buildReminders(records, 0);
  // Then same-day records are merged (earliest trigger time), ordered by time
  expect(result).toEqual([
    { triggerAt: 9 * DAY_MS + 1000, count: 2 },
    { triggerAt: 19 * DAY_MS, count: 1 },
  ]);
});
```

- [ ] **Step 3: Chạy để thấy thất bại**

Run: `npm test -- expiry`
Expected: FAIL, "Cannot find module '../src/domain/expiry'".

- [ ] **Step 4: Cài đặt `expiry.ts`**

`src/domain/expiry.ts`:

```ts
import type { ParkingRecord } from './types';

export const RETENTION_DAYS = 30;
export const DAY_MS = 86_400_000;

export function computeExpiresAt(createdAt: number): number {
  return createdAt + RETENTION_DAYS * DAY_MS;
}

export function daysLeft(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / DAY_MS));
}

export function isExpired(record: ParkingRecord, now: number): boolean {
  return record.expiresAt !== null && record.expiresAt <= now;
}

export type Reminder = { triggerAt: number; count: number };

// One reminder per calendar bucket: fires one day before the earliest expiry in
// the bucket, so a user is warned the day before photos are deleted.
export function buildReminders(records: ParkingRecord[], now: number): Reminder[] {
  const buckets = new Map<number, Reminder>();
  for (const r of records) {
    if (r.expiresAt === null) continue;
    const triggerAt = r.expiresAt - DAY_MS;
    if (triggerAt <= now) continue;
    const key = Math.floor(triggerAt / DAY_MS);
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.triggerAt = Math.min(existing.triggerAt, triggerAt);
    } else {
      buckets.set(key, { triggerAt, count: 1 });
    }
  }
  return [...buckets.values()].sort((a, b) => a.triggerAt - b.triggerAt);
}
```

- [ ] **Step 5: Chạy và xác nhận pass**

Run: `npm test -- expiry`
Expected: PASS (4 tests).

- [ ] **Step 6: Viết test thất bại cho `current`**

`tests/current.test.ts`:

```ts
import { historyOf, pickCurrent } from '../src/domain/current';
import type { ParkingRecord } from '../src/domain/types';

const rec = (id: string, createdAt: number, collectedAt: number | null): ParkingRecord => ({
  id, photoPath: `${id}.jpg`, lat: null, lng: null, note: '',
  createdAt, collectedAt, expiresAt: createdAt + 1,
});

test('pickCurrent returns the newest record that has not been collected', () => {
  // Given an old open record, a newer open record and a newer collected one
  const records = [rec('old', 1, null), rec('new', 2, null), rec('done', 3, 4)];
  // When picking the current parking spot
  // Then it is the newest open record, ignoring collected ones
  expect(pickCurrent(records)?.id).toBe('new');
});

test('pickCurrent returns null when every record is collected', () => {
  // Given only collected records
  // When picking the current spot
  // Then there is none, so Home shows the "capture" button
  expect(pickCurrent([rec('a', 1, 2)])).toBeNull();
});

test('historyOf excludes the current record and sorts newest first', () => {
  // Given a current record and two collected ones
  const records = [rec('h1', 1, 2), rec('cur', 5, null), rec('h2', 3, 4)];
  // When computing history
  // Then the current one is excluded and the rest are newest first
  expect(historyOf(records).map((r) => r.id)).toEqual(['h2', 'h1']);
});
```

- [ ] **Step 7: Chạy để thấy thất bại, rồi cài đặt**

Run: `npm test -- current` → FAIL, module not found.

`src/domain/current.ts`:

```ts
import type { ParkingRecord } from './types';

export function pickCurrent(records: ParkingRecord[]): ParkingRecord | null {
  let current: ParkingRecord | null = null;
  for (const r of records) {
    if (r.collectedAt !== null) continue;
    if (current === null || r.createdAt > current.createdAt) current = r;
  }
  return current;
}

export function historyOf(records: ParkingRecord[]): ParkingRecord[] {
  const current = pickCurrent(records);
  return records
    .filter((r) => r.id !== current?.id)
    .sort((a, b) => b.createdAt - a.createdAt);
}
```

- [ ] **Step 8: Chạy toàn bộ và commit**

Run: `npm test`
Expected: PASS (7 tests).

```bash
git add -A
git commit -m "feat: add domain logic for expiry, current spot and reminders"
```

---

### Task 3: ParkingService (capture, collect, keep, delete, purge)

**Files:**
- Create: `src/services/ports.ts`, `src/services/parkingService.ts`
- Test: `tests/fakes.ts`, `tests/parkingService.test.ts`

**Interfaces:**
- Consumes: `ParkingRecord`, `computeExpiresAt`, `isExpired`, `pickCurrent` từ Task 2.
- Produces:
  - `interface ParkingRepository { insert(r: ParkingRecord): Promise<void>; list(): Promise<ParkingRecord[]>; get(id: string): Promise<ParkingRecord | null>; setCollected(id: string, at: number): Promise<void>; setKept(id: string): Promise<void>; remove(id: string): Promise<void> }`
  - `interface PhotoFiles { save(tempUri: string, id: string): Promise<string>; remove(name: string): Promise<void>; exists(name: string): Promise<boolean>; uriFor(name: string): string }`
  - `interface Gallery { save(uri: string): Promise<void> }`
  - `createParkingService(deps: { repo; files; gallery; now: () => number; newId: () => string })` trả về `{ capture(input: { tempUri: string; lat: number | null; lng: number | null; note: string }): Promise<ParkingRecord>; collectCurrent(): Promise<string | null>; keep(id: string): Promise<void>; deleteNow(id: string): Promise<void>; purgeExpired(): Promise<number>; list(): Promise<ParkingRecord[]> }`

- [ ] **Step 1: Viết ports**

`src/services/ports.ts`:

```ts
import type { ParkingRecord } from '../domain/types';

export interface ParkingRepository {
  insert(record: ParkingRecord): Promise<void>;
  list(): Promise<ParkingRecord[]>;
  get(id: string): Promise<ParkingRecord | null>;
  setCollected(id: string, at: number): Promise<void>;
  setKept(id: string): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface PhotoFiles {
  /** Copies the photo into app storage and returns its file name. */
  save(tempUri: string, id: string): Promise<string>;
  /** Idempotent: no error if the file is already gone. */
  remove(name: string): Promise<void>;
  exists(name: string): Promise<boolean>;
  uriFor(name: string): string;
}

export interface Gallery {
  save(uri: string): Promise<void>;
}
```

- [ ] **Step 2: Viết fake dùng chung cho test**

`tests/fakes.ts`:

```ts
import type { ParkingRecord } from '../src/domain/types';
import type { Gallery, ParkingRepository, PhotoFiles } from '../src/services/ports';

export class FakeRepo implements ParkingRepository {
  rows = new Map<string, ParkingRecord>();
  failInsert = false;
  async insert(r: ParkingRecord) {
    if (this.failInsert) throw new Error('insert failed');
    this.rows.set(r.id, { ...r });
  }
  async list() { return [...this.rows.values()].map((r) => ({ ...r })); }
  async get(id: string) { const r = this.rows.get(id); return r ? { ...r } : null; }
  async setCollected(id: string, at: number) { this.rows.get(id)!.collectedAt = at; }
  async setKept(id: string) { this.rows.get(id)!.expiresAt = null; }
  async remove(id: string) { this.rows.delete(id); }
}

export class FakeFiles implements PhotoFiles {
  names = new Set<string>();
  async save(_tempUri: string, id: string) { const n = `${id}.jpg`; this.names.add(n); return n; }
  async remove(name: string) { this.names.delete(name); }
  async exists(name: string) { return this.names.has(name); }
  uriFor(name: string) { return `file:///photos/${name}`; }
}

export class FakeGallery implements Gallery {
  saved: string[] = [];
  fail = false;
  async save(uri: string) {
    if (this.fail) throw new Error('no permission');
    this.saved.push(uri);
  }
}
```

- [ ] **Step 3: Viết test thất bại**

`tests/parkingService.test.ts`:

```ts
import { DAY_MS } from '../src/domain/expiry';
import { createParkingService } from '../src/services/parkingService';
import { FakeFiles, FakeGallery, FakeRepo } from './fakes';

function setup(start = 1_000) {
  const repo = new FakeRepo();
  const files = new FakeFiles();
  const gallery = new FakeGallery();
  let t = start;
  let n = 0;
  const service = createParkingService({
    repo, files, gallery, now: () => t, newId: () => `id${++n}`,
  });
  return { repo, files, gallery, service, setNow: (v: number) => { t = v; } };
}

const shot = { tempUri: 'tmp.jpg', lat: 10, lng: 20, note: '  B2, cột 14  ' };

test('capture saves the photo, trims the note and sets a 30-day expiry', async () => {
  // Given an empty app
  const { service, files } = setup(1_000);
  // When the user captures a spot
  const rec = await service.capture(shot);
  // Then the record has a trimmed note, expiry 30 days later, is not collected, and its file exists
  expect(rec.note).toBe('B2, cột 14');
  expect(rec.expiresAt).toBe(1_000 + 30 * DAY_MS);
  expect(rec.collectedAt).toBeNull();
  expect(await files.exists(rec.photoPath)).toBe(true);
});

test('capture marks a previously open record as collected', async () => {
  // Given an earlier spot the user never marked as collected
  const { service, repo, setNow } = setup(1_000);
  const first = await service.capture(shot);
  // When the user captures a new spot later
  setNow(5_000);
  await service.capture(shot);
  // Then the earlier spot is auto-collected at the new capture time
  expect((await repo.get(first.id))!.collectedAt).toBe(5_000);
});

test('capture removes the saved file and leaves the old spot open when insert fails', async () => {
  // Given an open spot, and a database that will fail the next insert
  const { service, repo, files } = setup();
  const first = await service.capture(shot);
  repo.failInsert = true;
  // When capturing again
  // Then it throws, the new file is cleaned up, and the old spot stays open
  await expect(service.capture(shot)).rejects.toThrow('insert failed');
  expect(files.names.size).toBe(1);
  expect((await repo.get(first.id))!.collectedAt).toBeNull();
});

test('collectCurrent marks the current spot collected but keeps its expiry', async () => {
  // Given one open spot
  const { service, repo, setNow } = setup(1_000);
  const rec = await service.capture(shot);
  // When the user taps "Đã lấy xe"
  setNow(2_000);
  const id = await service.collectCurrent();
  // Then it is collected now, and expiresAt is unchanged
  const after = (await repo.get(rec.id))!;
  expect(id).toBe(rec.id);
  expect(after.collectedAt).toBe(2_000);
  expect(after.expiresAt).toBe(rec.expiresAt);
});

test('collectCurrent returns null when nothing is parked', async () => {
  // Given no records
  // When collecting
  // Then nothing happens
  expect(await setup().service.collectCurrent()).toBeNull();
});

test('purgeExpired deletes expired records and their files, keeps the rest', async () => {
  // Given one record that will be expired and one that will not
  const { service, repo, files, setNow } = setup(0);
  const old = await service.capture(shot);
  setNow(20 * DAY_MS);
  const fresh = await service.capture(shot);
  // When 31 days after the first capture, we purge
  setNow(31 * DAY_MS);
  const removed = await service.purgeExpired();
  // Then only the old record and its file are gone
  expect(removed).toBe(1);
  expect(await repo.get(old.id)).toBeNull();
  expect(await files.exists(old.photoPath)).toBe(false);
  expect(await repo.get(fresh.id)).not.toBeNull();
  expect(await files.exists(fresh.photoPath)).toBe(true);
});

test('purgeExpired drops records whose file is missing', async () => {
  // Given a record whose photo file vanished
  const { service, repo, files } = setup(0);
  const rec = await service.capture(shot);
  await files.remove(rec.photoPath);
  // When purging, even though it is not expired
  await service.purgeExpired();
  // Then the dangling record is removed
  expect(await repo.get(rec.id)).toBeNull();
});

test('purgeExpired never deletes a kept record', async () => {
  // Given a record the user kept (expiresAt = null)
  const { service, repo, setNow } = setup(0);
  const rec = await service.capture(shot);
  await service.keep(rec.id);
  // When a year passes and we purge
  setNow(365 * DAY_MS);
  await service.purgeExpired();
  // Then it is still there
  expect(await repo.get(rec.id)).not.toBeNull();
});

test('keep saves to the gallery and clears the expiry', async () => {
  // Given a record
  const { service, repo, gallery } = setup();
  const rec = await service.capture(shot);
  // When the user taps "Giữ lại"
  await service.keep(rec.id);
  // Then the photo is saved to the gallery and the record no longer expires
  expect(gallery.saved).toEqual([`file:///photos/${rec.photoPath}`]);
  expect((await repo.get(rec.id))!.expiresAt).toBeNull();
});

test('keep leaves the expiry untouched if saving to the gallery fails', async () => {
  // Given the gallery permission is denied
  const { service, repo, gallery } = setup();
  const rec = await service.capture(shot);
  gallery.fail = true;
  // When keeping
  // Then it throws and the record is still scheduled for deletion
  await expect(service.keep(rec.id)).rejects.toThrow('no permission');
  expect((await repo.get(rec.id))!.expiresAt).toBe(rec.expiresAt);
});

test('deleteNow removes the file and the record', async () => {
  // Given a record
  const { service, repo, files } = setup();
  const rec = await service.capture(shot);
  // When deleting immediately
  await service.deleteNow(rec.id);
  // Then both file and record are gone
  expect(await repo.get(rec.id)).toBeNull();
  expect(await files.exists(rec.photoPath)).toBe(false);
});
```

- [ ] **Step 4: Chạy để thấy thất bại**

Run: `npm test -- parkingService`
Expected: FAIL, module '../src/services/parkingService' not found.

- [ ] **Step 5: Cài đặt service**

`src/services/parkingService.ts`:

```ts
import { pickCurrent } from '../domain/current';
import { computeExpiresAt, isExpired } from '../domain/expiry';
import type { ParkingRecord } from '../domain/types';
import type { Gallery, ParkingRepository, PhotoFiles } from './ports';

type Deps = {
  repo: ParkingRepository;
  files: PhotoFiles;
  gallery: Gallery;
  now: () => number;
  newId: () => string;
};

export type CaptureInput = {
  tempUri: string;
  lat: number | null;
  lng: number | null;
  note: string;
};

export function createParkingService({ repo, files, gallery, now, newId }: Deps) {
  return {
    async capture(input: CaptureInput): Promise<ParkingRecord> {
      const id = newId();
      const createdAt = now();
      const photoPath = await files.save(input.tempUri, id);
      const record: ParkingRecord = {
        id,
        photoPath,
        lat: input.lat,
        lng: input.lng,
        note: input.note.trim(),
        createdAt,
        collectedAt: null,
        expiresAt: computeExpiresAt(createdAt),
      };
      const previouslyOpen = (await repo.list()).filter((r) => r.collectedAt === null);
      try {
        await repo.insert(record);
      } catch (error) {
        await files.remove(photoPath);
        throw error;
      }
      for (const r of previouslyOpen) await repo.setCollected(r.id, createdAt);
      return record;
    },

    async collectCurrent(): Promise<string | null> {
      const current = pickCurrent(await repo.list());
      if (!current) return null;
      await repo.setCollected(current.id, now());
      return current.id;
    },

    async keep(id: string): Promise<void> {
      const record = await repo.get(id);
      if (!record) return;
      await gallery.save(files.uriFor(record.photoPath));
      await repo.setKept(id);
    },

    async deleteNow(id: string): Promise<void> {
      const record = await repo.get(id);
      if (!record) return;
      await files.remove(record.photoPath);
      await repo.remove(id);
    },

    async purgeExpired(): Promise<number> {
      const t = now();
      let removed = 0;
      for (const r of await repo.list()) {
        const missing = !(await files.exists(r.photoPath));
        if (isExpired(r, t) || missing) {
          await files.remove(r.photoPath);
          await repo.remove(r.id);
          removed += 1;
        }
      }
      return removed;
    },

    list: () => repo.list(),
  };
}

export type ParkingService = ReturnType<typeof createParkingService>;
```

- [ ] **Step 6: Chạy và xác nhận pass, rồi commit**

Run: `npm test`
Expected: PASS (18 tests).

```bash
git add -A
git commit -m "feat: add parking service with capture, keep, delete and purge"
```

---

### Task 4: Adapter native và container

**Files:**
- Create: `src/native/db.ts`, `src/native/sqliteRepository.ts`, `src/native/photoFiles.ts`, `src/native/gallery.ts`, `src/container.ts`
- Modify: `docs/superpowers/specs/2026-11-17-parking-photo-app-design.md` (dòng `photoPath`)

**Interfaces:**
- Consumes: `ParkingRepository`, `PhotoFiles`, `Gallery`, `createParkingService` từ Task 3.
- Produces: `getParkingService(): Promise<ParkingService>` và `getPhotoFiles(): PhotoFiles` (singleton) trong `src/container.ts`.

Các adapter này phụ thuộc module native nên không test bằng Jest; kiểm chứng ở Task 5 trên máy thật.

- [ ] **Step 1: Mở DB và tạo bảng**

`src/native/db.ts`:

```ts
import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('parking.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS parking_records (
      id TEXT PRIMARY KEY NOT NULL,
      photoPath TEXT NOT NULL,
      lat REAL,
      lng REAL,
      note TEXT NOT NULL DEFAULT '',
      createdAt INTEGER NOT NULL,
      collectedAt INTEGER,
      expiresAt INTEGER
    );
  `);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= open();
  return dbPromise;
}
```

- [ ] **Step 2: Repository SQLite**

`src/native/sqliteRepository.ts`:

```ts
import type { SQLiteDatabase } from 'expo-sqlite';
import type { ParkingRecord } from '../domain/types';
import type { ParkingRepository } from '../services/ports';

export function createSqliteRepository(db: SQLiteDatabase): ParkingRepository {
  return {
    async insert(r: ParkingRecord) {
      await db.runAsync(
        `INSERT INTO parking_records
           (id, photoPath, lat, lng, note, createdAt, collectedAt, expiresAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        r.id, r.photoPath, r.lat, r.lng, r.note, r.createdAt, r.collectedAt, r.expiresAt,
      );
    },
    list() {
      return db.getAllAsync<ParkingRecord>('SELECT * FROM parking_records ORDER BY createdAt DESC');
    },
    async get(id: string) {
      return (await db.getFirstAsync<ParkingRecord>('SELECT * FROM parking_records WHERE id = ?', id)) ?? null;
    },
    async setCollected(id: string, at: number) {
      await db.runAsync('UPDATE parking_records SET collectedAt = ? WHERE id = ?', at, id);
    },
    async setKept(id: string) {
      await db.runAsync('UPDATE parking_records SET expiresAt = NULL WHERE id = ?', id);
    },
    async remove(id: string) {
      await db.runAsync('DELETE FROM parking_records WHERE id = ?', id);
    },
  };
}
```

- [ ] **Step 3: PhotoFiles bằng expo-file-system**

`src/native/photoFiles.ts`:

```ts
import * as FileSystem from 'expo-file-system/legacy';
import type { PhotoFiles } from '../services/ports';

const DIR = `${FileSystem.documentDirectory}parking/`;

async function ensureDir() {
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
}

export const photoFiles: PhotoFiles = {
  async save(tempUri, id) {
    await ensureDir();
    const name = `${id}.jpg`;
    await FileSystem.copyAsync({ from: tempUri, to: DIR + name });
    return name;
  },
  async remove(name) {
    await FileSystem.deleteAsync(DIR + name, { idempotent: true });
  },
  async exists(name) {
    return (await FileSystem.getInfoAsync(DIR + name)).exists;
  },
  uriFor(name) {
    return DIR + name;
  },
};
```

Nếu phiên bản Expo SDK đã cài không có đường dẫn `expo-file-system/legacy` thì đổi import thành `expo-file-system` (API cũ có cùng các hàm `copyAsync`, `deleteAsync`, `getInfoAsync`, `makeDirectoryAsync`). Kiểm tra bằng `npx tsc --noEmit`.

- [ ] **Step 4: Gallery bằng expo-media-library**

`src/native/gallery.ts`:

```ts
import * as MediaLibrary from 'expo-media-library';
import type { Gallery } from '../services/ports';

export const gallery: Gallery = {
  async save(uri) {
    const permission = await MediaLibrary.requestPermissionsAsync(true);
    if (!permission.granted) throw new Error('Gallery permission denied');
    await MediaLibrary.saveToLibraryAsync(uri);
  },
};
```

- [ ] **Step 5: Container**

`src/container.ts`:

```ts
import { gallery } from './native/gallery';
import { getDb } from './native/db';
import { photoFiles } from './native/photoFiles';
import { createSqliteRepository } from './native/sqliteRepository';
import { createParkingService, type ParkingService } from './services/parkingService';

let servicePromise: Promise<ParkingService> | null = null;

export function getParkingService(): Promise<ParkingService> {
  servicePromise ??= getDb().then((db) =>
    createParkingService({
      repo: createSqliteRepository(db),
      files: photoFiles,
      gallery,
      now: () => Date.now(),
      newId: () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    }),
  );
  return servicePromise;
}

export const getPhotoFiles = () => photoFiles;
```

- [ ] **Step 6: Cập nhật spec cho khớp**

Trong spec, đổi dòng `| \`photoPath\` | đường dẫn file ảnh trong thư mục app |` thành `| \`photoPath\` | tên file ảnh (đường dẫn thư mục app được ghép lúc đọc, vì đường dẫn tuyệt đối có thể đổi trên iOS) |`.

- [ ] **Step 7: Kiểm tra kiểu và commit**

Run: `npx tsc --noEmit`
Expected: không có lỗi.

```bash
git add -A
git commit -m "feat: add native adapters for sqlite, files and gallery"
```

---

### Task 5: Màn hình Chụp (camera, GPS, ghi chú, lưu)

**Files:**
- Create: `src/native/location.ts`, `src/native/reminders.ts`, `app/capture.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `getParkingService()` (Task 4), `buildReminders` (Task 2).
- Produces:
  - `getCoords(): Promise<{ lat: number; lng: number } | null>`
  - `syncReminders(records: ParkingRecord[], now: number): Promise<void>`
  - `ensureNotificationPermission(): Promise<boolean>`

- [ ] **Step 1: GPS**

`src/native/location.ts`:

```ts
import * as Location from 'expo-location';

const TIMEOUT_MS = 8_000;

export async function getCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return null;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);
    if (!position) return null;
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Thông báo nhắc**

`src/native/reminders.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { buildReminders } from '../domain/expiry';
import type { ParkingRecord } from '../domain/types';

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function syncReminders(records: ParkingRecord[], now: number): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of buildReminders(records, now)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ảnh vị trí xe sắp bị xoá',
        body: `${reminder.count} ảnh sẽ bị xoá vào ngày mai. Mở app để giữ lại.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.triggerAt),
      },
    });
  }
}
```

- [ ] **Step 3: Màn hình Chụp**

`app/capture.tsx`:

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { getParkingService } from '../src/container';
import { getCoords } from '../src/native/location';
import { ensureNotificationPermission } from '../src/native/reminders';

type Coords = { lat: number; lng: number } | null;

export default function CaptureScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  if (!permission) return <ActivityIndicator style={styles.center} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>App cần quyền camera để chụp vị trí xe.</Text>
        <Button title="Cho phép camera" onPress={requestPermission} />
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
        [{ text: 'Tiếp tục', onPress: () => ensureNotificationPermission().then(() => resolve()) }],
      );
    });
  }

  async function save() {
    if (!photoUri) return;
    setBusy(true);
    try {
      const service = await getParkingService();
      await service.capture({
        tempUri: photoUri,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        note,
      });
      await askNotificationOnce();
      router.back();
    } catch {
      Alert.alert('Không lưu được ảnh', 'Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  }

  if (photoUri) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
        <Text style={styles.gps}>
          {coords ? 'Đã lấy vị trí GPS' : 'Không lấy được GPS, sẽ không có dẫn đường'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ghi chú (ví dụ: B2, cột 14)"
          value={note}
          onChangeText={setNote}
          maxLength={80}
        />
        <Button title={busy ? 'Đang lưu...' : 'Lưu'} onPress={save} disabled={busy} />
        <Button title="Chụp lại" onPress={() => setPhotoUri(null)} disabled={busy} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <Button title={busy ? 'Đang chụp...' : 'Chụp'} onPress={takePhoto} disabled={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  message: { textAlign: 'center' },
  camera: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  preview: { flex: 1, borderRadius: 12 },
  gps: { color: '#666' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
});
```

Cài `expo-image` nếu chưa có: `npx expo install expo-image`.

- [ ] **Step 4: Layout gốc tạm thời**

`app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Xe của tôi' }} />
      <Stack.Screen name="capture" options={{ title: 'Chụp vị trí xe' }} />
      <Stack.Screen name="record/[id]" options={{ title: 'Chi tiết' }} />
    </Stack>
  );
}
```

`app/index.tsx` tạm (sẽ thay ở Task 6):

```tsx
import { Link } from 'expo-router';
import { View } from 'react-native';

export default function Home() {
  return (
    <View style={{ padding: 24 }}>
      <Link href="/capture">Chụp vị trí xe</Link>
    </View>
  );
}
```

- [ ] **Step 5: Kiểm tra kiểu và test tay trên máy thật**

Run: `npx tsc --noEmit` → không lỗi.
Build dev client: `npx expo run:ios --device` (hoặc `run:android`). Mở app, bấm "Chụp vị trí xe", cho phép camera và vị trí, chụp, nhập ghi chú, bấm Lưu.
Expected: app quay về Home, hiện lời nhắc cho phép thông báo ở lần lưu đầu, không có lỗi đỏ. Kiểm tra ảnh **không** xuất hiện trong ứng dụng Ảnh/Gallery.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add capture screen with camera, GPS and note"
```

---

### Task 6: Home (xe hiện tại, lịch sử) và hook dữ liệu

**Files:**
- Create: `src/hooks/useParking.ts`
- Modify: `app/index.tsx`
- Modify: `docs/superpowers/specs/2026-11-17-parking-photo-app-design.md` (bỏ "bản đồ nhỏ")

**Interfaces:**
- Consumes: `getParkingService`, `getPhotoFiles` (Task 4); `pickCurrent`, `historyOf` (Task 2); `daysLeft` (Task 2); `syncReminders` (Task 5).
- Produces: `useParking(): { records: ParkingRecord[]; refresh: () => Promise<void> }` (Task 7 và 8 dùng).

- [ ] **Step 1: Hook**

`src/hooks/useParking.ts`:

```ts
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getParkingService } from '../container';
import type { ParkingRecord } from '../domain/types';
import { syncReminders } from '../native/reminders';

export function useParking() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);

  const refresh = useCallback(async () => {
    const service = await getParkingService();
    await service.purgeExpired();
    const list = await service.list();
    setRecords(list);
    await syncReminders(list, Date.now());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return { records, refresh };
}
```

- [ ] **Step 2: Màn hình Home**

`app/index.tsx`:

```tsx
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { Alert, Button, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { getParkingService, getPhotoFiles } from '../src/container';
import { historyOf, pickCurrent } from '../src/domain/current';
import { daysLeft } from '../src/domain/expiry';
import type { ParkingRecord } from '../src/domain/types';
import { useParking } from '../src/hooks/useParking';
import { directionsUrl } from '../src/native/directions';

function timeAgo(from: number): string {
  const minutes = Math.floor((Date.now() - from) / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function expiryLabel(record: ParkingRecord): string {
  return record.expiresAt === null
    ? 'Đã giữ lại'
    : `Tự xoá sau ${daysLeft(record.expiresAt, Date.now())} ngày`;
}

export default function Home() {
  const router = useRouter();
  const { records, refresh } = useParking();
  const files = getPhotoFiles();
  const current = pickCurrent(records);
  const history = historyOf(records);

  async function collect() {
    try {
      await (await getParkingService()).collectCurrent();
      await refresh();
    } catch {
      Alert.alert('Có lỗi xảy ra', 'Vui lòng thử lại.');
    }
  }

  const header = current ? (
    <View style={styles.card}>
      <Text style={styles.title}>Xe đang ở đây</Text>
      <Link href={{ pathname: '/record/[id]', params: { id: current.id } }} asChild>
        <Pressable>
          <Image source={{ uri: files.uriFor(current.photoPath) }} style={styles.hero} contentFit="cover" />
        </Pressable>
      </Link>
      {current.note ? <Text style={styles.note}>{current.note}</Text> : null}
      <Text style={styles.meta}>Đã đậu {timeAgo(current.createdAt)}</Text>
      {current.lat !== null && current.lng !== null ? (
        <Button
          title="Dẫn đường về xe"
          onPress={() => Linking.openURL(directionsUrl(current.lat!, current.lng!))}
        />
      ) : null}
      <Button title="Đã lấy xe" onPress={collect} />
    </View>
  ) : (
    <View style={styles.card}>
      <Button title="Chụp vị trí xe" onPress={() => router.push('/capture')} />
    </View>
  );

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          {header}
          {current ? <Button title="Chụp vị trí mới" onPress={() => router.push('/capture')} /> : null}
          <Text style={styles.section}>Lịch sử</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.meta}>Chưa có lịch sử.</Text>}
      renderItem={({ item }) => (
        <Link href={{ pathname: '/record/[id]', params: { id: item.id } }} asChild>
          <Pressable style={styles.row}>
            <Image source={{ uri: files.uriFor(item.photoPath) }} style={styles.thumb} contentFit="cover" />
            <View style={styles.rowText}>
              <Text>{item.note || 'Không có ghi chú'}</Text>
              <Text style={styles.meta}>{expiryLabel(item)}</Text>
            </View>
          </Pressable>
        </Link>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  card: { gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  title: { fontSize: 18, fontWeight: '600' },
  hero: { width: '100%', height: 220, borderRadius: 8 },
  note: { fontSize: 16 },
  meta: { color: '#666' },
  section: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 64, height: 64, borderRadius: 8 },
  rowText: { flex: 1, gap: 2 },
});
```

Tạo thêm `src/native/directions.ts` (dùng chung với màn hình Chi tiết ở Task 7):

`src/native/directions.ts`:

```ts
import { Platform } from 'react-native';

export function directionsUrl(lat: number, lng: number): string {
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
```

- [ ] **Step 3: Cập nhật spec**

Trong spec, mục "Chi tiết ảnh", đổi "bản đồ nhỏ" thành "toạ độ và nút **Mở bản đồ**" (MVP không nhúng bản đồ để tránh thêm thư viện bản đồ).

- [ ] **Step 4: Kiểm tra và test tay**

Run: `npx tsc --noEmit` → không lỗi.
Test tay: chụp một vị trí, Home hiện thẻ "Xe đang ở đây" với ảnh, ghi chú, "Đã đậu vừa xong". Bấm "Dẫn đường về xe" mở bản đồ. Bấm "Đã lấy xe" thì thẻ đổi thành nút "Chụp vị trí xe" và ảnh xuất hiện ở Lịch sử với "Tự xoá sau 30 ngày". Chụp lần 2 khi lần 1 chưa bấm "Đã lấy xe" thì lần 1 tự chuyển xuống Lịch sử.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add home screen with current spot and history"
```

---

### Task 7: Màn hình Chi tiết (Giữ lại, Xoá ngay)

**Files:**
- Create: `app/record/[id].tsx`

**Interfaces:**
- Consumes: `useParking` (Task 6), `getParkingService`, `getPhotoFiles` (Task 4), `directionsUrl` (Task 6), `daysLeft` (Task 2).

- [ ] **Step 1: Cài đặt màn hình**

`app/record/[id].tsx`:

```tsx
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Button, Linking, ScrollView, StyleSheet, Text } from 'react-native';
import { getParkingService, getPhotoFiles } from '../../src/container';
import { daysLeft } from '../../src/domain/expiry';
import { useParking } from '../../src/hooks/useParking';
import { directionsUrl } from '../../src/native/directions';

export default function RecordDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { records, refresh } = useParking();
  const record = records.find((r) => r.id === id);

  if (!record) return <Text style={styles.message}>Ảnh không còn tồn tại.</Text>;

  const uri = getPhotoFiles().uriFor(record.photoPath);

  async function keep() {
    try {
      await (await getParkingService()).keep(record!.id);
      await refresh();
      Alert.alert('Đã giữ lại', 'Ảnh đã được lưu vào thư viện và sẽ không bị tự xoá.');
    } catch {
      Alert.alert('Không giữ lại được', 'Hãy cho phép app lưu ảnh vào thư viện trong Cài đặt.');
    }
  }

  function confirmDelete() {
    Alert.alert('Xoá ảnh này?', 'Ảnh sẽ bị xoá ngay.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await (await getParkingService()).deleteNow(record!.id);
            router.back();
          } catch {
            Alert.alert('Không xoá được', 'Vui lòng thử lại.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri }} style={styles.photo} contentFit="contain" />
      {record.note ? <Text style={styles.note}>{record.note}</Text> : null}
      <Text style={styles.meta}>Chụp lúc {new Date(record.createdAt).toLocaleString('vi-VN')}</Text>
      <Text style={styles.meta}>
        {record.expiresAt === null
          ? 'Đã giữ lại, không tự xoá'
          : `Tự xoá sau ${daysLeft(record.expiresAt, Date.now())} ngày (${new Date(record.expiresAt).toLocaleDateString('vi-VN')})`}
      </Text>
      {record.lat !== null && record.lng !== null ? (
        <>
          <Text style={styles.meta}>
            Toạ độ: {record.lat.toFixed(5)}, {record.lng.toFixed(5)}
          </Text>
          <Button
            title="Mở bản đồ"
            onPress={() => Linking.openURL(directionsUrl(record.lat!, record.lng!))}
          />
        </>
      ) : null}
      {record.expiresAt !== null ? <Button title="Giữ lại" onPress={keep} /> : null}
      <Button title="Xoá ngay" color="#c00" onPress={confirmDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  photo: { width: '100%', height: 360, borderRadius: 8 },
  note: { fontSize: 18, fontWeight: '600' },
  meta: { color: '#666' },
  message: { padding: 24, textAlign: 'center' },
});
```

- [ ] **Step 2: Kiểm tra và test tay**

Run: `npx tsc --noEmit` → không lỗi.
Test tay: mở một ảnh từ Lịch sử. Bấm "Giữ lại", cho phép quyền, xác nhận ảnh xuất hiện trong Gallery và màn hình đổi thành "Đã giữ lại". Từ chối quyền thì hiện cảnh báo và ảnh vẫn còn hạn xoá. Bấm "Xoá ngay" thì ảnh biến khỏi danh sách.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add detail screen with keep and delete actions"
```

---

### Task 8: Dọn dẹp nền và kiểm tra tự xoá cuối-cùng

**Files:**
- Create: `src/background/purgeTask.ts`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `getParkingService` (Task 4), `syncReminders` (Task 5).

- [ ] **Step 1: Task nền**

`src/background/purgeTask.ts`:

```ts
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { getParkingService } from '../container';
import { syncReminders } from '../native/reminders';

const TASK_NAME = 'purge-expired-parking-photos';

// Must be defined at module top level so it exists when the OS wakes the app.
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const service = await getParkingService();
    await service.purgeExpired();
    await syncReminders(await service.list(), Date.now());
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerPurgeTask(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) return;
  await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 60 * 24 });
}
```

`minimumInterval` tính bằng phút (mỗi ngày một lần). Hệ điều hành quyết định thời điểm chạy thật, nên đây chỉ là cơ chế phụ; cơ chế chính vẫn là `purgeExpired()` khi mở app (đã có trong `useParking`).

- [ ] **Step 2: Đăng ký trong layout**

`app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { registerPurgeTask } from '../src/background/purgeTask';

export default function RootLayout() {
  useEffect(() => {
    registerPurgeTask().catch(() => {});
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Xe của tôi' }} />
      <Stack.Screen name="capture" options={{ title: 'Chụp vị trí xe' }} />
      <Stack.Screen name="record/[id]" options={{ title: 'Chi tiết' }} />
    </Stack>
  );
}
```

Việc import `purgeTask` qua `registerPurgeTask` đủ để `defineTask` chạy ở top level khi module được nạp.

- [ ] **Step 3: Kiểm tra tự xoá bằng cách giả lập thời gian**

Tạm thời trong `src/container.ts` đổi `now: () => Date.now()` thành `now: () => Date.now() + 31 * 86_400_000`, chạy lại app. Mọi ảnh cũ phải biến mất khỏi danh sách và file bị xoá khỏi thư mục app. Sau khi kiểm tra, **hoàn nguyên** thay đổi này.

Run: `git diff src/container.ts`
Expected: không còn thay đổi nào.

- [ ] **Step 4: Chạy toàn bộ test, kiểm tra kiểu, commit**

Run: `npm test && npx tsc --noEmit`
Expected: PASS (18 tests), không lỗi kiểu.

```bash
git add -A
git commit -m "feat: add background purge task"
```

- [ ] **Step 5: Danh sách kiểm tra cuối trên máy thật**

- Ảnh chụp không xuất hiện trong Gallery.
- Từ chối quyền vị trí thì vẫn lưu được ảnh, không có nút dẫn đường.
- Từ chối quyền thông báo thì app vẫn chạy bình thường.
- Mở lại app sau khi tắt hẳn vẫn thấy dữ liệu.
- Thông báo nhắc xuất hiện (có thể kiểm tra nhanh bằng cách tạm đặt thời hạn ngắn trong `computeExpiresAt`, rồi hoàn nguyên).
