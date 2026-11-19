import * as Notifications from 'expo-notifications';
import { buildReminders } from '../domain/expiry';
import { translate } from '../i18n/translate';
import type { Locale } from '../i18n/translations';
import type { ParkingRecord } from '../domain/types';

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// All runs are chained so concurrent callers (several hook instances, the
// background task) never interleave cancel-all/schedule and duplicate reminders.
let syncChain: Promise<void> = Promise.resolve();

export function syncReminders(
  records: ParkingRecord[],
  now: number,
  locale: Locale = 'vi',
): Promise<void> {
  const run = syncChain.then(() => runSync(records, now, locale));
  syncChain = run.catch(() => undefined);
  return run;
}

async function runSync(records: ParkingRecord[], now: number, locale: Locale): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of buildReminders(records, now)) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: translate(locale, 'notif.reminder.title'),
        body: translate(locale, 'notif.reminder.body', { count: reminder.count }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.triggerAt),
      },
    });
  }
}
