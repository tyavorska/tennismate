import { describe, expect, it } from 'vitest';
import { describeRating, estimateRating, quizQuestions } from './levelQuiz';

describe('estimateRating', () => {
  it('rounds the mean of the answers to the nearest half step', () => {
    expect(estimateRating([3, 3.5, 3.5, 3.5, 3.5, 3.5])).toBe(3.5);
    expect(estimateRating([3, 3, 3, 3, 3.5, 3.5])).toBe(3);
  });

  it('never goes below 2.5', () => {
    expect(estimateRating([1, 1, 1])).toBe(2.5);
  });

  it('never goes above 5', () => {
    expect(estimateRating([6, 7, 7])).toBe(5);
  });

  it('returns the lowest rating when nothing was answered', () => {
    expect(estimateRating([])).toBe(2.5);
  });
});

describe('describeRating', () => {
  it('has a description for every rating the quiz can return', () => {
    const ratings = quizQuestions.flatMap((question) =>
      question.options.map((option) => estimateRating([option.rating])),
    );

    for (const rating of new Set(ratings)) {
      expect(describeRating(rating)).not.toBe('');
    }
  });
});

describe('quizQuestions', () => {
  it('has five answers for each question', () => {
    expect(quizQuestions.every((question) => question.options.length === 5)).toBe(true);
  });
});
