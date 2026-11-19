import type { SQLiteDatabase } from 'expo-sqlite';
import { parseSettings } from '../domain/settings';
import type { SettingsStore } from '../services/ports';

/** Stores settings as one JSON value per key so adding a setting needs no migration. */
export function createSqliteSettingsStore(db: SQLiteDatabase): SettingsStore {
  return {
    async load() {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM settings',
      );
      const raw: Record<string, unknown> = {};
      for (const row of rows) {
        try {
          raw[row.key] = JSON.parse(row.value);
        } catch {
          raw[row.key] = undefined;
        }
      }
      return parseSettings(raw);
    },
    async save(settings) {
      await db.withTransactionAsync(async () => {
        for (const [key, value] of Object.entries(settings)) {
          await db.runAsync(
            `INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
            key,
            JSON.stringify(value),
          );
        }
      });
    },
  };
}
