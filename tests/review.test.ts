import { REVIEW_AFTER_SAVES, shouldRequestReview } from '../src/domain/review';

test('the rating prompt waits for the third save', () => {
  expect(shouldRequestReview(0, false)).toBe(false);
  expect(shouldRequestReview(REVIEW_AFTER_SAVES - 1, false)).toBe(false);
  expect(shouldRequestReview(REVIEW_AFTER_SAVES, false)).toBe(true);
  expect(shouldRequestReview(REVIEW_AFTER_SAVES + 5, false)).toBe(true);
});

test('it never asks twice', () => {
  expect(shouldRequestReview(REVIEW_AFTER_SAVES, true)).toBe(false);
  expect(shouldRequestReview(99, true)).toBe(false);
});
