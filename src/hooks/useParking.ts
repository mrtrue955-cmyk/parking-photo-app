import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getParkingService } from '../container';
import { pickCurrent } from '../domain/current';
import type { ParkingRecord } from '../domain/types';
import { onParkingChanged } from './parkingEvents';
import { syncGeofence } from '../native/geofence';
import { dismissParkedNotification } from '../native/parkedNotification';
import { syncReminders } from '../native/reminders';

export function useParking() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Reading Date.now() in a compiled component body gets cached by React Compiler,
  // so the clock lives in state and is refreshed together with the data.
  const [now, setNow] = useState(() => Date.now());

  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    let list: ParkingRecord[];
    try {
      const service = await getParkingService();
      await service.purgeExpired();
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
    const current = pickCurrent(list);
    if (!current) await dismissParkedNotification();
    try {
      const settings = await (await getParkingService()).getSettings();
      await syncGeofence(current, settings.geofenceEnabled);
    } catch (error) {
      console.warn('Failed to sync the geofence', error);
    }
    try {
      await syncReminders(list, Date.now());
    } catch (error) {
      console.warn('Failed to sync reminders', error);
    }
  }, []);

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
