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
import type { ParkingRecord } from '../domain/types';

const COLLECT_BUTTON = {
  identifier: PARKED_ACTION_COLLECT,
  buttonTitle: 'Đã lấy xe',
  options: { opensAppToForeground: true },
};

const NAVIGATE_BUTTON = {
  identifier: PARKED_ACTION_NAVIGATE,
  buttonTitle: 'Dẫn đường về xe',
  options: { opensAppToForeground: true },
};

export async function registerParkedCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY_WITH_GPS, [
      COLLECT_BUTTON,
      NAVIGATE_BUTTON,
    ]);
    await Notifications.setNotificationCategoryAsync(PARKED_CATEGORY_NO_GPS, [COLLECT_BUTTON]);
  } catch (error) {
    console.warn('Failed to register parked notification categories', error);
  }
}

/** Posts (or replaces) the single parked-spot notification. Never rejects. */
export async function showParkedNotification(record: ParkingRecord): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    const { title, body } = buildParkedText(record.note);
    await Notifications.scheduleNotificationAsync({
      identifier: PARKED_NOTIFICATION_ID,
      content: {
        title,
        body,
        categoryIdentifier: parkedCategoryFor(record.lat !== null && record.lng !== null),
        data: { recordId: record.id, lat: record.lat, lng: record.lng },
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to show the parked notification', error);
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
