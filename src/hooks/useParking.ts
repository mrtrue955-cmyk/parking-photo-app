import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getParkingService } from '../container';
import type { ParkingRecord } from '../domain/types';
import { syncReminders } from '../native/reminders';

export function useParking() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);

  const latestRequest = useRef(0);

  const refresh = useCallback(async () => {
    const requestId = ++latestRequest.current;
    let list: ParkingRecord[];
    try {
      const service = await getParkingService();
      await service.purgeExpired();
      list = await service.list();
      if (requestId === latestRequest.current) setRecords(list);
    } catch (error) {
      console.warn('Failed to refresh parking records', error);
      return;
    }
    if (requestId !== latestRequest.current) return;
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

  return { records, refresh };
}
