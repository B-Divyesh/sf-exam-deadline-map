import { describe, expect, it } from 'vitest';
import { makePlan, studyDates, validateInput } from './planner';
import type { PlanInput } from './types';

const input: PlanInput = { deckName: 'Biology', reviewCards: 100, newCards: 20, examDate: '2026-09-11', dailyMinutes: 30, secondsPerReview: 10, secondsPerNew: 30, reviewPasses: 2, newRepetitions: 3, pace: 'steady' };

describe('deadline planner', () => {
  it('uses every day before the exam but not exam day', () => {
    const dates = studyDates('2026-09-01', '2026-09-04');
    expect(dates).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
  });

  it('schedules all feasible visits and stays within the overflow band', () => {
    const plan = makePlan(input, '2026-09-01');
    expect(plan.unscheduledNew + plan.unscheduledReviews).toBe(0);
    expect(plan.days.every((day) => day.minutes <= 45)).toBe(true);
    expect(plan.days.reduce((sum, day) => sum + day.newCards, 0)).toBe(20);
    expect(plan.days.reduce((sum, day) => sum + day.reviews, 0)).toBe(240);
  });

  it('reports work that cannot fit instead of making impossible days', () => {
    const plan = makePlan({ ...input, reviewCards: 100_000, examDate: '2026-09-03', dailyMinutes: 5 }, '2026-09-01');
    expect(plan.unscheduledReviews).toBeGreaterThan(0);
    expect(plan.days.every((day) => day.minutes <= 20)).toBe(true);
  });

  it('rejects past deadlines and empty decks', () => {
    expect(validateInput({ ...input, examDate: '2026-08-01', newCards: 0, reviewCards: 0 }, '2026-09-01').length).toBeGreaterThan(1);
  });
});
