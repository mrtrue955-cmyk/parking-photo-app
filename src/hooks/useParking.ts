import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useI18n } from '../i18n';
import { syncParkedActivity } from '../widgets/activitySync';
import { parkedActivityProps, parkedWidgetProps } from '../widgets/props';
import { syncParkedWidget } from '../widgets/sync';
import { getParkingService } from '../container';
import { pickCurrent } from '../domain/current';
import type { ParkingRecord } from '../domain/types';
import { onParkingChanged } from './parkingEvents';
import { syncGeofence } from '../native/geofence';
import { syncReminders } from '../native/reminders';

export function useParking() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Reading Date.now() in a compiled component body gets cached by React Compiler,
  // so the clock lives in state and is refreshed together with the data.
  const [now, setNow] = useState(() => Date.now());
  const { locale } = useI18n();

  const latestRequest = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);
  const rerun = useRef(false);
  const lastPurge = useRef(0);

  const runSideEffects = useCallback(
    (list: ParkingRecord[]) => {
      const current = pickCurrent(list);
      const stamp = Date.now();
      syncParkedWidget(parkedWidgetProps(current, stamp, locale));
      syncParkedActivity(parkedActivityProps(current, stamp, locale));
      // Notification and geofence work is native round-trips; let the list paint first.
      setTimeout(() => {
        (async () => {
          try {
            const settings = await (await getParkingService()).getSettings();
            await syncGeofence(current, settings.geofenceEnabled);
          } catch (error) {
            console.warn('Failed to sync the geofence', error);
          }
          try {
            await syncReminders(list, Date.now(), locale);
          } catch (error) {
            console.warn('Failed to sync reminders', error);
          }
        })();
      }, 0);
    },
    [locale],
  );

  const load = useCallback(async () => {
    const requestId = ++latestRequest.current;
    let list: ParkingRecord[];
    try {
      const service = await getParkingService();
      // Purging stats one file per record; once a minute is plenty for a 30-day window.
      if (Date.now() - lastPurge.current > 60_000) {
        lastPurge.current = Date.now();
        await service.purgeExpired();
      }
      list = await service.list();
      if (requestId === latestRequest.current) {
        setRecords(list);
        setLoaded(true);
        setNow(Date.now());
      }
    } catch (error) {
      console.warn('Failed to refresh parking records', error);
      if (requestId === latestRequest.current) setLoaded(true);
      return;
    }
    if (requestId !== latestRequest.current) return;
    runSideEffects(list);
  }, [runSideEffects]);

  const refresh = useCallback(async () => {
    // Focus, app-active and parking-changed all fire around a save; run one load at a time
    // and schedule exactly one follow-up instead of stacking three.
    if (inFlight.current) {
      rerun.current = true;
      return inFlight.current;
    }
    inFlight.current = (async () => {
      await load();
      inFlight.current = null;
      if (rerun.current) {
        rerun.current = false;
        await refresh();
      }
    })();
    return inFlight.current;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  useEffect(
    () =>
      onParkingChanged(() => {
        refresh();
      }),
    [refresh],
  );

  return { records, loaded, now, refresh };
}
