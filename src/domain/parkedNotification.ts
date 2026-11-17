export const PARKED_NOTIFICATION_ID = 'parked-spot';
export const PARKED_CATEGORY_WITH_GPS = 'parked-with-gps';
export const PARKED_CATEGORY_NO_GPS = 'parked-no-gps';
export const PARKED_ACTION_COLLECT = 'collect';
export const PARKED_ACTION_NAVIGATE = 'navigate';

export function buildParkedText(note: string): { title: string; body: string } {
  const trimmed = note.trim();
  return {
    title: 'Vị trí xe của bạn',
    body: trimmed ? `Xe bạn đang đậu ở ${trimmed}` : 'Bạn đã đậu xe',
  };
}

export function parkedCategoryFor(hasGps: boolean): string {
  return hasGps ? PARKED_CATEGORY_WITH_GPS : PARKED_CATEGORY_NO_GPS;
}

export type ParkedAction =
  | { type: 'collect'; recordId: string | null }
  | { type: 'navigate'; lat: number; lng: number; recordId: string | null }
  | { type: 'open' };

function asRecord(data: unknown): Record<string, unknown> | null {
  return typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
}

export function parseParkedAction(actionIdentifier: string, data: unknown): ParkedAction {
  const record = asRecord(data);
  const id = record?.recordId;
  const recordId = typeof id === 'string' && id !== '' ? id : null;
  if (actionIdentifier === PARKED_ACTION_COLLECT) {
    return { type: 'collect', recordId };
  }
  if (actionIdentifier === PARKED_ACTION_NAVIGATE) {
    const lat = record?.lat;
    const lng = record?.lng;
    if (typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng)) {
      return { type: 'navigate', lat, lng, recordId };
    }
  }
  return { type: 'open' };
}
