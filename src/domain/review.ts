/** Asking for a rating only after the habit is formed, and only once. */
export const REVIEW_AFTER_SAVES = 3;

export function shouldRequestReview(captureCount: number, reviewAsked: boolean): boolean {
  return !reviewAsked && captureCount >= REVIEW_AFTER_SAVES;
}
