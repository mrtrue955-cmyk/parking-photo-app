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
        r.id,
        r.photoPath,
        r.lat,
        r.lng,
        r.note,
        r.createdAt,
        r.collectedAt,
        r.expiresAt,
      );
    },
    list() {
      return db.getAllAsync<ParkingRecord>('SELECT * FROM parking_records ORDER BY createdAt DESC');
    },
    async get(id: string) {
      return (
        (await db.getFirstAsync<ParkingRecord>('SELECT * FROM parking_records WHERE id = ?', id)) ??
        null
      );
    },
    async setCollected(id: string, at: number) {
      await db.runAsync('UPDATE parking_records SET collectedAt = ? WHERE id = ?', at, id);
    },
    async setKept(id: string) {
      await db.runAsync('UPDATE parking_records SET expiresAt = NULL WHERE id = ?', id);
    },
    async setExpiresAt(id: string, expiresAt: number | null) {
      await db.runAsync('UPDATE parking_records SET expiresAt = ? WHERE id = ?', expiresAt, id);
    },
    async updateNote(id: string, note: string) {
      await db.runAsync('UPDATE parking_records SET note = ? WHERE id = ?', note, id);
    },
    async remove(id: string) {
      await db.runAsync('DELETE FROM parking_records WHERE id = ?', id);
    },
    async removeAll() {
      await db.runAsync('DELETE FROM parking_records');
    },
  };
}
