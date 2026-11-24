export const RETENTION_OPTIONS = [7, 30, 60] as const;
export type RetentionDays = (typeof RETENTION_OPTIONS)[number];

import { DEFAULT_LEVEL_STYLE, LEVEL_STYLES, type LevelStyle } from './levelStyle';

export const LANGUAGES = ['system', 'vi', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export type AppSettings = {
  /** UI and notification language; "system" follows the device. */
  language: Language;
  /** How floor labels are written: B1, 1F, P1, L1, G, or -1. */
  levelStyle: LevelStyle;
  /** How long a photo is kept before it is deleted automatically. */
  retentionDays: RetentionDays;
  /** Whether the app schedules "photo will be deleted tomorrow" reminders. */
  remindersEnabled: boolean;
  /** Whether the app watches a geofence around the parked spot. */
  geofenceEnabled: boolean;
  /** Skip the review step and save the moment the shutter fires. */
  quickSave: boolean;
  /** Whether the three-step intro has been seen. */
  onboarded: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'system',
  levelStyle: DEFAULT_LEVEL_STYLE,
  retentionDays: 30,
  remindersEnabled: true,
  geofenceEnabled: false,
  quickSave: false,
  onboarded: false,
};

export function isRetentionDays(value: unknown): value is RetentionDays {
  return RETENTION_OPTIONS.includes(value as RetentionDays);
}

/** Tolerant parse of stored settings: unknown or corrupt values fall back to defaults. */
export function parseSettings(raw: unknown): AppSettings {
  const value = (raw ?? {}) as Partial<Record<keyof AppSettings, unknown>>;
  return {
    language: LANGUAGES.includes(value.language as Language)
      ? (value.language as Language)
      : DEFAULT_SETTINGS.language,
    levelStyle: LEVEL_STYLES.includes(value.levelStyle as LevelStyle)
      ? (value.levelStyle as LevelStyle)
      : DEFAULT_SETTINGS.levelStyle,
    retentionDays: isRetentionDays(value.retentionDays)
      ? value.retentionDays
      : DEFAULT_SETTINGS.retentionDays,
    remindersEnabled:
      typeof value.remindersEnabled === 'boolean'
        ? value.remindersEnabled
        : DEFAULT_SETTINGS.remindersEnabled,
    geofenceEnabled:
      typeof value.geofenceEnabled === 'boolean'
        ? value.geofenceEnabled
        : DEFAULT_SETTINGS.geofenceEnabled,
    quickSave: typeof value.quickSave === 'boolean' ? value.quickSave : DEFAULT_SETTINGS.quickSave,
    onboarded: typeof value.onboarded === 'boolean' ? value.onboarded : DEFAULT_SETTINGS.onboarded,
  };
}
