export const RETENTION_OPTIONS = [7, 30, 60] as const;
export type RetentionDays = (typeof RETENTION_OPTIONS)[number];

export type AppSettings = {
  /** How long a photo is kept before it is deleted automatically. */
  retentionDays: RetentionDays;
  /** Whether the app schedules "photo will be deleted tomorrow" reminders. */
  remindersEnabled: boolean;
  /** Whether the app watches a geofence around the parked spot. */
  geofenceEnabled: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  retentionDays: 30,
  remindersEnabled: true,
  geofenceEnabled: false,
};

export function isRetentionDays(value: unknown): value is RetentionDays {
  return RETENTION_OPTIONS.includes(value as RetentionDays);
}

/** Tolerant parse of stored settings: unknown or corrupt values fall back to defaults. */
export function parseSettings(raw: unknown): AppSettings {
  const value = (raw ?? {}) as Partial<Record<keyof AppSettings, unknown>>;
  return {
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
  };
}
