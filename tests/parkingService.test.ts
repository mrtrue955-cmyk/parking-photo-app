import { DAY_MS } from '../src/domain/expiry';
import { createParkingService } from '../src/services/parkingService';
import { FakeFiles, FakeGallery, FakeRepo, FakeSettings } from './fakes';

function setup(start = 1_000) {
  const repo = new FakeRepo();
  const files = new FakeFiles();
  const gallery = new FakeGallery();
  const settings = new FakeSettings();
  let t = start;
  let n = 0;
  const service = createParkingService({
    repo,
    files,
    gallery,
    settings,
    now: () => t,
    newId: () => `id${++n}`,
  });
  return {
    repo,
    files,
    gallery,
    settings,
    service,
    setNow: (v: number) => {
      t = v;
    },
  };
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

test('capture removes the saved file and throws when listing records fails', async () => {
  // Given a database that cannot list records
  const { service, repo, files } = setup();
  repo.failList = true;
  // When capturing a spot
  // Then it throws and the saved photo is cleaned up, so no file is orphaned
  await expect(service.capture(shot)).rejects.toThrow('list failed');
  expect(files.names.size).toBe(0);
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

test('purgeExpired still removes other expired records when one removal throws', async () => {
  // Given two expired records, where removing the first one fails
  const { service, repo, files, setNow } = setup(0);
  const failing = await service.capture(shot);
  const other = await service.capture(shot);
  repo.failRemoveIds.add(failing.id);
  // When purging 31 days later
  setNow(31 * DAY_MS);
  const removed = await service.purgeExpired();
  // Then the failing record is kept for a later run, the other is removed, and only the success is counted
  expect(removed).toBe(1);
  expect(await repo.get(failing.id)).not.toBeNull();
  expect(await repo.get(other.id)).toBeNull();
  expect(await files.exists(other.photoPath)).toBe(false);
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

test('keep on an already-kept record does not save to the gallery again', async () => {
  // Given a record that was already kept once
  const { service, repo, gallery } = setup();
  const rec = await service.capture(shot);
  await service.keep(rec.id);
  // When the user keeps it a second time (e.g. a double tap)
  await service.keep(rec.id);
  // Then the gallery has no duplicate and the record stays kept
  expect(gallery.saved).toHaveLength(1);
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

test('capture honours the retention setting', async () => {
  const { service, settings } = setup(1_000);
  await settings.save({ ...settings.current, retentionDays: 7 });
  const rec = await service.capture(shot);
  expect(rec.expiresAt).toBe(1_000 + 7 * DAY_MS);
});

test('updateSettings re-anchors expiries but leaves kept photos alone', async () => {
  const { service, settings, setNow } = setup(1_000);
  const first = await service.capture(shot);
  setNow(2_000);
  const kept = await service.capture({ ...shot, tempUri: 'tmp2.jpg' });
  await service.keep(kept.id);
  const next = await service.updateSettings({ retentionDays: 7 });
  expect(next.retentionDays).toBe(7);
  const rows = await service.list();
  const reanchored = rows.find((r) => r.id === first.id)!;
  const stillKept = rows.find((r) => r.id === kept.id)!;
  expect(reanchored.expiresAt).toBe(first.createdAt + 7 * DAY_MS);
  expect(stillKept.expiresAt).toBeNull();
  expect((await settings.load()).retentionDays).toBe(7);
});

test('updateSettings keeps unrelated settings intact', async () => {
  const { service } = setup();
  const next = await service.updateSettings({ remindersEnabled: false });
  expect(next.retentionDays).toBe(30);
  expect(next.remindersEnabled).toBe(false);
});

test('updateNote trims and ignores unknown ids', async () => {
  const { service, repo } = setup();
  const rec = await service.capture(shot);
  await service.updateNote(rec.id, '  B3 · cột 7  ');
  expect((await repo.get(rec.id))!.note).toBe('B3 · cột 7');
  await expect(service.updateNote('missing', 'x')).resolves.toBeUndefined();
});

test('deleteAll removes every row and photo file', async () => {
  const { service, repo, files } = setup();
  const a = await service.capture(shot);
  await service.capture({ ...shot, tempUri: 'tmp2.jpg' });
  const removed = await service.deleteAll();
  expect(removed).toBe(2);
  expect(await repo.list()).toEqual([]);
  expect(await files.exists(a.photoPath)).toBe(false);
});

test('capture stores the meter limit', async () => {
  const { service } = setup(1_000);
  const rec = await service.capture({ ...shot, parkedUntil: 1_000 + 3_600_000 });
  expect(rec.parkedUntil).toBe(1_000 + 3_600_000);
});

test('capture without a limit stores null', async () => {
  const { service } = setup(1_000);
  const rec = await service.capture(shot);
  expect(rec.parkedUntil).toBeNull();
});

test('endSession clears only the limit', async () => {
  const { service, repo } = setup(1_000);
  const rec = await service.capture({ ...shot, parkedUntil: 9_999 });
  await service.capture({ ...shot, tempUri: 'tmp2.jpg' });
  await service.endSession(rec.id);
  const stored = await repo.get(rec.id);
  expect(stored!.parkedUntil).toBeNull();
  expect(stored!.expiresAt).not.toBeNull();
});

test('endSession ignores unknown ids', async () => {
  const { service } = setup();
  await expect(service.endSession('missing')).resolves.toBeUndefined();
});
