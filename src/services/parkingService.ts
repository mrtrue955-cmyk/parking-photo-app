import { pickCurrent } from '../domain/current';
import { computeExpiresAt, DAY_MS, isExpired } from '../domain/expiry';
import { parseSettings, type AppSettings } from '../domain/settings';
import type { ParkingRecord } from '../domain/types';
import type { Gallery, ParkingRepository, PhotoFiles, SettingsStore } from './ports';

type Deps = {
  repo: ParkingRepository;
  files: PhotoFiles;
  gallery: Gallery;
  settings: SettingsStore;
  now: () => number;
  newId: () => string;
};

export type CaptureInput = {
  tempUri: string;
  lat: number | null;
  lng: number | null;
  note: string;
  /** Meter or garage limit; null when the driver did not set one. */
  parkedUntil?: number | null;
};

export function createParkingService({ repo, files, gallery, settings, now, newId }: Deps) {
  return {
    async capture(input: CaptureInput): Promise<ParkingRecord> {
      const id = newId();
      const createdAt = now();
      const currentSettings = await settings.load();
      const { retentionDays } = currentSettings;
      const photoPath = await files.save(input.tempUri, id);
      const record: ParkingRecord = {
        id,
        photoPath,
        lat: input.lat,
        lng: input.lng,
        note: input.note.trim(),
        createdAt,
        collectedAt: null,
        expiresAt: computeExpiresAt(createdAt, retentionDays),
        parkedUntil: input.parkedUntil ?? null,
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
      // The counter survives photo deletion, so the rating prompt can wait for
      // the third save even if the earlier spots are gone.
      await settings.save({ ...currentSettings, captureCount: currentSettings.captureCount + 1 });
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
      if (!record || record.expiresAt === null) return;
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

    /** Clears the meter limit once the driver is back at the car. */
    async endSession(id: string): Promise<void> {
      const record = await repo.get(id);
      if (!record) return;
      await repo.setParkedUntil(id, null);
    },

    async updateNote(id: string, note: string): Promise<void> {
      const record = await repo.get(id);
      if (!record) return;
      await repo.updateNote(id, note.trim());
    },

    async getSettings(): Promise<AppSettings> {
      return settings.load();
    },

    /** Persists the settings and re-anchors expiries when the retention window changes. */
    async updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
      const current = await settings.load();
      const next = parseSettings({ ...current, ...patch });
      await settings.save(next);
      if (next.retentionDays !== current.retentionDays) {
        for (const record of await repo.list()) {
          if (record.expiresAt === null) continue;
          await repo.setExpiresAt(record.id, record.createdAt + next.retentionDays * DAY_MS);
        }
      }
      return next;
    },

    async deleteAll(): Promise<number> {
      const records = await repo.list();
      for (const record of records) {
        try {
          await files.remove(record.photoPath);
        } catch {
          // The row must still go: an orphan file is easier to live with than a ghost record.
        }
      }
      await repo.removeAll();
      return records.length;
    },

    list: () => repo.list(),
  };
}

export type ParkingService = ReturnType<typeof createParkingService>;
