# Release runbook

How this app gets onto TestFlight (iOS) and Google Play (Android) with EAS.
The build profiles live in `eas.json`; the version lives in `app.json`.

## Before the first build

1. **Accounts**
   - Expo account (free) — `npx eas-cli login`
   - Apple Developer Program membership (paid) for TestFlight
   - Google Play Console account for Android
2. **App Store Connect record** — create the app once at
   <https://appstoreconnect.apple.com> with bundle id `com.huutech.parkingphoto`.
   TestFlight uploads fail without it.
3. **Link the repo to EAS** (once per machine/account):

   ```bash
   npx eas-cli init
   ```

   This writes `extra.eas.projectId` into `app.json`. Commit that change.

## iOS → TestFlight

```bash
npx eas-cli build -p ios --profile production   # or: npm run build:ios
npx eas-cli submit -p ios --profile production  # or: npm run submit:ios
```

EAS asks for Apple credentials on the first run and stores them on its servers:
either an Apple ID plus an app-specific password, or an App Store Connect API
key. It then creates the distribution certificate and provisioning profile.

After the upload, open App Store Connect → TestFlight. The build shows
"Processing" for a few minutes, then you can add internal testers.

## Versions and build numbers

| Field | Where | Who owns it |
|---|---|---|
| Marketing version (`1.0.0`) | `expo.version` in `app.json` | you, bumped by hand |
| iOS build number | `expo.ios.buildNumber` | EAS (`appVersionSource: "remote"`, `autoIncrement` on the production profile) |
| Android version code | `expo.android.versionCode` | EAS, same mechanism |

The values in `app.json` are the seed for local builds. With the remote source,
EAS keeps a monotonic counter per platform, so you never have to bump them for
store uploads.

## Profiles

| Profile | Use |
|---|---|
| `development` | dev client on the iOS simulator, hot reload through Metro |
| `development-device` | dev client on a registered iPhone |
| `preview` | internal distribution build, no dev menu |
| `production` | store build, auto-incremented build number |

## Compliance notes

- `ITSAppUsesNonExemptEncryption = false` is set in `app.json`, so App Store
  Connect stops asking the export-compliance question on every upload.
- The app collects nothing: no account, no analytics, no backend. Answers in the
  App Store privacy questionnaire and the Play Data safety form should say
  "no data collected". Photo-library access is only used when the user taps
  "Keep", and camera/location stay on device.
- A **privacy policy URL** is required in App Store Connect before the first
  TestFlight build can be shared externally.

## Android

```bash
npx eas-cli build -p android --profile production   # or: npm run build:android
```

Upload the `.aab` manually to the Play Console, or add a service-account key and
run `npx eas-cli submit -p android --profile production`.

## Clean clone

`ios/` and `android/` are generated. After cloning:

```bash
npm install
npx expo prebuild -p ios     # needs LANG=en_US.UTF-8 on this machine for CocoaPods
npx expo run:ios
```
