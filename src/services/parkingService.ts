import { pickCurrent } from '../domain/current';
import { computeExpiresAt, isExpired } from '../domain/expiry';
import type { ParkingRecord } from '../domain/types';
import type { Gallery, ParkingRepository, PhotoFiles } from './ports';

type Deps = {
  repo: ParkingRepository;
  files: PhotoFiles;
  gallery: Gallery;
  now: () => number;
  newId: () => string;
};

export type CaptureInput = {
  tempUri: string;
  lat: number | null;
  lng: number | null;
  note: string;
};

export function createParkingService({ repo, files, gallery, now, newId }: Deps) {
  return {
    async capture(input: CaptureInput): Promise<ParkingRecord> {
      const id = newId();
      const createdAt = now();
      const photoPath = await files.save(input.tempUri, id);
      const record: ParkingRecord = {
        id,
        photoPath,
        lat: input.lat,
        lng: input.lng,
        note: input.note.trim(),
        createdAt,
        collectedAt: null,
        expiresAt: computeExpiresAt(createdAt),
      };
      let previouslyOpen: ParkingRecord[];
      try {
        previouslyOpen = (await repo.list()).filter((r) => r.collectedAt === null);
        await repo.insert(record);
      } catch (error) {
        await files.remove(photoPath);
        throw error;
      }
      for (const r of previouslyOpen) await repo.setCollected(r.id, createdAt);
      return record;
    },

    async collectCurrent(): Promise<string | null> {
      const current = pickCurrent(await repo.list());
      if (!current) return null;
      await repo.setCollected(current.id, now());
      return current.id;
    },

    async keep(id: string): Promise<void> {
      const record = await repo.get(id);
      if (!record) return;
      await gallery.save(files.uriFor(record.photoPath));
      await repo.setKept(id);
    },

    async deleteNow(id: string): Promise<void> {
      const record = await repo.get(id);
      if (!record) return;
      await files.remove(record.photoPath);
      await repo.remove(id);
    },

    async purgeExpired(): Promise<number> {
      const t = now();
      let removed = 0;
      for (const r of await repo.list()) {
        try {
          const missing = !(await files.exists(r.photoPath));
          if (isExpired(r, t) || missing) {
            await files.remove(r.photoPath);
            await repo.remove(r.id);
            removed += 1;
          }
        } catch {
          // Skip this record so one failure does not abort the run; it is retried on the next purge.
        }
      }
      return removed;
    },

    list: () => repo.list(),
  };
}

export type ParkingService = ReturnType<typeof createParkingService>;
