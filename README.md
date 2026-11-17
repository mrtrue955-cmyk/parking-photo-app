# Parking Photo App

Take a photo of where you parked, and let it delete itself after 30 days.

Photos are stored in the app's private storage, never in the Gallery, so
supermarket pillar photos stop piling up in your camera roll. There is no
backend, the app's own code makes no network requests, and photos are processed
on the device. On Android, the Google ML Kit text model used for text
recognition is downloaded by Google Play services on first use.

## Features

- Capture a parking spot with a photo, GPS position and a short note.
- Home shows the current spot (with a "navigate back to the car" button and
  "I got my car") and a history of earlier spots.
- Each photo is deleted 30 days after it was taken. A reminder notification is
  scheduled the day before.
- "Giữ lại" (keep) saves a photo to the Gallery and exempts it from deletion.
- Suggests the location note from the photo (level, zone, pillar number) using
  on-device text recognition; the photo never leaves the phone. On Android the
  text model is downloaded by Google Play services on first use, so the first
  read can fail silently without a connection (the note is then left empty).
- Expired photos are purged whenever the app opens or returns to the
  foreground, with an OS-scheduled background task as a best-effort extra.

The UI is in Vietnamese.

## Stack

Expo SDK 58, React Native, expo-router (tabs), TypeScript, Be Vietnam Pro,
`@expo/vector-icons`, expo-sqlite, expo-camera,
expo-location, expo-notifications, expo-background-task.

## Getting started

```bash
npm install
npm test                       # unit tests (domain logic and parking service)
npx tsc --noEmit               # typecheck
npx expo run:ios --device      # or: npx expo run:android
```

The app needs a development build; Expo Go does not include every native module
used here.

## Project layout

```
src/app/         expo-router screens: the (tabs) group holds Home and History; Capture and Record detail are Stack routes outside the tabs
src/ui/          theme, shared components (Text, tab bar, cards), fonts
src/domain/      pure logic: expiry, current spot, history filter, reminders
src/services/    parking service and its ports (repository, files, gallery)
src/native/      adapters for SQLite, file system, gallery, GPS, notifications
src/background/  background purge task
src/hooks/       useParking
tests/           Jest tests (the service is tested against in-memory fakes)
docs/superpowers design spec and implementation plan
```

Design: `docs/superpowers/specs/2026-11-17-ui-redesign-v2-design.md` (current). The earlier `2026-11-17-parking-photo-app-design.md` and `2026-11-17-ui-redesign-design.md` specs are superseded.
