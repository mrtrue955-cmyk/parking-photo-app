import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getParkingService } from '../container';
import type { ParkingRecord } from '../domain/types';
import { syncReminders } from '../native/reminders';

export function useParking() {
  const [records, setRecords] = useState<ParkingRecord[]>([]);

  const refresh = useCallback(async () => {
    const service = await getParkingService();
    await service.purgeExpired();
    const list = await service.list();
    setRecords(list);
    await syncReminders(list, Date.now());
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
