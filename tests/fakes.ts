import type { ParkingRecord } from '../src/domain/types';
import type { Gallery, ParkingRepository, PhotoFiles } from '../src/services/ports';

export class FakeRepo implements ParkingRepository {
  rows = new Map<string, ParkingRecord>();
  failInsert = false;
  failList = false;
  failRemoveIds = new Set<string>();
  async insert(r: ParkingRecord) {
    if (this.failInsert) throw new Error('insert failed');
    this.rows.set(r.id, { ...r });
  }
  async list() {
    if (this.failList) throw new Error('list failed');
    return [...this.rows.values()].map((r) => ({ ...r }));
  }
  async get(id: string) {
    const r = this.rows.get(id);
    return r ? { ...r } : null;
  }
  async setCollected(id: string, at: number) {
    this.rows.get(id)!.collectedAt = at;
  }
  async setKept(id: string) {
    this.rows.get(id)!.expiresAt = null;
  }
  async remove(id: string) {
    if (this.failRemoveIds.has(id)) throw new Error('remove failed');
    this.rows.delete(id);
  }
}

export class FakeFiles implements PhotoFiles {
  names = new Set<string>();
  async save(_tempUri: string, id: string) {
    const n = `${id}.jpg`;
    this.names.add(n);
    return n;
  }
  async remove(name: string) {
    this.names.delete(name);
  }
  async exists(name: string) {
    return this.names.has(name);
  }
  uriFor(name: string) {
    return `file:///photos/${name}`;
  }
}

export class FakeGallery implements Gallery {
  saved: string[] = [];
  fail = false;
  async save(uri: string) {
    if (this.fail) throw new Error('no permission');
    this.saved.push(uri);
  }
}
