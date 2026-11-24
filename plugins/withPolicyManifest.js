const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

// Permissions the app never asks for. Expo's base manifest ships them as
// "optional" and expo-media-library adds the media-read family; Play treats
// both the overlay and broad photo access as sensitive.
const DROP_PERMISSIONS = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
];

const PRECISE_LOCATION =
  'Cho phép app dùng vị trí chính xác để dẫn bạn về đúng cột xe.';

/**
 * Keeps the shipped permission set equal to what the app actually uses:
 * camera, location, notifications and writing one photo. Runs last so it can
 * undo what the other config plugins add.
 */
module.exports = function withPolicyManifest(config) {
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest['uses-permission'] = (manifest['uses-permission'] ?? []).filter(
      (entry) => !DROP_PERMISSIONS.includes(entry.$['android:name']),
    );
    const application = manifest.application?.[0];
    if (application) {
      delete application.$['android:requestLegacyExternalStorage'];
      application.$['android:allowBackup'] = 'false';
    }
    return cfg;
  });

  config = withInfoPlist(config, (cfg) => {
    // The app only writes to the photo library (write-only permission).
    delete cfg.modResults.NSPhotoLibraryUsageDescription;
    delete cfg.modResults.NSMotionUsageDescription;
    cfg.modResults['expo.location.motionActivityEnabled'] = 'false';
    cfg.modResults.NSLocationTemporaryUsageDescriptionDictionary = {
      ExpoLocationFullAccuracy: PRECISE_LOCATION,
    };
    return cfg;
  });

  return config;
};
