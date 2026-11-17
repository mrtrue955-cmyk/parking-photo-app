# Parking Photo App

Take a photo of where you parked, and let it delete itself after 30 days.

Photos are stored in the app's private storage, never in the Gallery, so
supermarket pillar photos stop piling up in your camera roll. Everything stays
on the device: there is no backend and no network code.

## Features

- Capture a parking spot with a photo, GPS position and a short note.
- Home shows the current spot (with a "navigate back to the car" button and
  "I got my car") and a history of earlier spots.
- Each photo is deleted 30 days after it was taken. A reminder notification is
  scheduled the day before.
- "Giữ lại" (keep) saves a photo to the Gallery and exempts it from deletion.
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
src/app/         expo-router screens: (tabs) group (Home, History, Capture) and Record detail
src/ui/          theme, shared components (Text, tab bar, cards), fonts
src/domain/      pure logic: expiry, current spot, reminders
src/services/    parking service and its ports (repository, files, gallery)
src/native/      adapters for SQLite, file system, gallery, GPS, notifications
src/background/  background purge task
src/hooks/       useParking
tests/           Jest tests (the service is tested against in-memory fakes)
docs/superpowers design spec and implementation plan
```

Design: `docs/superpowers/specs/2026-11-17-parking-photo-app-design.md`.
