import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Each entry moves the schema up by one version. Append only: never edit a
// released migration, or devices that already ran it drift from fresh installs.
const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS parking_records (
      id TEXT PRIMARY KEY NOT NULL,
      photoPath TEXT NOT NULL,
      lat REAL,
      lng REAL,
      note TEXT NOT NULL DEFAULT '',
      createdAt INTEGER NOT NULL,
      collectedAt INTEGER,
      expiresAt INTEGER
    );`,
  `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );`,
];

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('parking.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  while (version < MIGRATIONS.length) {
    await db.execAsync(MIGRATIONS[version]);
    version += 1;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= open().catch((error) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}
