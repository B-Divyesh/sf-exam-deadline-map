import { describe, expect, it } from 'vitest';
import { makePlan } from './planner';
import { parsePersistedState } from './state-validation';
import type { PersistedState, PlanInput } from './types';

const input: PlanInput = {
  deckName: 'Biology', reviewCards: 100, newCards: 20, examDate: '2026-09-11', dailyMinutes: 30,
  secondsPerReview: 10, secondsPerNew: 30, reviewPasses: 2, newRepetitions: 3, pace: 'steady',
};

function backup(): PersistedState {
  return { input, plan: makePlan(input, '2026-09-01'), updatedAt: '2026-09-01T10:00:00.000Z', sourceRows: 120 };
}

describe('backup validation', () => {
  it('rejects the exact parseable malformed import without changing the caller object', () => {
    const malformed = JSON.parse('{"input":{}}');
    expect(parsePersistedState(malformed)).toBeUndefined();
    expect(malformed).toEqual({ input: {} });
  });

  it('accepts a complete exported backup and returns an isolated copy', () => {
    const original = backup();
    const parsed = parsePersistedState(original);
    expect(parsed).toEqual(original);
    expect(parsed).not.toBe(original);
    parsed!.input.deckName = 'Changed only in the parsed copy';
    expect(original.input.deckName).toBe('Biology');
  });

  it('rejects a plan whose schedule was edited after export', () => {
    const tampered = backup();
    tampered.plan!.days[0].minutes += 1;
    expect(parsePersistedState(tampered)).toBeUndefined();
  });
});
