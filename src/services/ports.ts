import type { AppSettings } from '../domain/settings';
import type { ParkingRecord } from '../domain/types';

export interface ParkingRepository {
  insert(record: ParkingRecord): Promise<void>;
  list(): Promise<ParkingRecord[]>;
  get(id: string): Promise<ParkingRecord | null>;
  setCollected(id: string, at: number): Promise<void>;
  setKept(id: string): Promise<void>;
  setExpiresAt(id: string, expiresAt: number | null): Promise<void>;
  updateNote(id: string, note: string): Promise<void>;
  remove(id: string): Promise<void>;
  removeAll(): Promise<void>;
}

export interface SettingsStore {
  load(): Promise<AppSettings>;
  save(settings: AppSettings): Promise<void>;
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

export class GalleryPermissionDeniedError extends Error {
  constructor() {
    super('Gallery permission denied');
    this.name = 'GalleryPermissionDeniedError';
    Object.setPrototypeOf(this, GalleryPermissionDeniedError.prototype);
  }
}
