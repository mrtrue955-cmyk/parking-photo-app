import { gallery } from './native/gallery';
import { getDb } from './native/db';
import { photoFiles } from './native/photoFiles';
import { createSqliteSettingsStore } from './native/settingsStore';
import { createSqliteRepository } from './native/sqliteRepository';
import { createParkingService, type ParkingService } from './services/parkingService';

let servicePromise: Promise<ParkingService> | null = null;

export function getParkingService(): Promise<ParkingService> {
  servicePromise ??= getDb()
    .then((db) =>
      createParkingService({
        repo: createSqliteRepository(db),
        files: photoFiles,
        gallery,
        settings: createSqliteSettingsStore(db),
        now: () => Date.now(),
        newId: () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      }),
    )
    .catch((error) => {
      servicePromise = null;
      throw error;
    });
  return servicePromise;
}

export const getPhotoFiles = () => photoFiles;
