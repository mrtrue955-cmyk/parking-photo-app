import type { Locale } from '../i18n/translations';
import type { ParkingRecord } from './types';

/** Apple Maps universal link; Android resolves it to the browser or Maps. */
export function mapsLink(lat: number, lng: number): string {
  return `https://maps.apple.com/?ll=${lat},${lng}&q=${lat},${lng}`;
}

export function shareMessage(record: ParkingRecord, locale: Locale): string {
  const vi = locale === 'vi';
  const title = record.note.trim() || (vi ? 'Chưa có ghi chú' : 'No note yet');
  const stamp = new Intl.DateTimeFormat(vi ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(record.createdAt));
  const lines = [
    vi ? `Vị trí xe: ${title}` : `Parked at: ${title}`,
    vi ? `Đỗ lúc ${stamp}` : `Parked ${stamp}`,
  ];
  if (record.lat !== null && record.lng !== null) lines.push(mapsLink(record.lat, record.lng));
  return lines.join('\n');
}
