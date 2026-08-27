import type { DayPlan, Pace, PlanInput, StudyPlan } from './types';

const iso = (date: Date) => date.toISOString().slice(0, 10);

export function localToday(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return iso(local);
}

export function studyDates(start: string, examDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T12:00:00Z`);
  const exam = new Date(`${examDate}T12:00:00Z`);
  while (cursor < exam) {
    dates.push(iso(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function weights(count: number, pace: Pace): number[] {
  if (count <= 1) return [1];
  return Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    if (pace === 'front-loaded') return 1.35 - progress * 0.7;
    if (pace === 'gentle-ramp') return 0.65 + progress * 0.7;
    return 1;
  });
}

function allocate(total: number, dayWeights: number[]): number[] {
  if (total <= 0) return dayWeights.map(() => 0);
  const sum = dayWeights.reduce((value, item) => value + item, 0);
  const raw = dayWeights.map((weight) => (total * weight) / sum);
  const result = raw.map(Math.floor);
  let remainder = total - result.reduce((value, item) => value + item, 0);
  raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ index }) => {
      if (remainder > 0) {
        result[index] += 1;
        remainder -= 1;
      }
    });
  return result;
}

export function validateInput(input: PlanInput, start = localToday()): string[] {
  const errors: string[] = [];
  if (!input.deckName.trim()) errors.push('Give this deck a name.');
  if (input.reviewCards < 0 || input.newCards < 0) errors.push('Card counts cannot be negative.');
  if (input.reviewCards + input.newCards < 1) errors.push('Add at least one card.');
  if (!input.examDate || studyDates(start, input.examDate).length < 1) errors.push('Choose an exam date after today.');
  if (input.dailyMinutes < 5 || input.dailyMinutes > 720) errors.push('Daily time must be between 5 and 720 minutes.');
  if (input.secondsPerReview < 3 || input.secondsPerNew < 5) errors.push('Card timings are too short to make a useful plan.');
  return errors;
}

export function makePlan(input: PlanInput, start = localToday()): StudyPlan {
  const errors = validateInput(input, start);
  if (errors.length) throw new Error(errors.join(' '));
  const dates = studyDates(start, input.examDate);
  const reviewVisits = input.reviewCards * input.reviewPasses + input.newCards * Math.max(0, input.newRepetitions - 1);
  const requiredSeconds = input.newCards * input.secondsPerNew + reviewVisits * input.secondsPerReview;
  const maxSeconds = (input.dailyMinutes + 15) * 60;
  const capSeconds = input.dailyMinutes * 60;
  const pattern = weights(dates.length, input.pace);
  const newPattern = pattern.map((weight, index) => index < Math.max(1, Math.ceil(dates.length * 0.65)) ? weight : 0.04);
  const proposedNew = allocate(input.newCards, newPattern);
  const proposedReviews = allocate(reviewVisits, pattern);
  let leftNew = input.newCards;
  let leftReviews = reviewVisits;

  const days: DayPlan[] = dates.map((date, index) => {
    let newCards = Math.min(leftNew, proposedNew[index]);
    let reviews = Math.min(leftReviews, proposedReviews[index]);
    let seconds = newCards * input.secondsPerNew + reviews * input.secondsPerReview;
    while (seconds > maxSeconds && (reviews > 0 || newCards > 0)) {
      if (reviews > 0) reviews -= 1;
      else newCards -= 1;
      seconds = newCards * input.secondsPerNew + reviews * input.secondsPerReview;
    }
    leftNew -= newCards;
    leftReviews -= reviews;
    return { date, newCards, reviews, minutes: Math.ceil(seconds / 60), overCap: seconds > capSeconds, completed: false };
  });

  // Place rounding leftovers wherever capacity remains, staying inside the 15-minute safety band.
  for (const day of days) {
    while (leftNew > 0 && day.minutes * 60 + input.secondsPerNew <= maxSeconds) {
      day.newCards += 1; leftNew -= 1;
      day.minutes = Math.ceil((day.newCards * input.secondsPerNew + day.reviews * input.secondsPerReview) / 60);
    }
    while (leftReviews > 0 && day.minutes * 60 + input.secondsPerReview <= maxSeconds) {
      day.reviews += 1; leftReviews -= 1;
      day.minutes = Math.ceil((day.newCards * input.secondsPerNew + day.reviews * input.secondsPerReview) / 60);
    }
    day.overCap = day.minutes > input.dailyMinutes;
  }

  return {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(), input: { ...input }, days,
    requiredMinutes: Math.ceil(requiredSeconds / 60),
    availableMinutes: dates.length * input.dailyMinutes,
    unscheduledNew: leftNew,
    unscheduledReviews: leftReviews,
  };
}
