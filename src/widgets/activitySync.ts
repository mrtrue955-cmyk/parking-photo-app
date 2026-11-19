import ParkedActivity, { type ParkedActivityProps } from './parkedActivity';

let lastPayload: string | null = null;

/** Starts, updates or ends the Lock Screen activity to match the current spot. */
export function syncParkedActivity(props: ParkedActivityProps | null): void {
  try {
    const instances = ParkedActivity.getInstances();
    if (!props) {
      lastPayload = null;
      for (const instance of instances) {
        instance.end('immediate').catch(() => undefined);
      }
      return;
    }
    const payload = JSON.stringify(props);
    const active = instances[instances.length - 1];
    if (!active) {
      ParkedActivity.start(props);
      lastPayload = payload;
      return;
    }
    // Re-rendering on an unchanged payload would burn the system's update budget.
    if (payload === lastPayload) return;
    active.update(props).catch(() => undefined);
    lastPayload = payload;
  } catch (error) {
    console.warn('Failed to sync the parked activity', error);
  }
}
