import ParkedSpot from './parkedSpot';
import type { ParkedSpotProps } from './parkedSpot';

export { parkedWidgetProps } from './props';

/** Best effort: a widget failure must never break the screen that refreshed the data. */
export function syncParkedWidget(props: ParkedSpotProps): void {
  try {
    ParkedSpot.updateSnapshot(props);
  } catch (error) {
    console.warn('Failed to update the parked widget', error);
  }
}
