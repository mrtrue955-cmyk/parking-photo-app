import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { getParkingService } from '../container';
import { pickCurrent } from '../domain/current';
import { parseParkedAction, PARKED_NOTIFICATION_ID } from '../domain/parkedNotification';
import { directionsUrl } from '../native/directions';
import { dismissParkedNotification } from '../native/parkedNotification';

async function handleParkedResponse(actionIdentifier: string, data: unknown): Promise<void> {
  const action = parseParkedAction(actionIdentifier, data);
  if (action.type === 'collect') {
    const service = await getParkingService();
    const current = pickCurrent(await service.list());
    // Only collect the spot this notification was posted for; always dismiss.
    if (current && current.id === action.recordId) await service.collectCurrent();
    await dismissParkedNotification();
  } else if (action.type === 'navigate') {
    await Linking.openURL(directionsUrl(action.lat, action.lng));
  }
}

/** Handles taps on the parked-spot notification buttons, once per response (also on cold start). */
export function useParkedNotificationResponses(): void {
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    if (response.notification.request.identifier !== PARKED_NOTIFICATION_ID) return;
    const key = `${response.notification.date}:${response.actionIdentifier}`;
    if (handled.current === key) return;
    handled.current = key;
    handleParkedResponse(
      response.actionIdentifier,
      response.notification.request.content.data,
    ).catch((error) => console.warn('Failed to handle the parked notification response', error));
  }, [response]);
}
