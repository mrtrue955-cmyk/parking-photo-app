import { useCallback, useEffect, useState } from 'react';
import { getParkingService } from '../container';
import type { AppSettings } from '../domain/settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    let alive = true;
    getParkingService()
      .then((service) => service.getSettings())
      .then((value) => {
        if (alive) setSettings(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const service = await getParkingService();
    const next = await service.updateSettings(patch);
    setSettings(next);
    return next;
  }, []);

  return { settings, update };
}
