import * as Notifications from 'expo-notifications';
import {
  buildParkedText,
  parkedCategoryFor,
  PARKED_ACTION_COLLECT,
  PARKED_ACTION_NAVIGATE,
  PARKED_CATEGORY_NO_GPS,
  PARKED_CATEGORY_WITH_GPS,
  PARKED_NOTIFICATION_ID,
} from '../domain/parkedNotification';
import { translate } from '../i18n/translate';
import type { Locale } from '../i18n/translations';
import type { ParkingRecord } from '../domain/types';

function buttons(locale: Locale) {
  return {
    collect: {
      identifier: PARKED_ACTION_COLLECT,
      buttonTitle: translate(locale, 'notif.action.collect'),
      options: { opensAppToForeground: true },
    },
    navigate: {
      identifier: PARKED_ACTION_NAVIGATE,
      buttonTitle: translate(locale, 'notif.action.navigate'),
      options: { opensAppToForeground: true },
    },
  };
}

export async function registerParkedCategories(locale: Locale = 'vi'): Promise<void> {
  const { collect, navigate } = buttons(locale);
  try {
    await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY_WITH_GPS, [collect, navigate]);
    await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY_NO_GPS, [collect]);
  } catch (error) {
    console.warn('Failed to register parked notification categories', error);
  }
}

/** Posts (or replaces) the single parked-spot notification. Never rejects. */
export async function showParkedNotification(
  record: ParkingRecord,
  options?: { silent?: boolean; locale?: Locale },
): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      // Never leave an older spot's notification behind when the new one cannot be posted.
      await dismissParkedNotification();
      return;
    }
    const { title, body } = buildParkedText(record.note, options?.locale ?? 'vi');
    await Notifications.scheduleNotificationAsync({
      identifier: PARKED_NOTIFICATION_ID,
      content: {
        title,
        body,
        categoryIdentifier: parkedCategoryFor(record.lat !== null && record.lng !== null),
        data: {
          recordId: record.id,
          lat: record.lat,
          lng: record.lng,
          ...(options?.silent ? { silent: true } : {}),
        },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to show the parked notification', error);
    try {
      await dismissParkedNotification();
    } catch {
      // best effort
    }
  }
}

/** Removes the parked-spot notification if it is showing. Never rejects. */
export async function dismissParkedNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(PARKED_NOTIFICATION_ID);
  } catch (error) {
    console.warn('Failed to dismiss the parked notification', error);
  }
}
