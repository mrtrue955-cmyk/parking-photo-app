import { daysLeft } from '../domain/expiry';
import type { ParkingRecord } from '../domain/types';
import { translate } from '../i18n/translate';
import type { Locale } from '../i18n/translations';
import type { ParkedSpotProps } from './parkedSpot';

const COLORS = {
  background: '#FBF7F0',
  ink: '#2B2724',
  muted: '#6F675F',
  accent: '#F5A524',
};

/** Everything the widget shows is pre-formatted here: the widget runtime has no i18n. */
export function parkedWidgetProps(
  record: ParkingRecord | null,
  now: number,
  locale: Locale,
): ParkedSpotProps {
  const base: ParkedSpotProps = {
    parked: false,
    parkedLabel: translate(locale, 'spot.parked'),
    spot: '',
    daysLabel: '',
    emptyLabel: translate(locale, 'widget.emptyTitle'),
    emptyHint: translate(locale, 'widget.emptyHint'),
    ...COLORS,
  };
  if (!record) return base;

  const note = record.note.trim();
  const days = record.expiresAt === null ? null : daysLeft(record.expiresAt, now);
  return {
    ...base,
    parked: true,
    spot: note === '' ? translate(locale, 'widget.spotFallback') : note,
    daysLabel:
      days === null
        ? translate(locale, 'status.kept')
        : translate(locale, 'spot.daysLeft', { count: days }),
  };
}
