import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { getParkingService } from '../container';
import { pickCurrent } from '../domain/current';
import { parseParkedAction, PARKED_NOTIFICATION_ID } from '../domain/parkedNotification';
import { emitParkingChanged } from './parkingEvents';
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
    emitParkingChanged();
  } else if (action.type === 'navigate') {
    const service = await getParkingService();
    const current = pickCurrent(await service.list());
    if (action.recordId !== null && current && current.id !== action.recordId) {
      // Stale notification for an older spot: remove it instead of navigating to the wrong place.
      await dismissParkedNotification();
      return;
    }
    await Linking.openURL(directionsUrl(action.lat, action.lng));
  }
}

/**
 * Handles taps on the parked-spot notification buttons. Each tap is handled once: the listener
 * delivers each tap once, and the launching tap is read from getLastNotificationResponse() and cleared.
 */
export function useParkedNotificationResponses(): void {
  useEffect(() => {
    // Not useLastNotificationResponse: it keeps its value when the identifier repeats,
    // and every parked notification shares one identifier.
    const handle = (response: Notifications.NotificationResponse) => {
      if (response.notification.request.identifier !== PARKED_NOTIFICATION_ID) return;
      handleParkedResponse(
        response.actionIdentifier,
        response.notification.request.content.data,
      ).catch((error) => console.warn('Failed to handle the parked notification response', error));
      // The native layer keeps the last response until cleared; clear it so a remount cannot replay it.
      // A repeat tap of the same button is a new event and still reaches the listener.
      try {
        Notifications.clearLastNotificationResponse();
      } catch (error) {
        console.warn('Failed to clear the last notification response', error);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handle);

    // Cold start: the tap that launched the app arrived before the listener existed.
    const initial = Notifications.getLastNotificationResponse();
    if (initial) handle(initial);

    return () => subscription.remove();
  }, []);
}
