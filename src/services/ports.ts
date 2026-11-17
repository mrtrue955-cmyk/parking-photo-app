import type { ParkingRecord } from '../domain/types';

export interface ParkingRepository {
  insert(record: ParkingRecord): Promise<void>;
  list(): Promise<ParkingRecord[]>;
  get(id: string): Promise<ParkingRecord | null>;
  setCollected(id: string, at: number): Promise<void>;
  setKept(id: string): Promise<void>;
  remove(id: string): Promise<void>;
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
