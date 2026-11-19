import type { ParkingRecord } from '../src/domain/types';
import { DAY_MS } from '../src/domain/expiry';
import { parkedWidgetProps } from '../src/widgets/props';

const now = 1_000_000_000_000;

const rec = (note: string, expiresAt: number | null): ParkingRecord => ({
  id: 'r1',
  photoPath: 'r1.jpg',
  lat: null,
  lng: null,
  note,
  createdAt: now - 60_000,
  collectedAt: null,
  expiresAt,
});

test('an empty widget invites the user to capture a spot', () => {
  const props = parkedWidgetProps(null, now, 'vi');
  expect(props.parked).toBe(false);
  expect(props.emptyLabel).toBe('Chưa lưu vị trí');
  expect(props.emptyHint).toBe('Mở app để chụp cột');
});

test('the parked spot carries the note and the remaining days', () => {
  const props = parkedWidgetProps(rec('B1 · Cột 45', now + 29 * DAY_MS), now, 'vi');
  expect(props.parked).toBe(true);
  expect(props.spot).toBe('B1 · Cột 45');
  expect(props.daysLabel).toBe('còn 29 ngày');
  expect(props.parkedLabel).toBe('Đang đậu');
});

test('an empty note falls back to a parked label', () => {
  const props = parkedWidgetProps(rec('   ', now + DAY_MS), now, 'vi');
  expect(props.spot).toBe('Xe đang đậu');
});

test('a kept photo reports that it will not be deleted', () => {
  const props = parkedWidgetProps(rec('B2 · Cột 7', null), now, 'vi');
  expect(props.daysLabel).toBe('Đã giữ lại');
});

test('the widget follows the app language', () => {
  const props = parkedWidgetProps(rec('B1 · Cột 45', now + 2 * DAY_MS), now, 'en');
  expect(props.parkedLabel).toBe('Parked');
  expect(props.daysLabel).toBe('2 days left');
  expect(parkedWidgetProps(null, now, 'en').emptyLabel).toBe('No spot saved');
});

test('the widget uses the brand colours', () => {
  const props = parkedWidgetProps(null, now, 'vi');
  expect(props.background).toBe('#FBF7F0');
  expect(props.accent).toBe('#F5A524');
});
