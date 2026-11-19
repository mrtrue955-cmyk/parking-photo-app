import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import type { ParkingRecord } from '../domain/types';

export const GEOFENCE_TASK = 'parked-spot-geofence';
const REGION_RADIUS_M = 400;

/** Region currently registered in this process, so a refresh does not restart the same fence. */
let currentKey: string | null = null;

// Must be defined at module scope so the OS can wake the app for the event.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const event = (data as { eventType?: Location.GeofencingEventType } | undefined)?.eventType;
  if (event !== Location.GeofencingEventType.Exit) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Bạn đã rời bãi đỗ',
      body: 'Vị trí xe vẫn được lưu. Mở app để xem ảnh hoặc xoá nếu đã lấy xe.',
    },
    trigger: null,
  }).catch(() => undefined);
});

export async function requestBackgroundLocation(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted';
}

export async function stopGeofence(): Promise<void> {
  try {
    if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
      await Location.stopGeofencingAsync(GEOFENCE_TASK);
    }
  } catch {
    // Best effort: the OS may refuse while the app is in the background.
  }
  currentKey = null;
}

/** Watches a 400 m fence around the parked car, or tears the watch down when it no longer applies. */
export async function syncGeofence(record: ParkingRecord | null, enabled: boolean): Promise<void> {
  if (!enabled || !record || record.lat === null || record.lng === null) {
    await stopGeofence();
    return;
  }
  const key = `${record.id}:${record.lat}:${record.lng}`;
  try {
    const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (started && currentKey === key) return;
    if (started) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    await Location.startGeofencingAsync(GEOFENCE_TASK, [
      {
        identifier: 'parked-spot',
        latitude: record.lat,
        longitude: record.lng,
        radius: REGION_RADIUS_M,
        notifyOnEnter: false,
        notifyOnExit: true,
      },
    ]);
    currentKey = key;
  } catch {
    currentKey = null;
  }
}
