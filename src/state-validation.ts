import { makePlan, validateInput } from './planner';
import type { DayPlan, Pace, PersistedState, PlanInput, StudyPlan } from './types';

const INPUT_KEYS = ['deckName', 'reviewCards', 'newCards', 'examDate', 'dailyMinutes', 'secondsPerReview', 'secondsPerNew', 'reviewPasses', 'newRepetitions', 'pace'];
const DAY_KEYS = ['date', 'newCards', 'reviews', 'minutes', 'overCap', 'completed'];
const PLAN_KEYS = ['id', 'createdAt', 'input', 'days', 'requiredMinutes', 'availableMinutes', 'unscheduledNew', 'unscheduledReviews'];
const STATE_KEYS = ['input', 'sourceRows', 'updatedAt', 'plan'];

function record(value: unknown, keys: string[], optional: string[] = []): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = keys.filter((key) => !optional.includes(key)).sort();
  return actual.every((key) => keys.includes(key)) && expected.every((key) => actual.includes(key));
}

function integer(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

function isoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.toISOString() === value;
}

function input(value: unknown, allowEmptyDeck = true): value is PlanInput {
  if (!record(value, INPUT_KEYS)) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.deckName === 'string'
    && candidate.deckName.trim().length <= 200
    && (allowEmptyDeck || candidate.deckName.trim().length > 0)
    && integer(candidate.reviewCards, 0, 10_000_000)
    && integer(candidate.newCards, 0, 10_000_000)
    && isoDate(candidate.examDate)
    && integer(candidate.dailyMinutes, 5, 720)
    && integer(candidate.secondsPerReview, 3, 300)
    && integer(candidate.secondsPerNew, 5, 600)
    && integer(candidate.reviewPasses, 1, 10)
    && integer(candidate.newRepetitions, 1, 10)
    && ['steady', 'front-loaded', 'gentle-ramp'].includes(candidate.pace as Pace);
}

function sameInput(left: PlanInput, right: PlanInput): boolean {
  return INPUT_KEYS.every((key) => left[key as keyof PlanInput] === right[key as keyof PlanInput]);
}

function sameDay(left: DayPlan, right: DayPlan): boolean {
  return DAY_KEYS.filter((key) => key !== 'completed').every((key) => left[key as keyof DayPlan] === right[key as keyof DayPlan]);
}

function plan(value: unknown): value is StudyPlan {
  if (!record(value, PLAN_KEYS)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || !candidate.id || candidate.id.length > 200 || !timestamp(candidate.createdAt) || !input(candidate.input, false)
    || !Array.isArray(candidate.days) || !integer(candidate.requiredMinutes, 0, 1_000_000_000)
    || !integer(candidate.availableMinutes, 0, 1_000_000_000) || !integer(candidate.unscheduledNew, 0, 100_000_000)
    || !integer(candidate.unscheduledReviews, 0, 1_000_000_000) || candidate.days.length < 1 || candidate.days.length > 3_660) return false;

  const days = candidate.days as unknown[];
  if (!days.every((day) => record(day, DAY_KEYS) && isoDate(day.date) && integer(day.newCards, 0, 10_000_000)
    && integer(day.reviews, 0, 100_000_000) && integer(day.minutes, 0, 735)
    && typeof day.overCap === 'boolean' && typeof day.completed === 'boolean')) return false;

  const firstDate = (days[0] as DayPlan).date;
  const planInput = candidate.input as PlanInput;
  if (validateInput(planInput, firstDate).length) return false;

  const expected = makePlan(planInput, firstDate);
  const stored = candidate as unknown as StudyPlan;
  return expected.days.length === stored.days.length
    && expected.days.every((day, index) => sameDay(day, stored.days[index]))
    && expected.requiredMinutes === stored.requiredMinutes
    && expected.availableMinutes === stored.availableMinutes
    && expected.unscheduledNew === stored.unscheduledNew
    && expected.unscheduledReviews === stored.unscheduledReviews;
}

/**
 * Parses only the versionless backup shape the app itself exports. The
 * returned copy contains no caller-owned objects, so an invalid import can
 * never mutate the active in-memory plan before it has passed validation.
 */
export function parsePersistedState(value: unknown): PersistedState | undefined {
  if (!record(value, STATE_KEYS, ['plan', 'sourceRows'])) return undefined;
  const candidate = value as Record<string, unknown>;
  if (!input(candidate.input) || !timestamp(candidate.updatedAt)
    || (candidate.sourceRows !== undefined && !integer(candidate.sourceRows, 0, 10_000_000))
    || (candidate.plan !== undefined && !plan(candidate.plan))) return undefined;

  const parsed = candidate as unknown as PersistedState;
  if (parsed.plan && !sameInput(parsed.input, parsed.plan.input)) return undefined;
  return structuredClone(parsed);
}
