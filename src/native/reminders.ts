import * as Notifications from 'expo-notifications';
import { buildReminders } from '../domain/expiry';
import type { ParkingRecord } from '../domain/types';

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function syncReminders(records: ParkingRecord[], now: number): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of buildReminders(records, now)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ảnh vị trí xe sắp bị xoá',
        body: `${reminder.count} ảnh sẽ bị xoá vào ngày mai. Mở app để giữ lại.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.triggerAt),
      },
    });
  }
}
