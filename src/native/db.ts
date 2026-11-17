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
  dbPromise ??= open().catch((error) => {
    dbPromise = null;
    throw error;
  });
  return dbPromise;
}
