import { historyOf, pickCurrent } from '../src/domain/current';
import type { ParkingRecord } from '../src/domain/types';

const rec = (id: string, createdAt: number, collectedAt: number | null): ParkingRecord => ({
  id,
  photoPath: `${id}.jpg`,
  lat: null,
  lng: null,
  note: '',
  createdAt,
  collectedAt,
  expiresAt: createdAt + 1,
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
