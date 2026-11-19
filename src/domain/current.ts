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
  return records.filter((r) => r.id !== current?.id).sort((a, b) => b.createdAt - a.createdAt);
}
