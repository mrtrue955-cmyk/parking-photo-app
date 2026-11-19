import {
  buildParkedText,
  isSilentPost,
  parkedCategoryFor,
  parseParkedAction,
  PARKED_ACTION_COLLECT,
  PARKED_ACTION_NAVIGATE,
  PARKED_CATEGORY_NO_GPS,
  PARKED_CATEGORY_WITH_GPS,
} from '../src/domain/parkedNotification';

test('buildParkedText names the spot when there is a note', () => {
  // Given a spot saved with a note
  // When building the notification text
  // Then the body names the note after "Xe bạn đang đậu ở"
  expect(buildParkedText('B1')).toEqual({
    title: 'Vị trí xe của bạn',
    body: 'Xe bạn đang đậu ở B1',
  });
});

test('buildParkedText trims the note and keeps a long note whole', () => {
  // Given a note with surrounding spaces and one at the 80-character limit
  const long = 'B'.repeat(80);
  // When building the text
  // Then spaces are trimmed and the long note is not cut
  expect(buildParkedText('  B2, cột 14  ').body).toBe('Xe bạn đang đậu ở B2, cột 14');
  expect(buildParkedText(long).body).toBe(`Xe bạn đang đậu ở ${long}`);
});

test('buildParkedText falls back to "Bạn đã đậu xe" for an empty or blank note', () => {
  // Given no note, and a note that is only spaces
  // When building the text
  // Then the body says only that the user parked
  expect(buildParkedText('').body).toBe('Bạn đã đậu xe');
  expect(buildParkedText('   ').body).toBe('Bạn đã đậu xe');
});

test('parkedCategoryFor picks the category by GPS availability', () => {
  // Given a spot with GPS and one without
  // When choosing the category
  // Then GPS spots get both buttons, others only "Đã lấy xe"
  expect(parkedCategoryFor(true)).toBe(PARKED_CATEGORY_WITH_GPS);
  expect(parkedCategoryFor(false)).toBe(PARKED_CATEGORY_NO_GPS);
});

test('parseParkedAction reads the collect action with its record id', () => {
  // Given the collect action with the data the notification was posted with
  // When parsing it
  // Then it returns a collect action carrying the record id
  expect(parseParkedAction(PARKED_ACTION_COLLECT, { recordId: 'r1', lat: 1, lng: 2 })).toEqual({
    type: 'collect',
    recordId: 'r1',
  });
});

test('parseParkedAction still collects (and dismisses) when the record id is missing', () => {
  // Given the collect action with missing, empty or wrongly typed data
  // When parsing it
  // Then it is still a collect action with a null record id, so the handler can dismiss safely
  expect(parseParkedAction(PARKED_ACTION_COLLECT, undefined)).toEqual({
    type: 'collect',
    recordId: null,
  });
  expect(parseParkedAction(PARKED_ACTION_COLLECT, { recordId: '' })).toEqual({
    type: 'collect',
    recordId: null,
  });
  expect(parseParkedAction(PARKED_ACTION_COLLECT, { recordId: 7 })).toEqual({
    type: 'collect',
    recordId: null,
  });
  expect(parseParkedAction(PARKED_ACTION_COLLECT, 'junk')).toEqual({
    type: 'collect',
    recordId: null,
  });
});

test('parseParkedAction reads the navigate action with valid coordinates', () => {
  // Given the navigate action with numeric coordinates
  // When parsing it
  // Then it returns the coordinates
  expect(
    parseParkedAction(PARKED_ACTION_NAVIGATE, { recordId: 'r1', lat: 10.5, lng: 106.7 }),
  ).toEqual({
    type: 'navigate',
    lat: 10.5,
    lng: 106.7,
    recordId: 'r1',
  });
});

test('parseParkedAction gives a navigate action a null record id when it is missing', () => {
  // Given the navigate action whose data has no usable record id
  // When parsing it
  // Then the record id is null, so the handler cannot verify it and navigates as before
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: 1, lng: 2 })).toEqual({
    type: 'navigate',
    lat: 1,
    lng: 2,
    recordId: null,
  });
});

test('parseParkedAction accepts zero latitude and negative longitude', () => {
  // Given valid coordinates on the equator and in the western hemisphere
  // When parsing the navigate action
  // Then they are accepted (0 and negatives are not "missing")
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { recordId: 'r2', lat: 0, lng: -73.9 })).toEqual(
    {
      type: 'navigate',
      lat: 0,
      lng: -73.9,
      recordId: 'r2',
    },
  );
});

test('parseParkedAction falls back to "open" for navigate without usable coordinates', () => {
  // Given the navigate action with null, missing, non-numeric or non-finite coordinates
  // When parsing it
  // Then it is just "open" (never a broken maps URL)
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: null, lng: null })).toEqual({
    type: 'open',
  });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: 1 })).toEqual({ type: 'open' });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: '1', lng: '2' })).toEqual({
    type: 'open',
  });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, { lat: NaN, lng: 2 })).toEqual({ type: 'open' });
  expect(parseParkedAction(PARKED_ACTION_NAVIGATE, null)).toEqual({ type: 'open' });
});

test('parseParkedAction treats the default tap and unknown actions as "open"', () => {
  // Given a tap on the notification body and an unknown action id
  // When parsing them
  // Then both just open the app
  expect(
    parseParkedAction('expo.modules.notifications.actions.DEFAULT', { recordId: 'r1' }),
  ).toEqual({ type: 'open' });
  expect(parseParkedAction('something-else', {})).toEqual({ type: 'open' });
});

test('isSilentPost is true only when data.silent is exactly true', () => {
  // Given notification data that is silent, not silent, missing the flag, or junk
  // When checking it
  // Then only silent === true counts, so a normal post still shows a banner
  expect(isSilentPost({ silent: true })).toBe(true);
  expect(isSilentPost({ silent: false })).toBe(false);
  expect(isSilentPost({ recordId: 'r1' })).toBe(false);
  expect(isSilentPost({ silent: 'true' })).toBe(false);
  expect(isSilentPost(undefined)).toBe(false);
  expect(isSilentPost(null)).toBe(false);
  expect(isSilentPost('junk')).toBe(false);
});
