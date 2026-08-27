export type Pace = 'steady' | 'front-loaded' | 'gentle-ramp';

export interface PlanInput {
  deckName: string;
  reviewCards: number;
  newCards: number;
  examDate: string;
  dailyMinutes: number;
  secondsPerReview: number;
  secondsPerNew: number;
  reviewPasses: number;
  newRepetitions: number;
  pace: Pace;
}

export interface DayPlan {
  date: string;
  newCards: number;
  reviews: number;
  minutes: number;
  overCap: boolean;
  completed: boolean;
}

export interface StudyPlan {
  id: string;
  createdAt: string;
  input: PlanInput;
  days: DayPlan[];
  requiredMinutes: number;
  availableMinutes: number;
  unscheduledNew: number;
  unscheduledReviews: number;
}

export interface PersistedState {
  plan?: StudyPlan;
  input: PlanInput;
  sourceRows?: number;
  updatedAt: string;
}
