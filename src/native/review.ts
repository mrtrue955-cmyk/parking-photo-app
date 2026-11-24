import * as StoreReview from 'expo-store-review';
import { shouldRequestReview } from '../domain/review';

/**
 * Shows the system rating prompt once the driver has saved a few spots.
 * The caller persists `reviewAsked` when this returns true.
 */
export async function requestReviewIfDue(
  captureCount: number,
  reviewAsked: boolean,
): Promise<boolean> {
  if (!shouldRequestReview(captureCount, reviewAsked)) return false;
  try {
    if (!(await StoreReview.isAvailableAsync())) return false;
    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
