import * as Notifications from 'expo-notifications';
import { buildReminders } from '../domain/expiry';
import { buildSessionReminders, SESSION_WARN_LEAD_MS } from '../domain/session';
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

  const byId = new Map(records.map((record) => [record.id, record]));
  for (const reminder of buildSessionReminders(records, now)) {
    const record = byId.get(reminder.recordId);
    if (!record) continue;
    const label = record.note.trim() || translate(locale, 'spot.parked');
    const isEnd = reminder.kind === 'end';
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: {
        title: translate(locale, isEnd ? 'notif.session.endTitle' : 'notif.session.title'),
        body: translate(locale, isEnd ? 'notif.session.endBody' : 'notif.session.body', {
          note: label,
          minutes: Math.round(SESSION_WARN_LEAD_MS / 60_000),
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.triggerAt),
      },
    });
  }
}
