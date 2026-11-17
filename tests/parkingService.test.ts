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
