import { translate } from '../i18n/translate';
import type { ParkingRecord } from './types';
import type { Locale } from '../i18n/translations';

/** Meter / garage limits offered on the capture screen, in minutes. */
export const SESSION_OPTIONS_MIN = [30, 60, 120, 240] as const;

export const SESSION_WARN_LEAD_MS = 10 * 60_000;

export function sessionEnd(now: number, minutes: number): number {
  return now + minutes * 60_000;
}

export function remainingMs(parkedUntil: number | null, now: number): number | null {
  if (parkedUntil === null) return null;
  return parkedUntil - now;
}

export function isSessionOver(parkedUntil: number | null, now: number): boolean {
  return parkedUntil !== null && parkedUntil <= now;
}

export function formatSessionRemaining(ms: number, locale: Locale): string {
  if (ms <= 0) return translate(locale, 'session.over');
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return translate(locale, 'session.remainingMinutes', { count: minutes });
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return translate(locale, 'session.remainingHours', { count: hours });
  return translate(locale, 'session.remainingHoursMinutes', { hours, minutes: rest });
}

export type SessionReminder = {
  id: string;
  triggerAt: number;
  recordId: string;
  kind: 'warn' | 'end';
};

/**
 * Two notifications per limited session: a warning shortly before the meter runs
 * out and one when it does. Ids are stable so a reschedule replaces them.
 */
export function buildSessionReminders(
  records: ParkingRecord[],
  now: number,
  leadMs: number = SESSION_WARN_LEAD_MS,
): SessionReminder[] {
  const reminders: SessionReminder[] = [];
  for (const record of records) {
    if (record.parkedUntil === null) continue;
    const warnAt = record.parkedUntil - leadMs;
    if (warnAt > now) {
      reminders.push({
        id: `session-warn-${record.id}`,
        triggerAt: warnAt,
        recordId: record.id,
        kind: 'warn',
      });
    }
    if (record.parkedUntil > now) {
      reminders.push({
        id: `session-end-${record.id}`,
        triggerAt: record.parkedUntil,
        recordId: record.id,
        kind: 'end',
      });
    }
  }
  return reminders.sort((a, b) => a.triggerAt - b.triggerAt);
}
